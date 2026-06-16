import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { BOOST_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

const BOOST_OPTIONS = [
  {
    key: "highlight",
    icon: BOOST_META.highlight.icon,
    label: BOOST_META.highlight.label,
    description: "Yukingiz boshqalardan yaqqol ko'rinadi",
    credits: 1,
    actionType: "highlight_purchase",
    color: BOOST_META.highlight.color,
    selectedColor: BOOST_META.highlight.selected,
    badgeColor: BOOST_META.highlight.badge,
  },
  {
    key: "vip",
    icon: BOOST_META.vip.icon,
    label: BOOST_META.vip.label,
    description: "Ishonchli va oldingi qator",
    credits: 2,
    actionType: "vip_purchase",
    color: BOOST_META.vip.color,
    selectedColor: BOOST_META.vip.selected,
    badgeColor: BOOST_META.vip.badge,
  },
  {
    key: "pin",
    icon: BOOST_META.pin.icon,
    label: BOOST_META.pin.label,
    description: "24 soat birinchi qatorda turadi",
    credits: 4,
    actionType: "pin_purchase",
    color: BOOST_META.pin.color,
    selectedColor: BOOST_META.pin.selected,
    badgeColor: BOOST_META.pin.badge,
  },
  {
    key: "urgent",
    icon: BOOST_META.urgent.icon,
    label: BOOST_META.urgent.label,
    description: "Tez haydovchi topish uchun",
    credits: 5,
    actionType: "highlight_purchase",
    color: BOOST_META.urgent.color,
    selectedColor: BOOST_META.urgent.selected,
    badgeColor: BOOST_META.urgent.badge,
  },
  {
    key: "zaril",
    icon: BOOST_META.zaril.icon,
    label: BOOST_META.zaril.label,
    description: "Eng tez ko'rinish — top + ajralib turish birgalikda",
    credits: 7,
    actionType: "vip_purchase",
    color: BOOST_META.zaril.color,
    selectedColor: BOOST_META.zaril.selected,
    badgeColor: BOOST_META.zaril.badge,
  },
];

export { BOOST_OPTIONS };

export default function BoostOptions({ selected, onChange, walletBalance }) {
  const toggle = (key) => {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  };

  const totalCost = BOOST_OPTIONS.filter((o) => selected.includes(o.key)).reduce((s, o) => s + o.credits, 0);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
          <Icon name="boltLightning" size="md" className="text-yellow-500" />
          E'lonni kuchaytirish
        </p>
        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md">ixtiyoriy</span>
      </div>

      <div className="space-y-2">
        {BOOST_OPTIONS.map(({ key, icon, label, description, credits, color, selectedColor, badgeColor }) => {
          const isSelected = selected.includes(key);
          const canAfford = (walletBalance || 0) >= credits;
          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.98 }}
              onClick={() => canAfford && toggle(key)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl px-3 py-3 border bg-gradient-to-r transition-all text-left",
                isSelected ? selectedColor : color,
                !canAfford && !isSelected && "opacity-50"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0",
                isSelected ? "bg-primary border-primary" : "border-muted-foreground/40 bg-white"
              )}>
                {isSelected && <Icon name="check" size="xs" className="text-white" />}
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0">
                <Icon name={icon} size="md" className={isSelected ? "text-foreground" : "text-muted-foreground"} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-extrabold text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{description}</p>
              </div>
              <span className={cn(
                "text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap",
                isSelected ? badgeColor : "bg-white text-muted-foreground border border-border"
              )}>
                {credits} bonus
              </span>
            </motion.button>
          );
        })}
      </div>

      {totalCost > 0 && (
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between pt-2.5 border-t border-border"
        >
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Icon name="receipt" size="sm" />
            Jami sarflash:
          </span>
          <span className="font-extrabold text-primary text-lg">{totalCost} bonus</span>
        </motion.div>
      )}

      {walletBalance === 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-amber-700">
          <Icon name="circleInfo" size="sm" />
          <p className="text-[11px] font-medium">Bonus olish uchun Profil → Hamyon bo'limiga o'ting</p>
        </div>
      )}
    </div>
  );
}
