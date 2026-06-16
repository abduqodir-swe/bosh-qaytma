import { db } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CARGO_TYPES, TRANSPORT_TYPES, STATUS_CONFIG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { formatDistanceToNow, format } from "date-fns";

export default function LoadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [load, setLoad] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    db.entities.Load.filter({ id }).then(([data]) => {
      setLoad(data);
      setIsLoading(false);
      if (data) {
        db.entities.Load.update(data.id, { views: (data.views || 0) + 1 });
      }
    });
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!load) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon name="packageSearch" size="3xl" className="text-muted-foreground" />
        </div>
        <p className="font-extrabold text-lg">Yuk topilmadi</p>
        <p className="text-sm text-muted-foreground mt-1">E'lon o'chirilgan yoki mavjud emas</p>
        <Button className="mt-5 rounded-xl" onClick={() => navigate("/loads")}>
          <Icon name="arrowLeft" size="sm" className="mr-1.5" />
          Yuklarga qaytish
        </Button>
      </div>
    );
  }

  const cargo = CARGO_TYPES[load.cargo_type] || CARGO_TYPES.boshqa;
  const transport = TRANSPORT_TYPES[load.transport_type];
  const status = STATUS_CONFIG[load.status] || STATUS_CONFIG.active;

  const priceDisplay = load.price
    ? (load.currency === "USD"
        ? `$${load.price.toLocaleString()}`
        : `${load.price.toLocaleString()} so'm`)
    : "Kelishiladi";

  const handleAccept = async () => {
    setApplying(true);
    await new Promise((r) => setTimeout(r, 800));
    setApplying(false);
    setApplied(true);
  };

  return (
    <div className="flex flex-col">
      {/* Hero header */}
      <div className="relative bg-brand-gradient text-primary-foreground px-4 pt-4 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-yellow-400/20 blur-3xl pointer-events-none" />

        <div className="relative">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-white/80 mb-4 text-sm font-medium press"
          >
            <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
              <Icon name="arrowLeft" size="sm" />
            </div>
            Orqaga
          </button>

          <div className="flex items-start justify-between mb-4">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md border ${status.color}`}>
              <Icon name={status.icon} size="xs" />
              {status.label}
            </span>
            <div className="flex items-center gap-1 text-white/70 text-xs">
              <Icon name="eye" size="xs" /> {load.views || 0} ko'rildi
            </div>
          </div>

          {/* Route */}
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-[10px] uppercase tracking-wider font-semibold">Qayerdan</p>
              <p className="text-xl font-extrabold truncate">{load.from_location}</p>
            </div>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-12 h-[2px] bg-white/30 mb-1" />
              <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                <Icon name="truckFast" size="md" className="text-white" />
              </div>
              <div className="w-12 h-[2px] bg-white/30 mt-1" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-white/60 text-[10px] uppercase tracking-wider font-semibold">Qayerga</p>
              <p className="text-xl font-extrabold truncate">{load.to_location}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-0 -mt-5 space-y-3 pb-32 lg:pb-0 relative z-10 lg:grid lg:grid-cols-3 lg:gap-4">
        {/* Price card */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between"
        >
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Icon name="moneyBillWave" size="xs" /> Narx
            </p>
            <p className="text-2xl font-black text-primary mt-0.5">{priceDisplay}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 justify-end">
              <Icon name="clock" size="xs" /> Vaqt
            </p>
            <p className="text-xs font-bold text-foreground mt-0.5">
              {load.created_date ? formatDistanceToNow(new Date(load.created_date), { addSuffix: true }) : "—"}
            </p>
          </div>
        </motion.div>

        {/* Details grid */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-4 shadow-sm"
        >
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
            <Icon name="listCheck" size="xs" /> Tafsilotlar
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1"><Icon name="boxes" size="xs" /> Yuk turi</p>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border ${cargo.color}`}>
                <Icon name={cargo.icon} size="xs" />
                {cargo.label}
              </span>
            </div>
            {transport && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1"><Icon name="truckFront" size="xs" /> Transport</p>
                <p className="text-sm font-bold text-foreground flex items-center gap-1">
                  <Icon name={transport.icon} size="sm" className="text-primary" />
                  {transport.label}
                </p>
              </div>
            )}
            {load.weight && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1"><Icon name="weightScale" size="xs" /> Og'irlik</p>
                <p className="text-sm font-bold text-foreground">{load.weight} tonna</p>
              </div>
            )}
            {load.volume && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1"><Icon name="cube" size="xs" /> Hajm</p>
                <p className="text-sm font-bold text-foreground">{load.volume} m³</p>
              </div>
            )}
            {load.load_date && (
              <div className="col-span-2">
                <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1"><Icon name="calendar" size="xs" /> Yuklanish sanasi</p>
                <p className="text-sm font-bold text-foreground">{format(new Date(load.load_date), "dd.MM.yyyy")}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Description */}
        {load.description && (
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-4 shadow-sm"
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Icon name="commentDots" size="xs" /> Izoh
            </p>
            <p className="text-sm text-foreground leading-relaxed">{load.description}</p>
          </motion.div>
        )}

        {/* Contact — sidebar on desktop, full-width on mobile */}
        <div className="lg:col-start-3 lg:row-start-2 lg:row-span-2 lg:sticky lg:top-4 lg:self-start space-y-3">
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl p-4 shadow-sm"
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <Icon name="userTie" size="xs" /> Aloqa
            </p>
            {load.contact_name && (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-primary/30">
                  {load.contact_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-foreground">{load.contact_name}</p>
                  <p className="text-[10px] text-muted-foreground">Yuk egasi</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <a href={`tel:${load.contact_phone}`} className="contents">
                <Button className="w-full gap-2 rounded-xl h-11" variant="outline">
                  <Icon name="phoneVolume" size="sm" className="text-primary" />
                  <span className="text-xs font-bold truncate">{load.contact_phone}</span>
                </Button>
              </a>
              {load.telegram ? (
                <a href={`https://t.me/${load.telegram.replace("@", "")}`} target="_blank" rel="noreferrer" className="contents">
                  <Button className="w-full gap-2 rounded-xl h-11 bg-[#229ED9] hover:bg-[#1B8FCB] text-white">
                    <Icon name="telegram" size="sm" />
                    <span className="text-xs font-bold">Telegram</span>
                  </Button>
                </a>
              ) : (
                <Button className="w-full gap-2 rounded-xl h-11" variant="outline" onClick={() => navigate(`/chat/${load.id}`)}>
                  <Icon name="commentDots" size="sm" className="text-primary" />
                  <span className="text-xs font-bold">Yozish</span>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom CTA — fixed on mobile, inline on desktop (because sidebar takes space) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background/95 to-background/0 backdrop-blur z-20
                      lg:static lg:left-auto lg:translate-x-0 lg:max-w-none lg:w-full lg:px-0 lg:pb-0 lg:pt-3 lg:bg-transparent lg:backdrop-blur-0 lg:mt-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className="gap-2 flex-shrink-0 rounded-xl h-12"
            onClick={() => navigate(`/chat/${load.id}`)}
          >
            <Icon name="commentDots" size="md" />
            Chat
          </Button>
          {applied ? (
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2 rounded-xl h-12" size="lg">
              <Icon name="checkCircle" size="md" />
              Qabul qilindi!
            </Button>
          ) : (
            <Button className="flex-1 gap-2 rounded-xl h-12 btn-glow" size="lg" onClick={handleAccept} disabled={applying}>
              {applying ? (
                <Icon name="spinner" size="md" spin />
              ) : (
                <>
                  <Icon name="check" size="md" />
                  Yukni qabul qilish
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
