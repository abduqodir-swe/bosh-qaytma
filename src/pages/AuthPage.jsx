import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerUser, loginUser, saveLocalUser, getLocalUser, checkPhoneExists, validatePhone, normalizePhone } from "@/lib/localAuth";
import { toast } from "sonner";

export default function AuthPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ password: "" });
  const [regForm, setRegForm] = useState({ full_name: "", password: "", confirm: "" });

  useEffect(() => {
    const user = getLocalUser();
    if (user) navigate("/", { replace: true });
  }, []);

  const handlePhoneNext = async () => {
    const check = validatePhone(phone);
    if (!check.valid) { toast.error(check.error || "To'g'ri telefon raqam kiriting"); return; }
    const cleaned = check.normalized;
    setLoading(true);
    const exists = await checkPhoneExists(cleaned);
    setLoading(false);
    if (exists) setStep("login"); else setStep("register");
  };

  const handleLogin = async () => {
    if (!loginForm.password) { toast.error("Parolni kiriting"); return; }
    setLoading(true);
    try {
      const user = await loginUser({ phone: phone.trim(), password: loginForm.password });
      saveLocalUser(user);
      toast.success(`Xush kelibsiz, ${user.full_name}!`);
      navigate("/", { replace: true });
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!regForm.full_name || !regForm.password || !regForm.confirm) { toast.error("Barcha maydonlarni to'ldiring"); return; }
    if (regForm.password !== regForm.confirm) { toast.error("Parollar mos kelmadi"); return; }
    if (regForm.password.length < 4) { toast.error("Parol kamida 4 ta belgi bo'lishi kerak"); return; }
    setLoading(true);
    try {
      const user = await registerUser({
        full_name: regForm.full_name.trim(),
        phone: phone.trim(),
        password: regForm.password,
      });
      saveLocalUser(user);
      toast.success("Ro'yxatdan muvaffaqiyatli o'tdingiz!");
      navigate("/", { replace: true });
    } catch (e) {
      if (e.message === "PHONE_EXISTS") { toast.error("Bu raqam allaqachon ro'yxatdan o'tgan"); setStep("login"); }
      else toast.error(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen hero-bg-soft flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
      <div className="absolute -top-32 -left-20 w-72 h-72 rounded-full bg-yellow-400/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-sky-300/25 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center mb-7"
        >
          <div className="relative w-20 h-20 mb-4">
            <div className="absolute inset-0 rounded-3xl bg-aurora opacity-90 blur-md" />
            <div className="relative w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-2xl shadow-blue-900/40">
              <Icon name="truckFront" size="4xl" className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center border-2 border-white shadow-md">
              <Icon name="bolt" size="xs" className="text-yellow-900" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Bo'sh Qaytma</h1>
          <p className="text-white/70 text-sm mt-1 flex items-center gap-1.5">
            <Icon name="shieldHalved" size="xs" />
            Xavfsiz logistika platformasi
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl shadow-blue-900/30 overflow-hidden border border-white/40"
        >
          <div className="px-6 pt-6 pb-4 border-b border-border/60 relative">
            {step !== "phone" && (
              <button
                onClick={() => { setStep("phone"); setLoginForm({ password: "" }); setRegForm({ full_name: "", password: "", confirm: "" }); }}
                className="absolute left-4 top-4 w-8 h-8 rounded-lg bg-muted flex items-center justify-center press"
              >
                <Icon name="arrowLeft" size="sm" className="text-muted-foreground" />
              </button>
            )}
            <h2 className="text-xl font-extrabold text-foreground text-center">
              {step === "phone" && "Kirish yoki Ro'yxatdan o'tish"}
              {step === "login" && "Xush kelibsiz!"}
              {step === "register" && "Yangi hisob yaratish"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              {step === "phone" && "Telefon raqamingizni kiriting"}
              {step === "login" && `${phone} — parolingizni kiriting`}
              {step === "register" && `${phone} — ma'lumotlarni to'ldiring`}
            </p>
          </div>

          <div className="p-6 space-y-3.5">
            <AnimatePresence mode="wait">
              {step === "phone" && (
                <motion.div key="phone" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-3.5">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon name="phone" size="sm" className="text-primary" />
                    </div>
                    <Input
                      className="pl-14 h-12 rounded-xl text-sm"
                      placeholder="+998 90 000 00 00"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      type="tel"
                      onKeyDown={(e) => e.key === "Enter" && handlePhoneNext()}
                      autoFocus
                    />
                  </div>
                  <Button className="w-full h-12 rounded-xl btn-glow" disabled={loading} onClick={handlePhoneNext}>
                    {loading ? (
                      <><Icon name="spinner" size="sm" spin className="mr-1.5" />Tekshirilmoqda...</>
                    ) : (
                      <>Davom etish<Icon name="arrowRight" size="sm" className="ml-1.5" /></>
                    )}
                  </Button>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex-1 h-px bg-border" />
                    <span className="flex items-center gap-1"><Icon name="lock" size="xs" /> Ma'lumotlaringiz himoyalangan</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                </motion.div>
              )}

              {step === "login" && (
                <motion.div key="login" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-3.5">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon name="lock" size="sm" className="text-primary" />
                    </div>
                    <Input
                      className="pl-14 pr-12 h-12 rounded-xl text-sm"
                      placeholder="Parol"
                      type={showPass ? "text" : "password"}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ password: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                    >
                      <Icon name={showPass ? "eyeSlash" : "eye"} size="sm" className="text-muted-foreground" />
                    </button>
                  </div>
                  <Button className="w-full h-12 rounded-xl btn-glow" disabled={loading} onClick={handleLogin}>
                    {loading ? (
                      <><Icon name="spinner" size="sm" spin className="mr-1.5" />Kirilmoqda...</>
                    ) : (
                      <><Icon name="signIn" size="sm" className="mr-1.5" />Kirish</>
                    )}
                  </Button>
                </motion.div>
              )}

              {step === "register" && (
                <motion.div key="register" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-3.5">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon name="user" size="sm" className="text-primary" />
                    </div>
                    <Input
                      className="pl-14 h-12 rounded-xl text-sm"
                      placeholder="To'liq ism (Ism Familiya)"
                      value={regForm.full_name}
                      onChange={(e) => setRegForm((f) => ({ ...f, full_name: e.target.value }))}
                      autoFocus
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon name="lock" size="sm" className="text-primary" />
                    </div>
                    <Input
                      className="pl-14 pr-12 h-12 rounded-xl text-sm"
                      placeholder="Parol (kamida 4 belgi)"
                      type={showPass ? "text" : "password"}
                      value={regForm.password}
                      onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                    >
                      <Icon name={showPass ? "eyeSlash" : "eye"} size="sm" className="text-muted-foreground" />
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon name="shieldCheck" size="sm" className="text-primary" />
                    </div>
                    <Input
                      className="pl-14 pr-12 h-12 rounded-xl text-sm"
                      placeholder="Parolni tasdiqlang"
                      type={showConfirm ? "text" : "password"}
                      value={regForm.confirm}
                      onChange={(e) => setRegForm((f) => ({ ...f, confirm: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                    >
                      <Icon name={showConfirm ? "eyeSlash" : "eye"} size="sm" className="text-muted-foreground" />
                    </button>
                  </div>
                  <Button className="w-full h-12 rounded-xl btn-glow" disabled={loading} onClick={handleRegister}>
                    {loading ? (
                      <><Icon name="spinner" size="sm" spin className="mr-1.5" />Saqlanmoqda...</>
                    ) : (
                      <><Icon name="userPlus" size="sm" className="mr-1.5" />Ro'yxatdan o'tish</>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <p className="text-white/40 text-[10px] text-center mt-6 flex items-center justify-center gap-1.5">
          <Icon name="shieldHalved" size="xs" />
          © 2026 Bo'sh Qaytma — Uzbekistan
        </p>
      </div>
    </div>
  );
}
