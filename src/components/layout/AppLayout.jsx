import { Link, useLocation, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { getLocalUser } from "@/lib/localAuth";
import Icon from "@/components/ui/icon";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Nav items — path, icon name, label, optional adminOnly flag
const navItems = [
  { path: "/loads",     icon: "packageSearch", label: "Yuklar" },
  { path: "/post-load", icon: "plus",          label: "E'lon" },
  { path: "/chats",     icon: "commentDots",   label: "Xabarlar" },
  { path: "/profile",   icon: "user",          label: "Profil" },
  { path: "/admin",     icon: "gauge",         label: "Admin", adminOnly: true },
];

function usePageTitle() {
  const location = useLocation();
  return (() => {
    const p = location.pathname;
    if (p.startsWith("/loads/") && p !== "/loads") return "Yuk tafsilotlari";
    if (p === "/loads")      return "Yuklar";
    if (p === "/post-load")  return "Yangi e'lon";
    if (p === "/profile")    return "Profil";
    if (p === "/admin")      return "Admin panel";
    if (p === "/chats")      return "Xabarlar";
    if (p.startsWith("/chat/")) return "Suhbat";
    return "Bo'sh Qaytma";
  })();
}

// ----- Mobile top bar (sticky, only visible <lg) -----
function MobileTopBar() {
  const title = usePageTitle();
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-brand-gradient text-primary-foreground shadow-md shadow-primary/20">
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-grid" />
      <div className="relative px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 press">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
            <Icon name="truckFront" size="md" className="text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] uppercase tracking-[0.18em] text-white/60 font-semibold">Bosh sahifa</span>
            <h1 className="font-extrabold text-base text-white">{title}</h1>
          </div>
        </Link>
        <Link
          to="/post-load"
          className="w-9 h-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center press shadow-md shadow-yellow-500/30"
        >
          <Icon name="plus" size="md" />
        </Link>
      </div>
    </header>
  );
}

// ----- Desktop sidebar (only visible lg+) -----
function DesktopSidebar() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getLocalUser();
    setUser(u);
    setIsAdmin(u?.role === "admin");
  }, [location.pathname]);

  const visible = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col bg-card border-r border-border/60 sticky top-0 h-screen">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-border/60">
        <Link to="/" className="flex items-center gap-2.5 press">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-lg shadow-primary/30">
            <Icon name="truckFront" size="lg" className="text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Logistics</span>
            <span className="font-black text-foreground">Bo'sh Qaytma</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visible.map(({ path, icon, label }) => {
          const isActive = location.pathname === path || (path === "/loads" && location.pathname.startsWith("/loads/"));
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all press",
                isActive
                  ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "bg-muted"
              )}>
                <Icon name={icon} size="sm" className={isActive ? "text-white" : "text-muted-foreground"} />
              </div>
              <span>{label}</span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-dot"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User card at bottom */}
      {user && (
        <div className="px-3 py-4 border-t border-border/60">
          <Link
            to="/profile"
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted/60 transition press"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
              {(user.full_name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-foreground truncate">{user.full_name}</p>
              <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                <Icon name="phone" size="xs" />
                {user.phone}
              </p>
            </div>
            <Icon name="chevronRight" size="xs" className="text-muted-foreground" />
          </Link>
        </div>
      )}
    </aside>
  );
}

// ----- Mobile bottom nav (only visible <lg) -----
function MobileBottomNav() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const u = getLocalUser();
    setIsAdmin(u?.role === "admin");
  }, [location.pathname]);

  const visible = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-xl border-t border-border/70 z-30 pb-safe">
      <div className="flex items-stretch px-2 py-1.5">
        {visible.map(({ path, icon, label }) => {
          const isActive = location.pathname === path || (path === "/loads" && location.pathname.startsWith("/loads/"));
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all press",
                isActive ? "nav-pill-active" : "text-muted-foreground hover:text-foreground"
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
                  className={cn("relative z-10", isActive ? "text-primary" : "text-muted-foreground")}
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
    <div className="min-h-screen bg-background lg:flex">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-w-0 max-w-full">
        <MobileTopBar />
        <main className="flex-1 overflow-x-hidden nice-scroll pb-24 lg:pb-8">
          {/* Container: mobile = max-w-md; desktop = wider but still constrained for readability */}
          <div className="mx-auto w-full max-w-md lg:max-w-3xl xl:max-w-5xl 2xl:max-w-6xl px-4 lg:px-8 xl:px-10">
            <Outlet />
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
