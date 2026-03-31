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
import { cn, ROLE_CONFIG } from "@/lib/utils";
import { clearSession, getStoredUser } from "@/lib/auth";
import { apiLogout } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApprovals } from "@/hooks/useApprovals";
import { canApprove } from "@/lib/utils";
import { useSidebar } from "@/components/SidebarProvider";
import { useTheme } from "@/components/ThemeProvider";

const navItems = [
  { href: "/boards", label: "Boards", icon: LayoutDashboard },
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
  const user = getStoredUser();
  const { data: approvals } = useApprovals();
  const pendingCount = approvals?.length ?? 0;
  const { collapsed, mobileOpen, toggleCollapsed, setMobileOpen } = useSidebar();
  const { theme, setTheme } = useTheme();

  async function handleLogout() {
    try { await apiLogout(); } catch {}
    clearSession();
    router.push("/login");
  }

  if (!user) return null;

  const sidebarContent = (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex h-16 items-center justify-between border-b border-border px-3 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 pl-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 shrink-0">
              <CheckSquare className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-foreground text-base tracking-tight">SheetMaster</span>
          </div>
        )}
        {collapsed && (
          <div className="flex w-full justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <CheckSquare className="h-4 w-4 text-primary" />
            </div>
          </div>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex shrink-0 h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          if (item.needsApprover && !canApprove(user.roleGlobal)) return null;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.needsApprover && pendingCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.needsApprover && pendingCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className={cn("border-t border-border px-2 py-3", collapsed ? "flex justify-center" : "")}>
        {collapsed ? (
          <button
            onClick={() => {
              const next = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
              setTheme(next);
            }}
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

      {/* User footer */}
      <div className="border-t border-border p-2 shrink-0">
        <div className={cn("flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors", collapsed ? "justify-center" : "")}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback style={{ backgroundColor: user.avatarColor + "33", color: user.avatarColor }}>
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className={cn("text-xs", ROLE_CONFIG[user.roleGlobal].color)}>
                  {ROLE_CONFIG[user.roleGlobal].label}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-screen">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex h-full md:hidden">
            <aside className="flex h-full w-60 flex-col border-r border-border bg-card">
              {/* Logo + close */}
              <div className="flex h-16 items-center justify-between border-b border-border px-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 shrink-0">
                    <CheckSquare className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-bold text-foreground text-base tracking-tight">SheetMaster</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                {navItems.map((item) => {
                  if (item.needsApprover && !canApprove(user.roleGlobal)) return null;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.needsApprover && pendingCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                          {pendingCount}
                        </span>
                      )}
                    </Link>
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
                  <button onClick={handleLogout} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0" title="Logout">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </>
  );
}
