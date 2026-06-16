import { db } from "@/api/base44Client";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { loadId } = useParams();
  const navigate = useNavigate();
  const [load, setLoad] = useState(null);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    Promise.all([
      db.auth.me().catch(() => null),
      db.entities.Load.filter({ id: loadId }).then(([d]) => d),
      db.entities.ChatMessage.filter({ load_id: loadId }, "created_date", 100),
    ]).then(([u, l, msgs]) => {
      setUser(u);
      setLoad(l);
      setMessages(msgs);
      setIsLoading(false);
    });
  }, [loadId]);

  useEffect(() => {
    const unsub = db.entities.ChatMessage.subscribe((event) => {
      if (event.data?.load_id !== loadId) return;
      if (event.type === "create") {
        setMessages((prev) => prev.find((m) => m.id === event.id) ? prev : [...prev, event.data]);
      }
    });
    return unsub;
  }, [loadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    const newMsg = {
      load_id: loadId,
      sender_id: user.id,
      sender_name: user.full_name || user.email,
      sender_role: load?.shipper_id === user.id ? "shipper" : "driver",
      text: text.trim(),
      is_read: false,
    };
    setText("");
    await db.entities.ChatMessage.create(newMsg);
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px-72px)]">
      {/* Chat header */}
      <div className="bg-card/90 backdrop-blur-md border-b border-border/60 px-4 py-3 flex items-center gap-3 sticky top-14 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center press">
          <Icon name="arrowLeft" size="sm" className="text-muted-foreground" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/30">
          <Icon name="packageSearch" size="md" className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm text-foreground leading-tight truncate">
            {load ? `${load.from_location} → ${load.to_location}` : "Chat"}
          </p>
          <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-ring" />
            Onlayn · {load?.contact_name || "Yuk egasi"}
          </p>
        </div>
        {load?.contact_phone && (
          <a href={`tel:${load.contact_phone}`}>
            <button className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center press">
              <Icon name="phoneVolume" size="sm" />
            </button>
          </a>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 nice-scroll">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="relative w-16 h-16 mb-3">
              <div className="absolute inset-0 rounded-full bg-primary/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="message" size="2xl" className="text-primary/60" />
              </div>
            </div>
            <p className="font-extrabold text-foreground text-sm">Suhbat boshlanmagan</p>
            <p className="text-xs text-muted-foreground mt-1">Birinchi xabarni yuboring</p>
          </motion.div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id;
          const prevMsg = messages[i - 1];
          const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}
            >
              {!isMe && (
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-xs font-bold text-muted-foreground">
                  {showAvatar ? msg.sender_name?.charAt(0).toUpperCase() : ""}
                </div>
              )}
              <div className={cn("max-w-[78%] flex flex-col gap-0.5", isMe ? "items-end" : "items-start")}>
                {showAvatar && (
                  <span className="text-[10px] font-bold text-muted-foreground px-2">{msg.sender_name}</span>
                )}
                <div
                  className={cn(
                    "px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm",
                    isMe
                      ? "bg-gradient-to-br from-primary to-blue-700 text-white rounded-tr-sm"
                      : "bg-card border border-border text-foreground rounded-tl-sm"
                  )}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-muted-foreground px-1.5 flex items-center gap-1">
                  <Icon name="clock" size="xs" />
                  {msg.created_date ? formatDistanceToNow(new Date(msg.created_date), { addSuffix: true }).replace("about ", "") : ""}
                </span>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/60 bg-card/95 backdrop-blur-md px-3 py-3 flex items-center gap-2 pb-safe">
        {!user ? (
          <Button className="w-full h-11 rounded-xl" onClick={() => db.auth.redirectToLogin()}>
            <Icon name="signIn" size="sm" className="mr-1.5" />
            Kirish
          </Button>
        ) : (
          <>
            <button className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center press flex-shrink-0">
              <Icon name="paperclip" size="sm" className="text-muted-foreground" />
            </button>
            <Input
              className="flex-1 h-11 rounded-xl bg-muted/40 border-0 text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
              placeholder="Xabar yozing..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
            <Button
              size="icon"
              className="w-11 h-11 rounded-xl flex-shrink-0 btn-glow"
              onClick={sendMessage}
              disabled={!text.trim() || sending}
            >
              {sending ? <Icon name="spinner" size="sm" spin /> : <Icon name="paperPlane" size="md" />}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
