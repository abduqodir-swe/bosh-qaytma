import { db } from "@/api/base44Client";
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { motion } from "framer-motion";

export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await db.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-muted">
            <div className="max-w-md w-full">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-6"
                >
                    <div className="relative inline-block">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl" />
                        <div className="relative w-32 h-32 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-2xl shadow-primary/10">
                            <span className="text-6xl font-black text-gradient">404</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-extrabold text-foreground flex items-center justify-center gap-2">
                            <Icon name="circleXmark" size="lg" className="text-destructive" />
                            Sahifa topilmadi
                        </h2>
                        <p className="text-muted-foreground leading-relaxed text-sm">
                            <span className="font-bold text-foreground">"{pageName}"</span> sahifasi mavjud emas
                        </p>
                    </div>

                    {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                        <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start space-x-3 text-left">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <Icon name="lightbulb" size="md" className="text-amber-700" />
                            </div>
                            <div>
                                <p className="text-sm font-extrabold text-amber-900">Admin eslatmasi</p>
                                <p className="text-xs text-amber-800 mt-0.5">Bu sahifa hali yaratilmagan. Chat'da AI'dan so'rang.</p>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={() => window.location.href = '/'}
                        className="rounded-xl h-12 px-6 btn-glow"
                    >
                        <Icon name="home" size="sm" className="mr-1.5" />
                        Bosh sahifaga
                    </Button>
                </motion.div>
            </div>
        </div>
    )
}
