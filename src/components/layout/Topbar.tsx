"use client";
import { ReactNode } from "react";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/SidebarProvider";

interface TopbarProps {
  title: string;
  actions?: ReactNode;
}

export function Topbar({ title, actions }: TopbarProps) {
  const { setMobileOpen } = useSidebar();

  return (
    <header className="flex h-14 md:h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6 shrink-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden shrink-0 h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base md:text-lg font-semibold tracking-tight truncate">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
