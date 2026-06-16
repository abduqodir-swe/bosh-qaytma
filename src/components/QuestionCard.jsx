import { motion } from "framer-motion";

const topicIcons = ["💭", "🔍", "🌍", "🧠", "⚡", "🎯", "🌱", "🔑", "💡", "🪞"];

export default function QuestionCard({ question, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group relative"
    >
      <div className="flex items-start gap-4 p-5 md:p-6 rounded-xl bg-card border border-border/60 hover:border-accent/50 hover:shadow-lg transition-all duration-300">
        {/* Number indicator */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-body font-semibold text-primary">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Question text */}
        <div className="flex-1 min-w-0 pt-1.5">
          <p className="font-body text-foreground text-base md:text-lg leading-relaxed">
            {question}
          </p>
        </div>

        {/* Decorative icon */}
        <span className="text-xl opacity-40 group-hover:opacity-80 transition-opacity flex-shrink-0 pt-1">
          {topicIcons[index % topicIcons.length]}
        </span>
      </div>
    </motion.div>
  );
}