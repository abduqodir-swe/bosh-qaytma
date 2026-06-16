import { db } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { CITIES, CARGO_TYPES, TRANSPORT_TYPES } from "@/lib/constants";
import { toast } from "sonner";
import BoostOptions, { BOOST_OPTIONS } from "@/components/loads/BoostOptions";
import { getOrCreateWallet, spendCredits } from "@/lib/wallet";
import { getLocalUser } from "@/lib/localAuth";
import { validatePhone } from "@/lib/localAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

export default function PostLoadPage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBoosts, setSelectedBoosts] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    from_location: "", to_location: "", cargo_type: "", weight: "",
    volume: "", price: "", currency: "USD", contact_name: "",
    contact_phone: "", telegram: "", transport_type: "har_qanday",
    description: "", load_date: "", status: "active"
  });

  useEffect(() => {
    setUser(currentUser);
    if (currentUser) {
      getOrCreateWallet(currentUser).then(setWallet).catch((e) => {
        console.warn("Wallet load failed (non-blocking):", e);
      });
    }
  }, [currentUser]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const step1Valid = form.from_location && form.to_location && form.from_location !== form.to_location;
  const phoneCheck = form.contact_phone ? validatePhone(form.contact_phone) : { valid: false, error: null };
  const step2Valid = form.cargo_type && form.contact_phone && phoneCheck.valid;

  // Touched state for inline validation messages
  const [touched, setTouched] = useState({ from_location: false, to_location: false, contact_phone: false });

  const fromToError = touched.from_location && touched.to_location
    && form.from_location
    && form.to_location
    && form.from_location === form.to_location;

  const step1Error = (() => {
    if (fromToError) return "Qayerdan va Qayerga bir xil bo'lmasligi kerak";
    if (touched.from_location && !form.from_location) return "Qayerdan shaharni tanlang";
    if (touched.to_location && !form.to_location) return "Qayerga shaharni tanlang";
    return null;
  })();

  const submit = async () => {
    setIsSubmitting(true);
    try {
      const selectedBoostOptions = BOOST_OPTIONS.filter((o) => selectedBoosts.includes(o.key));
      const totalCost = selectedBoostOptions.reduce((s, o) => s + o.credits, 0);

      if (totalCost > 0) {
        if (!wallet || (wallet.balance || 0) < totalCost) {
          toast.error("Yetarli bonus yo'q!");
          setIsSubmitting(false);
          return;
        }
      }

      const isPin       = selectedBoosts.includes("pin")       || selectedBoosts.includes("zaril");
      const isUrgent    = selectedBoosts.includes("urgent")    || selectedBoosts.includes("zaril");
      const isVip       = selectedBoosts.includes("vip")       || selectedBoosts.includes("zaril");
      const isHighlight = selectedBoosts.includes("highlight") || selectedBoosts.includes("zaril");

      let priorityScore = 0;
      if (isPin)       priorityScore = Math.max(priorityScore, 5000);
      if (isUrgent)    priorityScore = Math.max(priorityScore, 4000);
      if (isVip)       priorityScore = Math.max(priorityScore, 3000);
      if (isHighlight) priorityScore = Math.max(priorityScore, 2000);

      const loadData = {
        from_location: form.from_location,
        to_location: form.to_location,
        cargo_type: form.cargo_type,
        contact_phone: form.contact_phone,
        status: "active",
        shipper_id: user?.id || "guest",
        shipper_name: user?.full_name || "",
        views: 0,
        is_vip: isVip,
        is_highlight: isHighlight,
        is_pin: isPin,
        is_urgent: isUrgent,
        priority_score: priorityScore,
      };

      if (form.contact_name) loadData.contact_name = form.contact_name;
      if (form.telegram)     loadData.telegram = form.telegram;
      if (form.description)  loadData.description = form.description;
      if (form.load_date)    loadData.load_date = form.load_date;
      if (form.transport_type) loadData.transport_type = form.transport_type;
      if (form.currency)     loadData.currency = form.currency;
      if (form.weight)       loadData.weight = parseFloat(form.weight);
      if (form.volume)       loadData.volume = parseFloat(form.volume);
      if (form.price)        loadData.price = parseFloat(form.price);

      const created = await db.entities.Load.create(loadData);

      if (wallet && user && selectedBoostOptions.length > 0) {
        let updatedWallet = wallet;
        for (const boost of selectedBoostOptions) {
          try {
            updatedWallet = await spendCredits(updatedWallet, boost.credits, boost.actionType, boost.label, user);
            if (updatedWallet) setWallet(updatedWallet);
          } catch (walletErr) {
            console.warn("Credit deduction failed (non-blocking):", walletErr);
          }
        }
      }

      toast.success("E'lon muvaffaqiyatli joylashtirildi!");
      setStep(3);
    } catch (err) {
      console.error("Load create error:", err?.message || err);
      toast.error(`Xatolik: ${err?.message || "Qayta urinib ko'ring"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 3) {
    return (
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 20 }}
        className="flex flex-col items-center justify-center min-h-[78vh] px-6 text-center"
      >
        <div className="relative w-28 h-28 mb-5">
          <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-2xl pulse-ring" />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
            <Icon name="check" size="5xl" className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">E'lon joylashtirildi!</h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-[260px]">
          Haydovchilar yukingizni ko'rishi mumkin. Tez orada javob keladi!
        </p>
        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => {
            setStep(1);
            setForm({ from_location:"",to_location:"",cargo_type:"",weight:"",volume:"",price:"",currency:"USD",contact_name:"",contact_phone:"",telegram:"",transport_type:"har_qanday",description:"",load_date:"",status:"active" });
            setSelectedBoosts([]);
          }}>
            <Icon name="plus" size="sm" className="mr-1.5" />
            Yana e'lon
          </Button>
          <Button className="flex-1 h-12 rounded-xl btn-glow" onClick={() => navigate("/loads")}>
            <Icon name="list" size="sm" className="mr-1.5" />
            Yuklarni ko'r
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="px-4 lg:px-0 py-4 space-y-4">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={cn("h-1.5 flex-1 rounded-full transition-all", step >= 1 ? "bg-gradient-to-r from-primary to-blue-600" : "bg-muted")} />
          <div className={cn("h-1.5 flex-1 rounded-full transition-all", step >= 2 ? "bg-gradient-to-r from-primary to-blue-600" : "bg-muted")} />
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">
          Qadam {step} / 2 · {step === 1 ? "Marshrut" : "Batafsil ma'lumot"}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-700 mb-3 shadow-lg shadow-primary/30">
                <Icon name="route" size="xl" className="text-white" />
              </div>
              <h2 className="text-xl font-black mb-1">Marshrut</h2>
              <p className="text-sm text-muted-foreground">Yuk qayerdan qayerga ketadi?</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <Icon name="locationDot" size="xs" className="text-emerald-600" />
                  Qayerdan *
                </label>
                <Select value={form.from_location} onValueChange={(v) => set("from_location", v)} onOpenChange={(open) => !open && setTouched((t) => ({ ...t, from_location: true }))}>
                  <SelectTrigger className="h-11 text-sm rounded-xl"><SelectValue placeholder="Shaharni tanlang" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {touched.from_location && !form.from_location && (
                  <p className="mt-1.5 text-[11px] font-semibold text-destructive flex items-center gap-1">
                    <Icon name="circleExclamation" size="xs" /> Qayerdan shaharni tanlang
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center -my-1">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="arrowDown" size="sm" className="text-primary" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <Icon name="mapPin" size="xs" className="text-rose-600" />
                  Qayerga *
                </label>
                <Select value={form.to_location} onValueChange={(v) => set("to_location", v)} onOpenChange={(open) => !open && setTouched((t) => ({ ...t, to_location: true }))}>
                  <SelectTrigger className="h-11 text-sm rounded-xl"><SelectValue placeholder="Shaharni tanlang" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {touched.to_location && !form.to_location && (
                  <p className="mt-1.5 text-[11px] font-semibold text-destructive flex items-center gap-1">
                    <Icon name="circleExclamation" size="xs" /> Qayerga shaharni tanlang
                  </p>
                )}
              </div>

              {fromToError && (
                <p className="-mt-1 text-[11px] font-semibold text-destructive flex items-center gap-1">
                  <Icon name="circleExclamation" size="xs" /> {step1Error}
                </p>
              )}

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <Icon name="calendar" size="xs" className="text-primary" />
                  Yuklanish sanasi
                </label>
                <Input type="date" value={form.load_date} onChange={(e) => set("load_date", e.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>

            <Button className="w-full h-12 rounded-xl btn-glow" disabled={!step1Valid} onClick={() => setStep(2)}>
              Davom etish
              <Icon name="arrowRight" size="sm" className="ml-1.5" />
            </Button>
            {!step1Valid && (form.from_location || form.to_location) && (
              <p className="text-center text-[11px] text-muted-foreground -mt-2">
                {!form.from_location
                  ? "Qayerdan shaharni tanlang"
                  : !form.to_location
                    ? "Qayerga shaharni tanlang"
                    : "Qayerdan va Qayerga bir xil bo'lmasligi kerak"}
              </p>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(1)} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center press">
                <Icon name="arrowLeft" size="sm" className="text-muted-foreground" />
              </button>
              <div>
                <h2 className="text-lg font-extrabold">Yuk ma'lumotlari</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Icon name="locationDot" size="xs" className="text-emerald-600" />
                  {form.from_location}
                  <Icon name="arrowRight" size="xs" />
                  <Icon name="mapPin" size="xs" className="text-rose-600" />
                  {form.to_location}
                </p>
              </div>
            </div>

            {/* Cargo type — visual grid */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Icon name="boxes" size="xs" /> Yuk turi *
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(CARGO_TYPES).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set("cargo_type", k)}
                    className={cn(
                      "h-20 rounded-xl border flex flex-col items-center justify-center gap-1 transition press",
                      form.cargo_type === k
                        ? "bg-primary text-white border-primary shadow-md shadow-primary/30"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <Icon name={v.icon} size="lg" />
                    <span className="text-[10px] font-semibold leading-tight text-center px-1 truncate w-full">{v.label.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block flex items-center gap-1"><Icon name="weightScale" size="xs" /> Og'irlik (t)</label>
                  <Input type="number" placeholder="0.0" className="h-11 rounded-xl" value={form.weight} onChange={(e) => set("weight", e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block flex items-center gap-1"><Icon name="cube" size="xs" /> Hajm (m³)</label>
                  <Input type="number" placeholder="0.0" className="h-11 rounded-xl" value={form.volume} onChange={(e) => set("volume", e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block flex items-center gap-1"><Icon name="truckFront" size="xs" /> Transport turi</label>
                <Select value={form.transport_type} onValueChange={(v) => set("transport_type", v)}>
                  <SelectTrigger className="h-11 text-sm rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRANSPORT_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <div className="flex items-center gap-2">
                          <Icon name={v.icon} size="sm" />
                          {v.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block flex items-center gap-1"><Icon name="moneyBillWave" size="xs" /> Narx</label>
                <div className="flex gap-2">
                  <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                    <SelectTrigger className="w-24 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="UZS">UZS</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Narx" className="flex-1 h-11 rounded-xl" value={form.price} onChange={(e) => set("price", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="userTie" size="xs" /> Aloqa ma'lumotlari
              </p>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block flex items-center gap-1"><Icon name="user" size="xs" /> Aloqa ismi</label>
                <Input placeholder="To'liq ism" className="h-11 rounded-xl" value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block flex items-center gap-1"><Icon name="phoneVolume" size="xs" /> Telefon *</label>
                <Input
                  placeholder="+998 90 000 00 00"
                  className={cn("h-11 rounded-xl", touched.contact_phone && !phoneCheck.valid && form.contact_phone ? "border-destructive focus-visible:ring-destructive/30" : "")}
                  value={form.contact_phone}
                  onChange={(e) => set("contact_phone", e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, contact_phone: true }))}
                  inputMode="tel"
                />
                {touched.contact_phone && form.contact_phone && !phoneCheck.valid && (
                  <p className="mt-1.5 text-[11px] font-semibold text-destructive flex items-center gap-1">
                    <Icon name="circleExclamation" size="xs" /> {phoneCheck.error}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block flex items-center gap-1"><Icon name="telegram" size="xs" /> Telegram</label>
                <Input placeholder="@username" className="h-11 rounded-xl" value={form.telegram} onChange={(e) => set("telegram", e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block flex items-center gap-1"><Icon name="commentDots" size="xs" /> Izoh</label>
                <Textarea placeholder="Qo'shimcha ma'lumot..." className="rounded-xl" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
              </div>
            </div>

            <BoostOptions
              selected={selectedBoosts}
              onChange={setSelectedBoosts}
              walletBalance={wallet?.balance || 0}
            />

            <Button className="w-full h-12 rounded-xl btn-glow" disabled={!step2Valid || isSubmitting} onClick={submit}>
              {isSubmitting ? (
                <><Icon name="spinner" size="sm" spin className="mr-1.5" />Joylashtirilmoqda...</>
              ) : (
                <><Icon name="paperPlane" size="sm" className="mr-1.5" />E'lon joylashtirish</>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
