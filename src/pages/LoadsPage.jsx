import { db } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { filterLoads, rankLoads } from "@/lib/matching";
import LoadCard from "@/components/loads/LoadCard";
import FilterBar from "@/components/loads/FilterBar";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const DEFAULT_FILTERS = {
  from: "", to: "", cargo_type: "all", transport_type: "all", min_price: "", max_price: ""
};

export default function LoadsPage() {
  const [loads, setLoads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [driverRoute, setDriverRoute] = useState({ from: "", to: "" });

  useEffect(() => {
    db.entities.Load.filter({ status: "active" }, "-created_date", 100).then((data) => {
      setLoads(data);
      setIsLoading(false);
    });
  }, []);

  const filtered = filterLoads(loads, filters);
  const ranked = rankLoads(filtered, driverRoute.from, driverRoute.to);

  // Count boost types in the result
  const stats = {
    total: ranked.length,
    vip: ranked.filter((l) => l.is_vip).length,
    pin: ranked.filter((l) => l.is_pin).length,
    urgent: ranked.filter((l) => l.is_urgent).length,
    highlight: ranked.filter((l) => l.is_highlight).length,
  };

  return (
    <div className="flex flex-col h-full">
      <FilterBar filters={filters} onChange={setFilters} />

      <div className="flex-1 px-4 py-3 space-y-3 overflow-auto nice-scroll">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border p-4 h-32 shimmer-bg" />
            ))}
          </div>
        ) : ranked.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="relative w-20 h-20 mb-4">
              <div className="absolute inset-0 rounded-full bg-muted" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="packageSearch" size="3xl" className="text-muted-foreground/60" />
              </div>
            </div>
            <p className="font-extrabold text-foreground text-lg">Yuk topilmadi</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[260px]">
              Filtrlarni o'zgartiring yoki keyinroq urinib ko'ring
            </p>
            <Button
              variant="outline"
              className="mt-5 rounded-xl"
              onClick={() => setFilters(DEFAULT_FILTERS)}
            >
              <Icon name="arrowRotate" size="sm" className="mr-1.5" />
              Filtrlarni tozalash
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Stats & sort bar */}
            <div className="flex items-center justify-between pt-1 px-1">
              <div className="flex items-baseline gap-2">
                <p className="text-foreground font-extrabold text-sm">{ranked.length}</p>
                <p className="text-muted-foreground text-xs font-medium">ta yuk topildi</p>
              </div>
              <div className="flex items-center gap-1">
                {stats.pin > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                    <Icon name="mapPin" size="xs" />{stats.pin}
                  </span>
                )}
                {stats.urgent > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                    <Icon name="fire" size="xs" />{stats.urgent}
                  </span>
                )}
                {stats.vip > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                    <Icon name="star" size="xs" />{stats.vip}
                  </span>
                )}
              </div>
            </div>

            <AnimatePresence>
              {ranked.map((load, idx) => (
                <motion.div
                  key={load.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                >
                  <LoadCard load={load} matchScore={load._score} />
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
