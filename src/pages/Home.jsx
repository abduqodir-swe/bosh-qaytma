import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const features = [
  { icon: "rocket",   label: "Bo'sh qaytishni tugatish", color: "text-emerald-300" },
  { icon: "moneyBillWave", label: "Ko'proq daromad olish", color: "text-yellow-300" },
  { icon: "bolt",     label: "Tez va oson yuk topish",   color: "text-sky-300" },
];

const stats = [
  { value: "12,400+", label: "Faol haydovchilar",  icon: "users",         color: "from-blue-500 to-blue-700" },
  { value: "47,800+", label: "Yuk e'lonlari",      icon: "packageSearch", color: "from-emerald-500 to-emerald-700" },
  { value: "98%",     label: "Muvaffaqiyat",       icon: "chartLine",     color: "from-amber-500 to-orange-600" },
];

export default function Home() {
  return (
    <div className="min-h-screen hero-bg-soft flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Decorative bg blobs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-yellow-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-sky-300/25 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      {/* Hero */}
      <div className="flex-1 flex flex-col items-stretch justify-start px-6 pt-12 pb-8 relative z-10 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center mb-6"
        >
          <div className="relative w-24 h-24 mb-5">
            <div className="absolute inset-0 rounded-3xl bg-aurora opacity-90 blur-md" />
            <div className="relative w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-2xl shadow-blue-900/40">
              <Icon name="truckFront" size="5xl" className="text-white" />
            </div>
            <motion.div
              animate={{ y: [-3, 3, -3] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-500/40 border-2 border-white"
            >
              <Icon name="bolt" size="md" className="text-yellow-900" />
            </motion.div>
          </div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-black text-white tracking-tight mb-2"
          >
            Bo'sh Qaytma
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-white/75 text-sm mb-8 leading-relaxed max-w-[260px] mx-auto"
          >
            Haydovchi va yuk egalarini<br />birlashtiruvchi zamonaviy platforma
          </motion.p>

          {/* Features */}
          <div className="space-y-2.5 mb-8 w-full max-w-xs mx-auto text-left">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-2.5 bg-white/8 backdrop-blur border border-white/15 rounded-xl px-3.5 py-2.5"
              >
                <div className={cn("w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center", f.color)}>
                  <Icon name={f.icon} size="sm" />
                </div>
                <span className="text-white/90 text-sm font-medium">{f.label}</span>
                <Icon name="checkCircle" size="sm" className="text-emerald-300 ml-auto" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Role selection */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="w-full space-y-3"
        >
          <p className="text-white/55 text-[10px] uppercase tracking-[0.2em] mb-4 font-semibold">Rolni tanlang</p>

          <Link
            to="/loads"
            className="group flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-xl shadow-blue-900/20 hover:shadow-2xl active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition">
                <Icon name="truckFront" size="xl" className="text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
              </div>
              <div className="text-left">
                <p className="font-extrabold text-foreground text-base">Haydovchi</p>
                <p className="text-muted-foreground text-[11px]">Yuk topish va qabul qilish</p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition">
              <Icon name="arrowRight" size="sm" className="text-blue-600" />
            </div>
          </Link>

          <Link
            to="/post-load"
            className="group flex items-center justify-between bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl px-5 py-4 shadow-xl shadow-amber-500/30 hover:shadow-2xl active:scale-[0.98] transition-all text-amber-950"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-2xl bg-white/25 flex items-center justify-center backdrop-blur group-hover:scale-105 transition">
                <Icon name="package" size="xl" className="text-amber-950" />
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white border-2 border-amber-500" />
              </div>
              <div className="text-left">
                <p className="font-extrabold text-base">Yuk Egasi</p>
                <p className="text-amber-900/80 text-[11px]">Yuk e'loni berish</p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-black/15 flex items-center justify-center group-hover:bg-black/25 transition">
              <Icon name="arrowRight" size="sm" className="text-amber-950" />
            </div>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 grid grid-cols-3 gap-2"
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/8 backdrop-blur border border-white/15 px-2 py-3 flex flex-col items-center"
            >
              <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-1.5", s.color)}>
                <Icon name={s.icon} size="sm" className="text-white" />
              </div>
              <p className="text-white font-extrabold text-sm leading-tight">{s.value}</p>
              <p className="text-white/55 text-[9px] leading-tight mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-6 px-6">
        <div className="flex items-center justify-center gap-1.5 text-white/40 text-[10px]">
          <Icon name="shieldHalved" size="xs" />
          <span>Xavfsiz · Tezkor · Ishonchli</span>
        </div>
        <p className="text-white/30 text-[10px] mt-2">© 2026 Bo'sh Qaytma — Uzbekistan</p>
      </div>
    </div>
  );
}
