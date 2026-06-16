import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CITIES, CARGO_TYPES, TRANSPORT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function FilterBar({ filters, onChange }) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(filters);

  const activeCount = Object.entries(filters).filter(([k, v]) => v && v !== "all" && v !== "").length;

  const apply = () => {
    onChange(local);
    setOpen(false);
  };

  const reset = () => {
    const empty = { from: "", to: "", cargo_type: "all", transport_type: "all", min_price: "", max_price: "" };
    setLocal(empty);
    onChange(empty);
    setOpen(false);
  };

  return (
    <div className="flex gap-2 px-4 py-3 bg-card/80 backdrop-blur-md border-b border-border/60 sticky top-14 z-20">
      {/* Quick city search */}
      <div className="flex-1 relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon name="search" size="sm" className="text-primary" />
        </div>
        <Input
          className="pl-11 h-11 text-sm rounded-xl bg-muted/40 border-border/60 focus-visible:ring-2 focus-visible:ring-primary/30"
          placeholder="Shahar yoki marshrut..."
          value={filters.from || ""}
          onChange={(e) => onChange({ ...filters, from: e.target.value })}
        />
        {filters.from && (
          <button
            onClick={() => onChange({ ...filters, from: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center"
          >
            <Icon name="xmark" size="xs" className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Advanced Filter */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant={activeCount > 0 ? "default" : "outline"}
            size="default"
            className={cn(
              "h-11 gap-2 relative rounded-xl px-3",
              activeCount > 0 && "btn-glow"
            )}
          >
            <Icon name="sliders" size="sm" />
            <span className="hidden sm:inline text-sm font-semibold">Filter</span>
            {activeCount > 0 && (
              <span className="ml-0.5 min-w-5 h-5 px-1 bg-white text-primary rounded-full text-[10px] flex items-center justify-center font-extrabold">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto p-0 overflow-hidden">
          <div className="px-5 pt-3 pb-1">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-lg">
                <Icon name="sliders" size="md" className="text-primary" />
                Filtrlash
              </SheetTitle>
            </SheetHeader>
          </div>

          <div className="space-y-4 px-5 pb-5 max-h-[70vh] overflow-y-auto nice-scroll">
            {/* Cities */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Icon name="route" size="xs" /> Marshrut
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Qayerdan</label>
                  <Select value={local.from || "all"} onValueChange={(v) => setLocal({ ...local, from: v === "all" ? "" : v })}>
                    <SelectTrigger className="h-10 text-sm rounded-xl"><SelectValue placeholder="Shahar" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="all">Hammasi</SelectItem>
                      {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Qayerga</label>
                  <Select value={local.to || "all"} onValueChange={(v) => setLocal({ ...local, to: v === "all" ? "" : v })}>
                    <SelectTrigger className="h-10 text-sm rounded-xl"><SelectValue placeholder="Shahar" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="all">Hammasi</SelectItem>
                      {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Cargo type */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Icon name="boxes" size="xs" /> Yuk turi
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setLocal({ ...local, cargo_type: "all" })}
                  className={cn(
                    "h-16 rounded-xl border flex flex-col items-center justify-center gap-1 transition press",
                    local.cargo_type === "all" || !local.cargo_type
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <Icon name="layerGroup" size="md" />
                  <span className="text-[10px] font-semibold">Hammasi</span>
                </button>
                {Object.entries(CARGO_TYPES).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setLocal({ ...local, cargo_type: k })}
                    className={cn(
                      "h-16 rounded-xl border flex flex-col items-center justify-center gap-1 transition press",
                      local.cargo_type === k
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <Icon name={v.icon} size="md" />
                    <span className="text-[10px] font-semibold leading-tight text-center px-1 truncate w-full">{v.label.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Transport type */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Icon name="truckFront" size="xs" /> Transport turi
              </p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setLocal({ ...local, transport_type: "all" })}
                  className={cn(
                    "h-14 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition press",
                    local.transport_type === "all" || !local.transport_type
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <Icon name="layerGroup" size="md" />
                  <span className="text-[9px] font-semibold">Hammasi</span>
                </button>
                {Object.entries(TRANSPORT_TYPES).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setLocal({ ...local, transport_type: k })}
                    className={cn(
                      "h-14 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition press",
                      local.transport_type === k
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <Icon name={v.icon} size="md" />
                    <span className="text-[9px] font-semibold leading-tight">{v.label.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Icon name="moneyBillWave" size="xs" /> Narx (USD)
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <Input
                  type="number"
                  placeholder="Dan"
                  className="h-10 rounded-xl"
                  value={local.min_price || ""}
                  onChange={(e) => setLocal({ ...local, min_price: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Gacha"
                  className="h-10 rounded-xl"
                  value={local.max_price || ""}
                  onChange={(e) => setLocal({ ...local, max_price: e.target.value })}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2">
              <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={reset}>
                <Icon name="arrowRotate" size="sm" className="mr-1.5" />
                Tozalash
              </Button>
              <Button className="flex-1 h-11 rounded-xl btn-glow" onClick={apply}>
                <Icon name="check" size="sm" className="mr-1.5" />
                Qo'llash
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
