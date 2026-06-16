import { db } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { formatDistanceToNow } from "date-fns";
import { CARGO_TYPES } from "@/lib/constants";
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

export default function DeletedUploadsTab() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [pendingRestore, setPendingRestore] = useState(null);

  useEffect(() => {
    db.entities.DeletedLoad.list("-created_date", 100)
      .then((data) => { setItems(data); setIsLoading(false); });
  }, []);

  const permanentlyDelete = async (item) => {
    setActionId(item.id + "_delete");
    await db.entities.DeletedLoad.delete(item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setActionId(null);
  };

  const restore = async (item) => {
    setActionId(item.id + "_restore");
    const original = JSON.parse(item.original_data);
    delete original.id;
    delete original.created_date;
    delete original.updated_date;
    await db.entities.Load.create({ ...original, status: "active" });
    await db.entities.DeletedLoad.delete(item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setActionId(null);
  };

  // Wrapper that opens the confirmation dialog
  const requestRestore = (item) => setPendingRestore(item);
  const cancelRestore = () => setPendingRestore(null);
  const confirmRestore = async () => {
    if (!pendingRestore) return;
    const item = pendingRestore;
    setPendingRestore(null);
    await restore(item);
  };

  // Build a summary of the pending restore for the dialog body
  const pendingOriginal = pendingRestore
    ? (() => { try { return JSON.parse(pendingRestore.original_data); } catch { return {}; } })()
    : null;
  const pendingCargo = pendingOriginal ? (CARGO_TYPES[pendingOriginal.cargo_type] || CARGO_TYPES.boshqa) : null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
          <Icon name="trash" size="2xl" className="text-muted-foreground/50" />
        </div>
        <p className="font-extrabold text-sm">O'chirilgan yuklar yo'q</p>
        <p className="text-xs text-muted-foreground mt-1">O'chirilgan yuklar shu yerda saqlanadi</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700">
        <Icon name="triangleExclamation" size="sm" />
        <p className="text-xs font-bold">{items.length} ta o'chirilgan yuk saqlangan</p>
      </div>
      {items.map((item, i) => {
        let original = {};
        try { original = JSON.parse(item.original_data); } catch {}
        const cargo = CARGO_TYPES[original.cargo_type] || CARGO_TYPES.boshqa;
        const isDeletingItem = actionId === item.id + "_delete";
        const isRestoringItem = actionId === item.id + "_restore";
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="bg-card border border-destructive/20 rounded-2xl p-3.5 shadow-sm"
          >
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                  <Icon name="locationDot" size="xs" className="text-muted-foreground" />
                  {original.from_location || "—"}
                  <Icon name="arrowRight" size="xs" className="text-muted-foreground" />
                  <Icon name="mapPin" size="xs" className="text-muted-foreground" />
                  {original.to_location || "—"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 inline-flex items-center gap-1">
                  <Icon name={cargo.icon} size="xs" />{cargo.label}
                </p>
              </div>
              <span className="inline-flex items-center gap-0.5 bg-destructive/10 text-destructive text-[10px] font-extrabold px-2 py-0.5 rounded-md whitespace-nowrap flex-shrink-0">
                <Icon name="trash" size="xs" />O'chirilgan
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground mb-3 space-y-1 bg-muted/30 rounded-xl p-2.5">
              <p className="flex items-center gap-1"><Icon name="user" size="xs" />Kim: <span className="font-bold text-foreground">{item.deleted_by_name || item.deleted_by_id || "—"}</span></p>
              <p className="flex items-center gap-1"><Icon name="clock" size="xs" />Qachon: <span className="font-bold text-foreground">{item.deletion_time ? formatDistanceToNow(new Date(item.deletion_time), { addSuffix: true }).replace("about ", "") : "—"}</span></p>
              {original.contact_phone && <p className="flex items-center gap-1"><Icon name="phone" size="xs" />{original.contact_phone}</p>}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-9 text-xs gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-xl"
                onClick={() => requestRestore(item)}
                disabled={!!actionId}
              >
                {isRestoringItem ? <Icon name="spinner" size="xs" spin /> : <Icon name="rotate" size="xs" />}
                Tiklash
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-9 text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl"
                onClick={() => permanentlyDelete(item)}
                disabled={!!actionId}
              >
                {isDeletingItem ? <Icon name="spinner" size="xs" spin /> : <Icon name="trash" size="xs" />}
                Butunlay
              </Button>
            </div>
          </motion.div>
        );
      })}

      <AlertDialog open={!!pendingRestore} onOpenChange={(o) => !o && cancelRestore()}>
        <AlertDialogContent className="max-w-[360px] rounded-2xl">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
              <Icon name="rotate" size="lg" className="text-emerald-700" />
            </div>
            <AlertDialogTitle className="text-center font-extrabold text-lg">Yukni tiklash</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-muted-foreground">
              Bu yuk qayta faollashtiriladi
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingOriginal && (
            <div className="bg-muted/40 rounded-xl p-3 space-y-1.5 text-xs">
              <p className="flex items-center gap-1.5 text-foreground font-bold">
                <Icon name="locationDot" size="xs" className="text-emerald-600" />
                {pendingOriginal.from_location || "—"}
                <Icon name="arrowRight" size="xs" className="text-muted-foreground" />
                <Icon name="mapPin" size="xs" className="text-rose-600" />
                {pendingOriginal.to_location || "—"}
              </p>
              {pendingCargo && (
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Icon name={pendingCargo.icon} size="xs" />{pendingCargo.label}
                </p>
              )}
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Icon name="userTie" size="xs" />
                Yuk egasi: <span className="font-bold text-foreground">{pendingOriginal.shipper_name || "noma'lum"}</span>
              </p>
              {pendingOriginal.contact_phone && (
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Icon name="phone" size="xs" />{pendingOriginal.contact_phone}
                </p>
              )}
            </div>
          )}

          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-1.5">
            <Icon name="triangleExclamation" size="xs" className="flex-shrink-0 mt-0.5" />
            <span>Yuk egasiga qaytariladi va u boshqaruv huquqini saqlab qoladi.</span>
          </p>

          <AlertDialogFooter className="flex-row gap-2 mt-2">
            <AlertDialogCancel className="flex-1 mt-0 rounded-xl h-11">Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11"
            >
              <Icon name="check" size="sm" className="mr-1.5" />Tiklash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
