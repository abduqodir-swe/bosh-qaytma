/**
 * BO'SH QAYTMA — Priority + Smart Matching Algorithm
 *
 * Priority tiers (always override recency / route score):
 *   Tier 5 — is_pin   (TEPADA TURISH)   → base 5000
 *   Tier 4 — is_urgent (SHOSHILINCH)    → base 4000
 *   Tier 3 — is_vip   (TANLANGAN YUK)  → base 3000
 *   Tier 2 — is_highlight (AJRALIB)     → base 2000
 *   Tier 1 — normal                     → base 0
 *
 * Within each tier, route match + price + recency (0–100 pts) decides order.
 * New posts CANNOT bypass a premium post in a higher tier.
 */

function computeRouteScore(load, driverFrom, driverTo) {
  let score = 0;
  const fromMatch = load.from_location?.toLowerCase() === driverTo?.toLowerCase();
  const toMatch = load.to_location?.toLowerCase() === driverFrom?.toLowerCase();
  if (fromMatch && toMatch) score += 50;
  else if (fromMatch) score += 30;
  else if (toMatch) score += 15;
  return score;
}

function computePriceScore(load) {
  if (!load.price || load.price <= 0) return 0;
  return Math.min(30, Math.floor(load.price / 100000 * 5));
}

function computeRecencyScore(load) {
  if (!load.created_date) return 0;
  const ageMs = Date.now() - new Date(load.created_date).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.max(0, 20 - Math.floor(ageDays * 4));
}

function getPriorityBase(load) {
  if (load.is_pin)     return 5000; // 🔝 TEPADA TURISH
  if (load.is_urgent)  return 4000; // 🚨 SHOSHILINCH
  if (load.is_vip)     return 3000; // ⭐ TANLANGAN YUK
  if (load.is_highlight) return 2000; // 🌈 AJRALIB TURISH
  return 0;
}

export function computeMatchScore(load, driverFrom, driverTo) {
  const routeScore    = computeRouteScore(load, driverFrom, driverTo);
  const priceScore    = computePriceScore(load);
  const recencyScore  = computeRecencyScore(load);
  return routeScore + priceScore + recencyScore;
}

export function rankLoads(loads, driverFrom, driverTo) {
  return [...loads]
    .map((load) => {
      const matchScore  = computeMatchScore(load, driverFrom, driverTo);
      const priorityBase = load.priority_score ?? getPriorityBase(load);
      return { ...load, _score: matchScore, _totalRank: priorityBase + matchScore };
    })
    .sort((a, b) => b._totalRank - a._totalRank);
}

export function filterLoads(loads, filters) {
  return loads.filter((load) => {
    if (filters.from && load.from_location?.toLowerCase() !== filters.from.toLowerCase()) return false;
    if (filters.to && load.to_location?.toLowerCase() !== filters.to.toLowerCase()) return false;
    if (filters.cargo_type && filters.cargo_type !== "all" && load.cargo_type !== filters.cargo_type) return false;
    if (filters.min_price && load.price < filters.min_price) return false;
    if (filters.max_price && load.price > filters.max_price) return false;
    if (filters.transport_type && filters.transport_type !== "all" && load.transport_type !== filters.transport_type) return false;
    return true;
  });
}