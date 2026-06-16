import { Link, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useCurrentUser";

const navItems = [
  { path: "/loads",      icon: "packageSearch", label: "Yuklar" },
  { path: "/post-load",  icon: "plus",          label: "E'lon" },
  { path: "/chats",      icon: "commentDots",   label: "Xabarlar" },
  { path: "/profile",    icon: "user",          label: "Profil" },
  { path: "/admin",      icon: "gauge",         label: "Admin" },
];

// Top-bar: slim, glassy, brand-styled
function TopBar() {
  const location = useLocation();
  const pageTitle = (() => {
    if (location.pathname.startsWith("/loads/") && location.pathname !== "/loads") return "Yuk tafsilotlari";
    if (location.pathname === "/loads")      return "Yuklar";
    if (location.pathname === "/post-load")  return "Yangi e'lon";
    if (location.pathname === "/profile")    return "Profil";
    if (location.pathname === "/admin")      return "Admin panel";
    if (location.pathname === "/chats")      return "Xabarlar";
    if (location.pathname.startsWith("/chat/")) return "Suhbat";
    return "Bo'sh Qaytma";
  })();

  return (
    <header className="sticky top-0 z-30 bg-brand-gradient text-primary-foreground shadow-md shadow-primary/20">
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-grid"></div>
      <div className="relative px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 press">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
            <Icon name="truck-front" size="lg" className="text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-semibold">Bosh sahifa</span>
            <h1 className="font-extrabold text-base text-white">{pageTitle}</h1>
          </div>
        </Link>
        <Link
          to="/post-load"
          className="hidden sm:flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur transition px-3 h-9 rounded-xl border border-white/20 press"
        >
          <Icon name="plus" size="sm" className="text-white" />
          <span className="text-xs font-bold text-white">E'lon berish</span>
        </Link>
        <Link
          to="/post-load"
          className="sm:hidden w-9 h-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center press"
        >
          <Icon name="plus" size="md" />
        </Link>
      </div>
    </header>
  );
}

function BottomNav() {
  const location = useLocation();
  const isAdmin = useIsAdmin();

  const visible = navItems.filter((item) => item.path !== "/admin" || isAdmin);

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-xl border-t border-border/70 z-30 pb-safe">
      <div className="flex items-stretch px-2 py-1.5">
        {visible.map(({ path, icon, label }) => {
          const isActive = location.pathname === path || (path === "/loads" && location.pathname.startsWith("/loads/"));
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all press",
                isActive
                  ? "nav-pill-active"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="nav-active-indicator"
                    className="absolute inset-0 -m-1.5 rounded-full bg-primary/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  name={icon}
                  size="lg"
                  className={cn(
                    "relative z-10",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </div>
              <span className={cn(
                "text-[10px] leading-none mt-0.5",
                isActive ? "font-bold text-primary" : "font-medium text-muted-foreground"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      <TopBar />
      <main className="flex-1 overflow-auto pb-24 nice-scroll">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
