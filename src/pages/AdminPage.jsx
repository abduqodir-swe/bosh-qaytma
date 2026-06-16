import { db } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import { CARGO_TYPES, TRANSPORT_TYPES } from "@/lib/constants";
import { formatDistanceToNow, isToday } from "date-fns";
import NotificationBell from "@/components/admin/NotificationBell";
import DeletedUploadsTab from "@/components/admin/DeletedUploadsTab";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const [loads, setLoads] = useState([]);
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([
      db.auth.me().catch(() => null),
      db.entities.Load.list("-created_date", 100).catch(() => []),
      db.entities.AppUser.list("-created_date", 100).catch(() => []),
      db.entities.DriverProfile.list("-created_date", 100).catch(() => []),
      db.entities.AdminNotification.list("-created_date", 100).catch(() => [])
    ]).then(([u, l, us, drvs, notifs]) => {
      setUser(u); setLoads(l); setUsers(us); setDrivers(drvs); setNotifications(notifs);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const deleteLoad = async (load) => {
    try {
      await db.entities.DeletedLoad.create({
        original_id: load.id,
        deleted_by_id: user?.id || "admin",
        deleted_by_name: user?.full_name || user?.email || "Admin",
        deletion_time: new Date().toISOString(),
        original_data: JSON.stringify(load)
      });
      await db.entities.Load.delete(load.id);
      setLoads((prev) => prev.filter((l) => l.id !== load.id));
      toast.success("Yuk o'chirildi");
    } catch { toast.error("O'chirishda xatolik yuz berdi"); }
  };

  const toggleStatus = async (load) => {
    try {
      const newStatus = load.status === "active" ? "closed" : "active";
      await db.entities.Load.update(load.id, { status: newStatus });
      setLoads((prev) => prev.map((l) => l.id === load.id ? { ...l, status: newStatus } : l));
      toast.success("Holat o'zgartirildi");
    } catch { toast.error("Xatolik yuz berdi"); }
  };

  const toggleUserActive = async (u) => {
    try {
      const updated = await db.entities.AppUser.update(u.id, { is_active: !u.is_active });
      setUsers((prev) => prev.map((usr) => usr.id === u.id ? updated : usr));
      toast.success(updated.is_active ? "Foydalanuvchi faollashtirildi" : "Foydalanuvchi bloklandi");
    } catch { toast.error("Xatolik yuz berdi"); }
  };

  const toggleUserAdmin = async (u) => {
    try {
      const newRole = u.role === "admin" ? "user" : "admin";
      const updated = await db.entities.AppUser.update(u.id, { role: newRole });
      setUsers((prev) => prev.map((usr) => usr.id === u.id ? updated : usr));
      toast.success(newRole === "admin" ? "Admin huquqi berildi" : "Admin huquqi olindi");
    } catch { toast.error("Xatolik yuz berdi"); }
  };

  const deleteUser = async (u) => {
    try {
      await db.entities.AppUser.delete(u.id);
      setUsers((prev) => prev.filter((usr) => usr.id !== u.id));
      toast.success("Foydalanuvchi o'chirildi");
    } catch { toast.error("O'chirishda xatolik yuz berdi"); }
  };

  const toggleDriverVerify = async (d) => {
    try {
      const updated = await db.entities.DriverProfile.update(d.id, { is_verified: !d.is_verified });
      setDrivers((prev) => prev.map((drv) => drv.id === d.id ? updated : drv));
      toast.success(updated.is_verified ? "Haydovchi tasdiqlandi" : "Tasdiqlash bekor qilindi");
    } catch { toast.error("Xatolik yuz berdi"); }
  };

  const deleteDriver = async (d) => {
    try {
      await db.entities.DriverProfile.delete(d.id);
      setDrivers((prev) => prev.filter((drv) => drv.id !== d.id));
      toast.success("Haydovchi profili o'chirildi");
    } catch { toast.error("O'chirishda xatolik yuz berdi"); }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon name="lock" size="3xl" className="text-muted-foreground" />
        </div>
        <p className="font-extrabold text-lg">Ruxsat yo'q</p>
        <p className="text-sm text-muted-foreground mt-1">Bu sahifa faqat adminlar uchun</p>
      </div>
    );
  }

  const activeLoads = loads.filter((l) => l.status === "active");
  const totalViews = loads.reduce((s, l) => s + (l.views || 0), 0);
  const todayCredits = notifications.filter((n) => n.action_type === "credit_purchase" && n.created_date && isToday(new Date(n.created_date))).length;
  const todayVip = notifications.filter((n) => n.action_type === "vip_purchase" && n.created_date && isToday(new Date(n.created_date))).length;
  const totalRevenue = notifications.filter((n) => n.action_type === "credit_purchase").reduce((s, n) => s + (n.credits_added || 0), 0);
  const premiumUsers = notifications.filter((n) => n.action_type === "premium_purchase").length;

  const topStats = [
    { icon: "packageSearch", label: "Jami yuklar",   value: loads.length,    color: "from-blue-500 to-blue-700",    text: "text-blue-100" },
    { icon: "circleCheck",   label: "Faol yuklar",   value: activeLoads.length, color: "from-emerald-500 to-emerald-700", text: "text-emerald-100" },
    { icon: "users",         label: "Foydalanuvchilar", value: users.length,  color: "from-purple-500 to-purple-700", text: "text-purple-100" },
    { icon: "eye",           label: "Ko'rishlar",    value: totalViews,      color: "from-amber-500 to-orange-600",  text: "text-amber-100" },
  ];

  const moneyStats = [
    { icon: "creditCard", label: "Bugun bonus",      value: todayCredits,  icon2: "circleCheck" },
    { icon: "star",       label: "Bugun VIP",        value: todayVip,      icon2: "fire" },
    { icon: "coins",      label: "Jami bonuslar",    value: totalRevenue,  icon2: "arrowTrendUp" },
    { icon: "crown",      label: "Premium obunalar", value: premiumUsers, icon2: "gem" },
  ];

  const filteredLoads = loads.filter((l) => {
    const q = searchQuery.toLowerCase();
    const cargo = CARGO_TYPES[l.cargo_type] || CARGO_TYPES.boshqa;
    return (l.from_location?.toLowerCase().includes(q) || l.to_location?.toLowerCase().includes(q) || cargo.label?.toLowerCase().includes(q));
  });

  const filteredDrivers = drivers.filter((d) => {
    const q = searchQuery.toLowerCase();
    const truck = TRANSPORT_TYPES[d.truck_type]?.label || "";
    return (d.full_name?.toLowerCase().includes(q) || d.phone?.toLowerCase().includes(q) || d.license_plate?.toLowerCase().includes(q) || truck.toLowerCase().includes(q));
  });

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (u.full_name?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q));
  });

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
              <Icon name="crown" size="sm" className="text-yellow-900" />
            </div>
            Admin paneli
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Tizim statistikasi va boshqaruv</p>
        </div>
        <NotificationBell />
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchQuery(""); }} className="w-full">
        <TabsList className="w-full grid grid-cols-5 bg-muted p-1 rounded-2xl h-auto">
          <TabsTrigger value="overview" className="text-[10px] font-bold py-2 rounded-xl flex flex-col gap-0.5">
            <Icon name="gauge" size="sm" />
            <span>Stat</span>
          </TabsTrigger>
          <TabsTrigger value="loads" className="text-[10px] font-bold py-2 rounded-xl flex flex-col gap-0.5">
            <Icon name="packageSearch" size="sm" />
            <span>Yuklar</span>
          </TabsTrigger>
          <TabsTrigger value="drivers" className="text-[10px] font-bold py-2 rounded-xl flex flex-col gap-0.5">
            <Icon name="truckFront" size="sm" />
            <span>Haydovchi</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="text-[10px] font-bold py-2 rounded-xl flex flex-col gap-0.5">
            <Icon name="users" size="sm" />
            <span>A'zolar</span>
          </TabsTrigger>
          <TabsTrigger value="deleted" className="text-[10px] font-bold py-2 rounded-xl flex flex-col gap-0.5">
            <Icon name="trashCan" size="sm" />
            <span>O'chirilgan</span>
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-2.5">
            {topStats.map(({ icon, label, value, color, text }, i) => (
              <motion.div
                key={label}
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.05 }}
                className={cn("relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br text-white shadow-lg", color)}
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10 blur-xl" />
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center mb-2">
                    <Icon name={icon} size="md" className="text-white" />
                  </div>
                  <p className="text-3xl font-black">{value}</p>
                  <p className={cn("text-[10px] font-bold uppercase tracking-wider mt-0.5", text)}>{label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Icon name="moneyBillWave" size="xs" /> Monetizatsiya
            </p>
            <div className="space-y-2.5">
              {moneyStats.map(({ icon, label, value, icon2 }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={icon} size="md" className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-extrabold text-foreground">{value}</p>
                  </div>
                  <Icon name={icon2} size="sm" className="text-muted-foreground/40" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Icon name="boltLightning" size="xs" /> So'nggi faollik
            </p>
            <div className="space-y-2">
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="flex items-center gap-2.5 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Icon name="user" size="xs" className="text-amber-700" />
                  </div>
                  <p className="flex-1 min-w-0 truncate"><span className="font-bold">{n.user_name}</span> · {n.item_label}</p>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }).replace("about ", "") : ""}</span>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Hozircha faollik yo'q</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* LOADS */}
        <TabsContent value="loads" className="space-y-3 mt-4">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="search" size="sm" className="text-primary" />
            </div>
            <Input
              placeholder="Yuklarni qidiring..."
              className="pl-12 h-11 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredLoads.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Icon name="packageSearch" size="3xl" className="text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Yuklar topilmadi</p>
            </div>
          ) : (
            filteredLoads.map((load) => {
              const cargo = CARGO_TYPES[load.cargo_type] || CARGO_TYPES.boshqa;
              return (
                <div key={load.id} className="bg-card border border-border rounded-2xl p-3.5 shadow-sm space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-extrabold text-sm text-foreground flex items-center gap-1">
                          <Icon name="locationDot" size="xs" className="text-emerald-600" />
                          {load.from_location}
                          <Icon name="arrowRight" size="xs" className="text-muted-foreground" />
                          <Icon name="mapPin" size="xs" className="text-rose-600" />
                          {load.to_location}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        {load.is_vip && <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md"><Icon name="star" size="xs" />VIP</span>}
                        {load.is_urgent && <span className="inline-flex items-center gap-0.5 bg-red-100 text-red-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md"><Icon name="fire" size="xs" />ZARUR</span>}
                        {load.is_pin && <span className="inline-flex items-center gap-0.5 bg-sky-100 text-sky-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md"><Icon name="mapPin" size="xs" />PIN</span>}
                        {load.is_highlight && <span className="inline-flex items-center gap-0.5 bg-fuchsia-100 text-fuchsia-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md"><Icon name="palette" size="xs" />AJRALIB</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-0.5"><Icon name={cargo.icon} size="xs" />{cargo.label}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5"><Icon name="clock" size="xs" />{load.created_date ? formatDistanceToNow(new Date(load.created_date), { addSuffix: true }).replace("about ", "") : ""}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5"><Icon name="eye" size="xs" />{load.views || 0}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5"><Icon name="phone" size="xs" />{load.contact_phone}</span>
                      </p>
                    </div>
                    <span className={cn(
                      "inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap flex-shrink-0",
                      load.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon name={load.status === "active" ? "circleCheck" : "circleXmark"} size="xs" />
                      {load.status === "active" ? "Faol" : "Yopilgan"}
                    </span>
                  </div>

                  <div className="flex gap-1.5 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" className="flex-1 h-9 rounded-xl text-xs" onClick={() => toggleStatus(load)}>
                      <Icon name={load.status === "active" ? "ban" : "check"} size="sm" className={load.status === "active" ? "text-orange-500 mr-1" : "text-emerald-500 mr-1"} />
                      {load.status === "active" ? "Yopish" : "Ochish"}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-9 rounded-xl text-xs text-destructive hover:bg-destructive/10 border-destructive/30" onClick={() => deleteLoad(load)}>
                      <Icon name="trash" size="sm" className="mr-1" />
                      O'chirish
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* DRIVERS */}
        <TabsContent value="drivers" className="space-y-3 mt-4">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="search" size="sm" className="text-primary" />
            </div>
            <Input
              placeholder="Haydovchilarni qidiring..."
              className="pl-12 h-11 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredDrivers.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Icon name="truckFront" size="3xl" className="text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Haydovchilar topilmadi</p>
            </div>
          ) : (
            filteredDrivers.map((drv) => {
              const truck = TRANSPORT_TYPES[drv.truck_type] || { label: drv.truck_type, icon: "truck" };
              return (
                <div key={drv.id} className="bg-card border border-border rounded-2xl p-3.5 shadow-sm space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white font-extrabold">
                          {(drv.full_name || "?").charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-sm text-foreground truncate">{drv.full_name}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Icon name="phone" size="xs" />{drv.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className={cn(
                      "inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap",
                      drv.is_verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      <Icon name={drv.is_verified ? "checkCircle" : "clock"} size="xs" />
                      {drv.is_verified ? "Tasdiqlangan" : "Kutilmoqda"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/30 p-2.5 rounded-xl">
                    <p className="text-muted-foreground">Turi: <span className="font-bold text-foreground inline-flex items-center gap-1"><Icon name={truck.icon} size="xs" />{truck.label}</span></p>
                    <p className="text-muted-foreground">Sig'im: <span className="font-bold text-foreground">{drv.capacity || 0} t</span></p>
                    <p className="text-muted-foreground col-span-2">Yo'nalish: <span className="font-bold text-foreground">{drv.current_location || "—"} → {drv.destination || "—"}</span></p>
                    {drv.license_plate && (
                      <p className="text-muted-foreground col-span-2 inline-flex items-center gap-1">Raqam: <span className="font-bold text-foreground">{drv.license_plate}</span></p>
                    )}
                  </div>

                  <div className="flex gap-1.5 pt-2 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9 rounded-xl text-xs"
                      onClick={() => toggleDriverVerify(drv)}
                    >
                      <Icon name={drv.is_verified ? "ban" : "shieldCheck"} size="sm" className={drv.is_verified ? "text-orange-500 mr-1" : "text-emerald-500 mr-1"} />
                      {drv.is_verified ? "Bekor qilish" : "Tasdiqlash"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 rounded-xl text-xs text-destructive border-destructive/30 hover:bg-destructive/10 px-3"
                      onClick={() => deleteDriver(drv)}
                    >
                      <Icon name="trash" size="sm" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* USERS */}
        <TabsContent value="users" className="space-y-3 mt-4">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="search" size="sm" className="text-primary" />
            </div>
            <Input
              placeholder="A'zolarni qidiring..."
              className="pl-12 h-11 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Icon name="users" size="3xl" className="text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Foydalanuvchilar topilmadi</p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div key={u.id} className="bg-card border border-border rounded-2xl p-3.5 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white font-extrab">
                    {(u.full_name || "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-sm text-foreground truncate">{u.full_name || "—"}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Icon name="phone" size="xs" />{u.phone || "—"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end flex-shrink-0">
                    <span className={cn(
                      "inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md",
                      u.role === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {u.role === "admin" && <Icon name="crown" size="xs" />}
                      {u.role === "admin" ? "Admin" : "A'zo"}
                    </span>
                    <span className={cn(
                      "inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md",
                      u.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    )}>
                      <Icon name={u.is_active ? "check" : "ban"} size="xs" />
                      {u.is_active ? "Faol" : "Bloklangan"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1.5 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-9 rounded-xl text-xs"
                    onClick={() => toggleUserActive(u)}
                  >
                    <Icon name={u.is_active ? "ban" : "check"} size="sm" className={u.is_active ? "text-orange-500 mr-1" : "text-emerald-500 mr-1"} />
                    {u.is_active ? "Bloklash" : "Faollashtirish"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-9 rounded-xl text-xs"
                    onClick={() => toggleUserAdmin(u)}
                  >
                    <Icon name={u.role === "admin" ? "user" : "shieldHalved"} size="sm" className="text-primary mr-1" />
                    {u.role === "admin" ? "A'zo qilish" : "Admin qilish"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-xl text-xs text-destructive border-destructive/30 hover:bg-destructive/10 px-3"
                    onClick={() => deleteUser(u)}
                  >
                    <Icon name="trash" size="sm" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="deleted" className="mt-4">
          <DeletedUploadsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
