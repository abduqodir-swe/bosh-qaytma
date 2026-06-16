import { db } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const ACTION_META = {
  credit_purchase:   { icon: "creditCard",   label: "Bonus sotib oldi",    color: "from-emerald-500 to-emerald-600" },
  vip_purchase:      { icon: "star",         label: "VIP xarid qildi",     color: "from-amber-500 to-yellow-600" },
  highlight_purchase:{ icon: "palette",      label: "Highlight xarid qildi", color: "from-fuchsia-500 to-pink-600" },
  pin_purchase:      { icon: "mapPin",       label: "PIN xarid qildi",     color: "from-sky-500 to-blue-600" },
  premium_purchase:  { icon: "crown",        label: "Premium obuna oldi",  color: "from-yellow-500 to-orange-600" },
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const fetchNotifications = async () => {
    const notifs = await db.entities.AdminNotification.list("-created_date", 50);
    setNotifications(notifs);
    setUnread(notifs.filter((n) => !n.is_read).length);
  };

  useEffect(() => {
    fetchNotifications();
    const unsub = db.entities.AdminNotification.subscribe((event) => {
      if (event.type === "create") {
        setNotifications((prev) => [event.data, ...prev]);
        setUnread((prev) => prev + 1);
      }
    });
    return unsub;
  }, []);

  const handleOpen = async () => {
    setOpen(true);
    if (unread > 0) {
      // Single bulk update: one storage write, one notification per item.
      await db.entities.AdminNotification.updateWhere((n) => !n.is_read, { is_read: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center hover:border-primary/40 transition-all press"
      >
        <Icon name="bell" size="md" className="text-foreground" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-card">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center max-w-md mx-auto"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background rounded-t-3xl z-50 max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h3 className="font-extrabold text-base text-foreground flex items-center gap-1.5">
                    <Icon name="bell" size="sm" className="text-primary" />
                    Xarid bildirishnomalari
                  </h3>
                  <p className="text-[10px] text-muted-foreground">Barcha foydalanuvchi xaridlari</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center press"
                >
                  <Icon name="xmark" size="sm" className="text-muted-foreground" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2.5 nice-scroll">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Icon name="bellSlash" size="2xl" className="text-muted-foreground" />
                    </div>
                    <p className="font-extrabold text-sm">Bildirishnomalar yo'q</p>
                    <p className="text-xs text-muted-foreground mt-1">Yangi xaridlar shu yerda</p>
                  </div>
                ) : (
                  notifications.map((n, i) => {
                    const meta = ACTION_META[n.action_type] || { icon: "wallet", label: n.action_type, color: "from-slate-500 to-slate-600" };
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="bg-card border border-border rounded-2xl p-3 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-md", meta.color)}>
                            <Icon name={meta.icon} size="md" className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-extrabold text-sm text-foreground truncate">{n.user_name}</p>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {n.created_date ? format(new Date(n.created_date), "dd.MM HH:mm") : ""}
                              </span>
                            </div>
                            {n.user_phone && (
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Icon name="phone" size="xs" />{n.user_phone}
                              </p>
                            )}
                            <p className="text-xs text-primary font-bold mt-1">{meta.label}: {n.item_label}</p>
                            <div className="flex gap-1.5 mt-2 flex-wrap">
                              {n.credits_added > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-md">
                                  <Icon name="plus" size="xs" />{n.credits_added} bonus
                                </span>
                              )}
                              {n.credits_spent > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-md">
                                  <Icon name="minus" size="xs" />{n.credits_spent} bonus
                                </span>
                              )}
                              {n.demo_amount && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                                  <Icon name="moneyBill" size="xs" />{n.demo_amount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
