import { db } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function ChatsListPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    db.auth.me().catch(() => null).then(async (u) => {
      setUser(u);
      if (!u) { setIsLoading(false); return; }

      const myMsgs = await db.entities.ChatMessage.filter({ sender_id: u.id }, "-created_date", 200);
      const loadIds = [...new Set(myMsgs.map((m) => m.load_id))];

      const chatData = await Promise.all(
        loadIds.map(async (lid) => {
          const [load] = await db.entities.Load.filter({ id: lid });
          const msgs = await db.entities.ChatMessage.filter({ load_id: lid }, "-created_date", 1);
          return { load, lastMsg: msgs[0] };
        })
      );

      setChats(chatData.filter((c) => c.load));
      setIsLoading(false);
    });
  }, []);

  if (!user && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon name="signIn" size="3xl" className="text-muted-foreground" />
        </div>
        <p className="font-extrabold text-lg">Tizimga kiring</p>
        <p className="text-sm text-muted-foreground mt-1 mb-5">Xabarlarni ko'rish uchun avval kiring</p>
        <Button className="rounded-xl" onClick={() => db.auth.redirectToLogin()}>
          <Icon name="signIn" size="sm" className="mr-1.5" />
          Kirish
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-0 py-4 pb-24 lg:pb-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">Xabarlar</h2>
          <p className="text-xs text-muted-foreground">Yuk bo'yicha suhbatlaringiz</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon name="comments" size="md" className="text-primary" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-card border border-border shimmer-bg" />
          ))}
        </div>
      ) : chats.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="relative w-24 h-24 mb-4">
            <div className="absolute inset-0 rounded-full bg-muted" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon name="comments" size="4xl" className="text-muted-foreground/60" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
              <Icon name="plus" size="sm" />
            </div>
          </div>
          <p className="font-extrabold text-foreground text-lg">Xabarlar yo'q</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-[260px]">
            Yuk sahifasidan chat boshlang — suhbatlar shu yerda
          </p>
          <Button className="mt-5 rounded-xl" onClick={() => navigate("/loads")}>
            <Icon name="packageSearch" size="sm" className="mr-1.5" />
            Yuklarga o'tish
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {chats.map(({ load, lastMsg }, idx) => (
            <motion.button
              key={load.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => navigate(`/chat/${load.id}`)}
              className="w-full bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3 hover:border-primary/40 hover:shadow-md transition-all text-left press"
            >
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/20">
                <Icon name="packageSearch" size="md" className="text-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-sm text-foreground truncate flex items-center gap-1.5">
                  <Icon name="locationDot" size="xs" className="text-emerald-600" />
                  {load.from_location}
                  <Icon name="arrowRight" size="xs" className="text-muted-foreground" />
                  <Icon name="mapPin" size="xs" className="text-rose-600" />
                  {load.to_location}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                  <Icon name="comment" size="xs" />
                  {lastMsg?.text || "—"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px] text-muted-foreground">
                  {lastMsg?.created_date ? formatDistanceToNow(new Date(lastMsg.created_date), { addSuffix: true }).replace("about ", "") : ""}
                </span>
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <Icon name="chevronRight" size="xs" className="text-muted-foreground" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
