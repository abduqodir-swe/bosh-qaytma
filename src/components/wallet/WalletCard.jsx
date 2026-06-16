import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { addCredits, activatePremium } from "@/lib/wallet";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BONUS_PACKAGES = [
  { credits: 20,  price: "10,000 so'm",  label: "Starter",   popular: false, color: "from-sky-50 to-blue-50",     accent: "text-sky-600" },
  { credits: 50,  price: "20,000 so'm",  label: "Standard",  popular: true,  color: "from-primary/10 to-blue-100", accent: "text-primary" },
  { credits: 120, price: "40,000 so'm",  label: "Pro",       popular: false, color: "from-purple-50 to-fuchsia-50", accent: "text-purple-600" },
  { credits: 350, price: "100,000 so'm", label: "Business",  popular: false, color: "from-amber-50 to-orange-50", accent: "text-amber-600" },
];

export default function WalletCard({ wallet, user, onUpdate }) {
  const [buying, setBuying] = useState(null);

  const handleBuyBonus = async (pkg) => {
    if (!wallet || !user) return;
    setBuying(pkg.credits);
    try {
      const updated = await addCredits(wallet, pkg.credits, pkg.label, pkg.price, user);
      onUpdate(updated);
      toast.success(`+${pkg.credits} bonus hisobingizga qo'shildi!`, { icon: "🎉" });
    } catch (e) {
      toast.error("Xatolik yuz berdi");
    }
    setBuying(null);
  };

  const handlePremium = async () => {
    if (!wallet || !user) return;
    if ((wallet.balance || 0) < 20) {
      toast.error("Yetarli bonus yo'q. Avval bonus sotib oling.");
      return;
    }
    setBuying("premium");
    try {
      const updated = await activatePremium(wallet, user);
      onUpdate(updated);
      toast.success("Premium obuna faollashtirildi! 30 kunlik", { icon: "👑" });
    } catch (e) {
      toast.error("Xatolik yuz berdi");
    }
    setBuying(null);
  };

  return (
    <div className="space-y-3">
      {/* Balance Card */}
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-brand-gradient rounded-2xl p-5 text-primary-foreground overflow-hidden shadow-xl shadow-primary/30"
      >
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-grid" />
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-yellow-400/20 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-sky-300/20 blur-2xl" />

        <div className="relative flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
            <Icon name="wallet" size="md" className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Mening bonuslarim</p>
            <p className="text-xs font-bold text-white">Bonus ball</p>
          </div>
          {wallet?.premium_active && (
            <span className="ml-auto inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold px-2 py-1 rounded-md">
              <Icon name="crown" size="xs" /> PREMIUM
            </span>
          )}
        </div>

        <p className="relative text-5xl font-black tracking-tight">{wallet?.balance || 0}</p>
        <p className="relative text-sm text-white/70 mt-1 flex items-center gap-1.5">
          <Icon name="coins" size="xs" />
          bonus ball
        </p>
        {wallet?.premium_active && wallet?.premium_expires && (
          <div className="relative mt-3 pt-3 border-t border-white/15 flex items-center gap-1.5 text-xs text-white/80">
            <Icon name="calendar" size="xs" />
            Premium: {new Date(wallet.premium_expires).toLocaleDateString("uz-UZ")} gacha
          </div>
        )}
      </motion.div>

      {/* Bonus Packages */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
            <Icon name="cartShopping" size="sm" className="text-primary" />
            Bonus sotib olish
          </p>
          <span className="text-[10px] font-semibold text-muted-foreground">demo</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {BONUS_PACKAGES.map((pkg) => (
            <motion.button
              key={pkg.credits}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleBuyBonus(pkg)}
              disabled={buying === pkg.credits}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl px-3 py-3 border transition disabled:opacity-60",
                pkg.popular
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/30"
                  : "bg-card border-border hover:border-primary/40"
              )}
            >
              {pkg.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-[9px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                  <Icon name="fire" size="xs" /> MASHHUR
                </span>
              )}
              <Icon
                name="boltLightning"
                size="md"
                className={pkg.popular ? "text-white mb-1" : "text-yellow-500 mb-1"}
              />
              <span className={cn("font-black text-base", pkg.popular ? "text-white" : "text-foreground")}>{pkg.credits}</span>
              <span className={cn("text-[10px] font-semibold", pkg.popular ? "text-white/80" : "text-muted-foreground")}>bonus</span>
              <span className={cn(
                "text-[11px] font-bold mt-1 px-2 py-0.5 rounded-md",
                pkg.popular ? "bg-white/20 text-white" : "bg-muted text-foreground"
              )}>{pkg.price}</span>
              {buying === pkg.credits && <Icon name="spinner" size="xs" spin className="mt-1" />}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Premium Subscription */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handlePremium}
        disabled={buying === "premium" || wallet?.premium_active}
        className="w-full relative overflow-hidden bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 rounded-2xl p-4 flex items-center justify-between disabled:opacity-60 hover:shadow-2xl hover:shadow-yellow-300/50 transition-all shadow-lg shadow-yellow-200/60 btn-glow"
      >
        <div className="absolute inset-0 opacity-25 pointer-events-none"
          style={{ background: "radial-gradient(circle at 90% 50%, white 0%, transparent 50%)" }} />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center border border-white/40">
            <Icon name="crown" size="xl" className="text-yellow-900" />
          </div>
          <div className="text-left">
            <p className="font-extrabold text-yellow-900 text-sm flex items-center gap-1.5">
              Premium obuna
              {wallet?.premium_active && <Icon name="checkCircle" size="xs" />}
            </p>
            <p className="text-yellow-800/90 text-xs">30 kun · 20 bonus evaziga</p>
          </div>
        </div>
        <div className="relative">
          {buying === "premium" ? (
            <Icon name="spinner" size="md" spin className="text-yellow-900" />
          ) : wallet?.premium_active ? (
            <span className="text-yellow-900 text-xs font-extrabold flex items-center gap-1 bg-white/30 px-2.5 py-1 rounded-md">
              <Icon name="check" size="xs" /> Faol
            </span>
          ) : (
            <span className="text-yellow-900 font-extrabold text-sm flex items-center gap-1 bg-white/30 px-2.5 py-1 rounded-md">
              Olish <Icon name="arrowRight" size="xs" />
            </span>
          )}
        </div>
      </motion.button>
    </div>
  );
}
