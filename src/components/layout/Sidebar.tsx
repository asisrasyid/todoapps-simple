"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  ShieldCheck,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn, ROLE_CONFIG } from "@/lib/utils";
import { clearSession, getStoredUser } from "@/lib/auth";
import type { User as UserType } from "@/types";
import { apiLogout } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApprovals } from "@/hooks/useApprovals";
import { canApprove } from "@/lib/utils";
import { useSidebar } from "@/components/SidebarProvider";
import { useTheme } from "@/components/ThemeProvider";
import { useTour } from "@/components/tour/TourProvider";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/boards", label: "Boards", icon: CheckSquare },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck, needsApprover: true },
  { href: "/profile", label: "Profile", icon: User },
];

const themeOptions = [
  { value: "light" as const, icon: Sun, label: "Light" },
  { value: "dark" as const, icon: Moon, label: "Dark" },
  { value: "system" as const, icon: Monitor, label: "System" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  useEffect(() => { setUser(getStoredUser()); }, []);
  const { data: approvals } = useApprovals();
  const pendingCount = approvals?.length ?? 0;
  const { collapsed, mobileOpen, toggleCollapsed, setMobileOpen } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { startMainTour } = useTour();

  async function handleLogout() {
    try { await apiLogout(); } catch {}
    clearSession();
    router.push("/login");
  }

  if (!user) return null;

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <div className="hidden md:flex h-screen">
        <motion.aside
          data-tour="sidebar"
          animate={{ width: collapsed ? 56 : 240 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          // Clicking the collapsed sidebar expands it; icons still navigate via href
          onClick={collapsed ? toggleCollapsed : undefined}
          className={cn(
            "flex h-full flex-col border-r border-border bg-card overflow-hidden shrink-0",
            collapsed ? "cursor-pointer" : ""
          )}
        >
          {/* Logo + collapse toggle */}
          <div className="flex h-16 items-center justify-between border-b border-border px-3 shrink-0">
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  key="logo-full"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-2 pl-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 shrink-0">
                    <CheckSquare className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-bold text-foreground text-base tracking-tight whitespace-nowrap">Todo Track</span>
                </motion.div>
              )}
            </AnimatePresence>
            {collapsed && (
              <div className="flex w-full justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                  <CheckSquare className="h-4 w-4 text-primary" />
                </div>
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); toggleCollapsed(); }}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
                collapsed ? "hidden" : ""
              )}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Nav */}
          <nav aria-label="Main navigation" className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {navItems.map((item) => {
              if (item.needsApprover && !canApprove(user.roleGlobal)) return null;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour={`nav-${item.href.replace("/", "")}`}
                  // stopPropagation so aside's onClick (expand) doesn't double-fire;
                  // we handle navigation directly. On collapsed, also expand.
                  onClick={(e) => { e.stopPropagation(); if (collapsed) toggleCollapsed(); }}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors relative",
                    collapsed ? "justify-center" : "",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.span
                        key="label"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <AnimatePresence initial={false}>
                    {!collapsed && item.needsApprover && pendingCount > 0 && (
                      <motion.span
                        key="badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        aria-label={`${pendingCount} pending approvals`}
                        aria-live="polite"
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white"
                      >
                        {pendingCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {collapsed && item.needsApprover && pendingCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Theme toggle */}
          <div data-tour="theme-toggle" className={cn("border-t border-border px-2 py-3", collapsed ? "flex justify-center" : "")}>
            {collapsed ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const next = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
                  setTheme(next);
                }}
                aria-label={`Switch theme, current: ${theme}`}
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title={`Theme: ${theme}`}
              >
                {theme === "dark" ? <Moon className="h-4 w-4" /> : theme === "light" ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
              </button>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground px-2 mb-1.5">Theme</p>
                <div className="flex gap-1">
                  {themeOptions.map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      title={label}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors",
                        theme === value
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Help / tour trigger */}
          <div data-tour="tour-help" className={cn("px-2 pb-1", collapsed ? "flex justify-center" : "")}>
            <button
              onClick={(e) => { e.stopPropagation(); startMainTour(); }}
              aria-label="Mulai tur fitur"
              title="Tur fitur"
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full",
                collapsed ? "justify-center w-8 h-8 p-0" : ""
              )}
            >
              <span className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border-2 border-muted-foreground/40 text-[10px] font-bold shrink-0",
                "hover:border-primary/60 hover:text-primary"
              )}>?</span>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    key="tour-label"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap"
                  >
                    Tur Fitur
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* User footer */}
          <div className="border-t border-border p-2 shrink-0">
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors",
              collapsed ? "justify-center" : ""
            )}>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback style={{ backgroundColor: user.avatarColor + "33", color: user.avatarColor }}>
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.div
                    key="user-info"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-1 min-w-0 items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className={cn("text-xs", ROLE_CONFIG[user.roleGlobal].color)}>
                        {ROLE_CONFIG[user.roleGlobal].label}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      aria-label="Logout"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
                      title="Logout"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.aside>
      </div>

      {/* ── Mobile drawer ────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-backdrop"
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key="mobile-drawer"
              className="fixed inset-y-0 left-0 z-50 md:hidden"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <aside className="flex h-full w-60 flex-col border-r border-border bg-card shadow-toon">
                {/* Logo + close */}
                <div className="flex h-16 items-center justify-between border-b border-border px-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 shrink-0">
                      <CheckSquare className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-bold text-foreground text-base tracking-tight">Todo Track</span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation menu"
                    className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                  {navItems.map((item, idx) => {
                    if (item.needsApprover && !canApprove(user.roleGlobal)) return null;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/15 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          {item.needsApprover && pendingCount > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                              {pendingCount}
                            </span>
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Theme */}
                <div className="border-t border-border px-2 py-3">
                  <p className="text-xs text-muted-foreground px-2 mb-1.5">Theme</p>
                  <div className="flex gap-1">
                    {themeOptions.map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors",
                          theme === value
                            ? "bg-primary/15 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* User footer */}
                <div className="border-t border-border p-2 shrink-0">
                  <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback style={{ backgroundColor: user.avatarColor + "33", color: user.avatarColor }}>
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className={cn("text-xs", ROLE_CONFIG[user.roleGlobal].color)}>
                        {ROLE_CONFIG[user.roleGlobal].label}
                      </p>
                    </div>
                    <button onClick={handleLogout} aria-label="Logout" className="rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </aside>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
