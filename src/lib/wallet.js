// Wallet helpers — thin wrappers around the backend wallet endpoints.
// Every mutation also creates an AdminNotification on the server side, so
// we don't need to do that here.

import { db } from "@/api/base44Client";

/**
 * Fetch the current wallet, creating one server-side if it doesn't exist
 * yet (the backend does this on the GET /wallet/me endpoint).
 */
export async function getOrCreateWallet(_user) {
  return await db.wallet.me();
}

/** Add bonus credits. Backend logs an AdminNotification. */
export async function addCredits(_wallet, credits, label, demoAmount, _user) {
  return await db.wallet.buyCredits({
    credits,
    label,
    demo_amount: demoAmount,
  });
}

/** Spend credits on a boost. Throws on insufficient balance. */
export async function spendCredits(_wallet, amount, actionType, label, _user) {
  try {
    return await db.wallet.spend({ amount, action_type: actionType, label });
  } catch (e) {
    if (e.status === 402) return null; // not enough
    throw e;
  }
}

/** Activate / extend premium subscription. Costs 20 credits. */
export async function activatePremium(_wallet, _user) {
  try {
    return await db.wallet.activatePremium();
  } catch (e) {
    if (e.status === 402) {
      const err = new Error("Insufficient credits");
      err.code = "INSUFFICIENT_CREDITS";
      throw err;
    }
    throw e;
  }
}
