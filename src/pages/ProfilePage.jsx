import { db } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TRANSPORT_TYPES, CITIES } from "@/lib/constants";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import WalletCard from "@/components/wallet/WalletCard";
import { getOrCreateWallet } from "@/lib/wallet";
import { getLocalUser, saveLocalUser, clearLocalUser } from "@/lib/localAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [form, setForm] = useState({
    full_name: "", phone: "", telegram: "", truck_type: "tentli",
    capacity: "", current_location: "", destination: "", license_plate: ""
  });

  useEffect(() => {
    if (!currentUser) { navigate("/auth", { replace: true }); return; }
    setUser(currentUser);
    Promise.all([
      getOrCreateWallet(currentUser),
      db.entities.DriverProfile.filter({ user_id: currentUser.id })
    ])
      .then(([walletData, profileList]) => {
        setWallet(walletData);
        if (profileList && profileList.length > 0) {
          const prof = profileList[0];
          setProfile(prof);
          setForm({
            full_name: prof.full_name || currentUser.full_name || "",
            phone: prof.phone || currentUser.phone || "",
            telegram: prof.telegram || "",
            truck_type: prof.truck_type || "tentli",
            capacity: prof.capacity ? prof.capacity.toString() : "",
            current_location: prof.current_location || "",
            destination: prof.destination || "",
            license_plate: prof.license_plate || ""
          });
        } else {
          setForm((f) => ({ ...f, full_name: currentUser.full_name || "", phone: currentUser.phone || "" }));
        }
        setLoading(false);
      })
      .catch(() => { toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi"); setLoading(false); });
  }, [navigate, currentUser]);

  const setVal = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!form.full_name || !form.phone || !form.truck_type) {
      toast.error("Majburiy maydonlarni to'ldiring");
      return;
    }
    setSaving(true);
    try {
      const data = {
        user_id: user.id,
        full_name: form.full_name,
        phone: form.phone,
        telegram: form.telegram,
        truck_type: form.truck_type,
        capacity: form.capacity ? parseFloat(form.capacity) : 0,
        current_location: form.current_location,
        destination: form.destination,
        license_plate: form.license_plate
      };
      if (profile && profile.id) {
        setProfile(await db.entities.DriverProfile.update(profile.id, data));
      } else {
        setProfile(await db.entities.DriverProfile.create(data));
      }
      toast.success("Ma'lumotlar saqlandi!");
    } catch {
      toast.error("Ma'lumotlarni saqlashda xatolik yuz berdi");
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    clearLocalUser();
    toast.success("Tizimdan chiqdingiz");
    navigate("/auth", { replace: true });
  };

  const toggleAdminRole = async () => {
    if (!user) return;
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      const updatedUser = await db.entities.AppUser.update(user.id, { role: newRole });
      saveLocalUser(updatedUser);
      setUser(updatedUser);
      toast.success(newRole === "admin" ? "Admin rejimi yoqildi!" : "Admin rejimi o'chirildi!");
    } catch {
      toast.error("Sozlamani o'zgartirishda xatolik yuz berdi");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Profile header card */}
      <motion.div
        initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="relative bg-brand-gradient rounded-2xl p-5 text-primary-foreground overflow-hidden shadow-xl shadow-primary/30"
      >
        <div className="absolute inset-0 opacity-30 bg-grid" />
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-yellow-400/20 blur-2xl" />
        <div className="relative flex items-center gap-3.5">
          <div className="relative w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white font-black text-2xl border-2 border-white/30 shadow-lg">
            {(user?.full_name || "U").charAt(0).toUpperCase()}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
              <Icon name="check" size="xs" className="text-emerald-900" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-white truncate text-lg">{user?.full_name}</h2>
            <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
              <Icon name="phone" size="xs" />
              {user?.phone}
            </p>
            {user?.role === "admin" && (
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-extrabold bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-md">
                <Icon name="crown" size="xs" /> ADMIN
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Icon name="star" size="md" />
          </div>
          <p className="text-lg font-black text-foreground mt-1">{profile?.rating || 0}</p>
          <p className="text-[10px] text-muted-foreground">Reyting</p>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Icon name="route" size="md" />
          </div>
          <p className="text-lg font-black text-foreground mt-1">{profile?.trips_count || 0}</p>
          <p className="text-[10px] text-muted-foreground">Safarlar</p>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Icon name="wallet" size="md" />
          </div>
          <p className="text-lg font-black text-foreground mt-1">{wallet?.balance || 0}</p>
          <p className="text-[10px] text-muted-foreground">Bonus</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted p-1 rounded-2xl relative">
        <button
          onClick={() => setActiveTab("profile")}
          className={cn(
            "flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
            activeTab === "profile"
              ? "bg-card text-foreground shadow-md"
              : "text-muted-foreground"
          )}
        >
          <Icon name="user" size="sm" />
          Haydovchi
        </button>
        <button
          onClick={() => setActiveTab("wallet")}
          className={cn(
            "flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
            activeTab === "wallet"
              ? "bg-card text-foreground shadow-md"
              : "text-muted-foreground"
          )}
        >
          <Icon name="wallet" size="sm" />
          Hamyon
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "profile" ? (
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="truckFront" size="sm" className="text-primary" />
              </div>
              <h3 className="font-extrabold text-foreground text-sm">Profil ma'lumotlari</h3>
              {profile?.is_verified && (
                <span className="ml-auto inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  <Icon name="checkCircle" size="xs" /> Tasdiqlangan
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">To'liq ism *</label>
                <Input placeholder="Ism Familiya" className="h-11 rounded-xl" value={form.full_name} onChange={(e) => setVal("full_name", e.target.value)} required />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Telefon raqami *</label>
                <Input placeholder="+998 90 000 00 00" className="h-11 rounded-xl" value={form.phone} onChange={(e) => setVal("phone", e.target.value)} required />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Telegram</label>
                <Input placeholder="@username" className="h-11 rounded-xl" value={form.telegram} onChange={(e) => setVal("telegram", e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Mashina turi *</label>
                  <Select value={form.truck_type} onValueChange={(v) => setVal("truck_type", v)}>
                    <SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRANSPORT_TYPES).filter(([k]) => k !== "har_qanday").map(([k, item]) => (
                        <SelectItem key={k} value={k}>
                          <div className="flex items-center gap-2">
                            <Icon name={item.icon} size="sm" />
                            {item.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Sig'im (tonna)</label>
                  <Input type="number" placeholder="t" className="h-11 rounded-xl" value={form.capacity} onChange={(e) => setVal("capacity", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Hozirgi joylashuv</label>
                  <Select value={form.current_location} onValueChange={(v) => setVal("current_location", v)}>
                    <SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue placeholder="Shahar" /></SelectTrigger>
                    <SelectContent>
                      {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Bosh yo'nalish</label>
                  <Select value={form.destination} onValueChange={(v) => setVal("destination", v)}>
                    <SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue placeholder="Shahar" /></SelectTrigger>
                    <SelectContent>
                      {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Davlat raqami</label>
                <Input placeholder="01 A 777 AA" className="h-11 rounded-xl" value={form.license_plate} onChange={(e) => setVal("license_plate", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Admin toggle */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", user?.role === "admin" ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground")}>
                <Icon name="crown" size="md" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-extrabold text-foreground text-sm">Admin rejimi</p>
                <p className="text-[10px] text-muted-foreground">Admin panelini faollashtirish</p>
              </div>
              <button
                type="button"
                onClick={toggleAdminRole}
                className={cn(
                  "w-12 h-7 rounded-full relative transition press",
                  user?.role === "admin" ? "bg-primary" : "bg-muted"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all",
                  user?.role === "admin" ? "left-5" : "left-0.5"
                )} />
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl btn-glow" disabled={saving}>
            {saving ? (
              <><Icon name="spinner" size="sm" spin className="mr-1.5" />Saqlanmoqda...</>
            ) : (
              <><Icon name="check" size="sm" className="mr-1.5" />Saqlash</>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" className="w-full h-11 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10">
                <Icon name="signOut" size="sm" className="mr-1.5" />
                Tizimdan chiqish
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[340px] rounded-2xl">
              <AlertDialogHeader>
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
                  <Icon name="signOut" size="lg" className="text-destructive" />
                </div>
                <AlertDialogTitle className="text-center font-extrabold text-lg">Chiqishni tasdiqlaysizmi?</AlertDialogTitle>
                <AlertDialogDescription className="text-center text-sm text-muted-foreground">
                  Haqiqatan ham tizimdan chiqmoqchimisiz?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row gap-2 mt-4">
                <AlertDialogCancel className="flex-1 mt-0 rounded-xl h-11">Bekor qilish</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl h-11">
                  <Icon name="signOut" size="sm" className="mr-1.5" />Chiqish
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
      ) : (
        <WalletCard wallet={wallet} user={user} onUpdate={setWallet} />
      )}
    </div>
  );
}
