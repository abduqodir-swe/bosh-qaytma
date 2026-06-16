import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-24 gap-5"
    >
      <Loader2 className="w-10 h-10 text-accent animate-spin" />
      <p className="font-body text-muted-foreground text-base animate-pulse">
        Savollar tayyorlanmoqda...
      </p>
    </motion.div>
  );
}