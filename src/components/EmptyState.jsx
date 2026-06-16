import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8">
        <Lightbulb className="w-10 h-10 text-primary" />
      </div>
      <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mb-3">
        Fikrlashga tayyormisiz?
      </h2>
      <p className="font-body text-muted-foreground max-w-md text-base leading-relaxed">
        Tugmani bosing va chuqur o'ylashga unlovchi 10 ta savol yaratilsin. 
        Har bir savol — yangi fikr uchun eshik.
      </p>
    </motion.div>
  );
}