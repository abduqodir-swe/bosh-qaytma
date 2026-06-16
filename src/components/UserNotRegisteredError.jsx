import React from 'react';
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";

const UserNotRegisteredError = () => {
  return (
    <div className="min-h-screen flex items-center justify-center hero-bg-soft relative overflow-hidden p-5">
      <div className="absolute -top-32 -left-20 w-72 h-72 rounded-full bg-yellow-400/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-sky-300/25 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-blue-900/30 p-8 border border-white/40"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200">
            <Icon name="triangleExclamation" size="2xl" className="text-orange-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground mb-3">Ruxsat berilmagan</h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Siz bu ilova uchun ro'yxatdan o'tmagansiz. Foydalanish uchun administrator bilan bog'laning.
          </p>
          <div className="bg-amber-50 rounded-2xl p-4 text-left text-sm border border-amber-200">
            <p className="text-amber-900 font-bold flex items-center gap-1.5 mb-2">
              <Icon name="lightbulb" size="sm" className="text-amber-700" />
              Nima qilish mumkin?
            </p>
            <ul className="space-y-1.5 text-amber-800">
              <li className="flex items-start gap-1.5"><Icon name="check" size="xs" className="text-amber-700 mt-0.5" />Telegram orqali administrator bilan bog'laning</li>
              <li className="flex items-start gap-1.5"><Icon name="check" size="xs" className="text-amber-700 mt-0.5" />Akkountingiz to'g'ri ekanligini tekshiring</li>
              <li className="flex items-start gap-1.5"><Icon name="check" size="xs" className="text-amber-700 mt-0.5" />Qaytadan kirishni sinab ko'ring</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserNotRegisteredError;
