import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { CARGO_TYPES, TRANSPORT_TYPES } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

function formatPrice(load) {
  if (!load.price) return { primary: "Kelishiladi", secondary: null };
  if (load.currency === "USD") return { primary: `$${load.price.toLocaleString()}`, secondary: null };
  return { primary: `${load.price.toLocaleString()}`, secondary: "so'm" };
}

export default function LoadCard({ load, matchScore }) {
  const cargo = CARGO_TYPES[load.cargo_type] || CARGO_TYPES.boshqa;
  const transport = TRANSPORT_TYPES[load.transport_type];
  const price = formatPrice(load);
  const timeAgo = load.created_date
    ? formatDistanceToNow(new Date(load.created_date), { addSuffix: true })
    : "";

  const isHighlight = load.is_highlight;
  const isVip       = load.is_vip;
  const isPin       = load.is_pin;
  const isUrgent    = load.is_urgent;
  const isMatch     = matchScore !== undefined && matchScore > 30;

  // Decorative wrapper for highlighted (rainbow) or VIP cards
  const wrapperClass = isHighlight
    ? "rainbow-card"
    : isVip
      ? "vip-card"
      : isPin
        ? "pin-card"
        : isUrgent
          ? "urgent-card"
          : "bg-card border border-border hover:border-primary/40 hover:shadow-md";

  // Card text colors depend on bg
  const tone = isHighlight ? "white" : isVip ? "amber-950" : isPin ? "blue-950" : isUrgent ? "red-950" : "foreground";
  const toneSubtle = isHighlight ? "white/70" : isVip ? "amber-900/70" : isPin ? "blue-900/70" : isUrgent ? "red-900/70" : "muted-foreground";
  const toneMuted = isHighlight ? "white/50" : isVip ? "amber-900/50" : isPin ? "blue-900/50" : isUrgent ? "red-900/50" : "muted-foreground/60";

  return (
    <Link to={`/loads/${load.id}`} className="block press">
      <div className={cn("relative rounded-2xl p-4 transition-all overflow-hidden", wrapperClass)}>
        {isHighlight && <div className="rainbow-shimmer" />}

        {/* Badges row */}
        {(isPin || isUrgent || isVip || isHighlight || isMatch) && (
          <div className="flex items-center gap-1.5 mb-2.5 flex-wrap relative z-10">
            {isPin && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-sky-600 text-white px-2 py-1 rounded-md">
                <Icon name="mapPin" size="xs" /> TEPADA
              </span>
            )}
            {isUrgent && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-red-600 text-white px-2 py-1 rounded-md">
                <Icon name="fire" size="xs" /> SHOSHILINCH
              </span>
            )}
            {isVip && (
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-1 rounded-md",
                isHighlight ? "bg-white/25 text-white" : "bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900"
              )}>
                <Icon name="star" size="xs" /> TANLANGAN
              </span>
            )}
            {isHighlight && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-white/30 text-white px-2 py-1 rounded-md backdrop-blur">
                <Icon name="palette" size="xs" /> AJRALIB
              </span>
            )}
            {isMatch && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500 text-white px-2 py-1 rounded-md">
                <Icon name="check" size="xs" /> MOS
              </span>
            )}
          </div>
        )}

        {/* Route */}
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <div className="flex-1 min-w-0">
            <p className={cn("text-[10px] uppercase tracking-wider font-semibold", `text-${toneSubtle}`)}>Qayerdan</p>
            <p className={cn("font-extrabold text-base truncate", `text-${tone}`)}>{load.from_location}</p>
          </div>

          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <div className={cn("w-8 h-[2px] rounded-full", isHighlight ? "bg-white/40" : "bg-primary/40")} />
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", isHighlight ? "bg-white/15 backdrop-blur" : "bg-primary/10")}>
              <Icon name="arrowRight" size="sm" className={isHighlight ? "text-white" : "text-primary"} />
            </div>
            <div className={cn("w-8 h-[2px] rounded-full", isHighlight ? "bg-white/40" : "bg-primary/40")} />
          </div>

          <div className="flex-1 min-w-0 text-right">
            <p className={cn("text-[10px] uppercase tracking-wider font-semibold", `text-${toneSubtle}`)}>Qayerga</p>
            <p className={cn("font-extrabold text-base truncate", `text-${tone}`)}>{load.to_location}</p>
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3 relative z-10">
          <span className={cn(
            "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border",
            isHighlight
              ? "bg-white/20 text-white border-white/30 backdrop-blur"
              : isVip
                ? "bg-amber-50/80 text-amber-800 border-amber-200"
                : isPin
                  ? "bg-sky-50/80 text-sky-800 border-sky-200"
                  : isUrgent
                    ? "bg-red-50/80 text-red-800 border-red-200"
                    : cargo.color
          )}>
            <Icon name={cargo.icon} size="xs" />
            {cargo.label}
          </span>
          {transport && (
            <span className={cn(
              "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border",
              isHighlight
                ? "bg-white/20 text-white border-white/30"
                : "bg-muted/80 text-muted-foreground border-border"
            )}>
              <Icon name={transport.icon} size="xs" />
              {transport.label}
            </span>
          )}
          {load.weight && (
            <span className={cn(
              "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border",
              isHighlight
                ? "bg-white/20 text-white border-white/30"
                : "bg-muted/80 text-muted-foreground border-border"
            )}>
              <Icon name="weightScale" size="xs" />
              {load.weight} t
            </span>
          )}
          {load.views > 0 && (
            <span className={cn(
              "inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg",
              isHighlight ? "text-white/70" : "text-muted-foreground/70"
            )}>
              <Icon name="eye" size="xs" />
              {load.views}
            </span>
          )}
        </div>

        {/* Footer — price + time */}
        <div className="flex items-end justify-between relative z-10 pt-2 border-t border-current/10" style={{ borderColor: isHighlight ? "rgba(255,255,255,0.15)" : isVip ? "rgba(217,119,6,0.15)" : isPin ? "rgba(2,132,199,0.15)" : "hsl(var(--border))" }}>
          <div>
            <p className={cn("text-[10px] font-semibold uppercase tracking-wider", `text-${toneSubtle}`)}>Narx</p>
            <div className="flex items-baseline gap-1">
              <p className={cn("font-extrabold text-xl", isHighlight ? "text-white" : isVip ? "text-amber-900" : isPin ? "text-sky-900" : isUrgent ? "text-red-900" : "text-primary")}>
                {price.primary}
              </p>
              {price.secondary && (
                <span className={cn("text-sm font-semibold", `text-${toneSubtle}`)}>{price.secondary}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={cn("text-[10px] font-semibold uppercase tracking-wider", `text-${toneSubtle}`)}>{timeAgo.split(" ").slice(-1)[0] || ""}</p>
            <p className={cn("text-xs font-semibold", `text-${toneMuted}`)}>
              <Icon name="clock" size="xs" className="inline mr-1" />
              {timeAgo.replace("about ", "").replace("less than ", "<")}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
