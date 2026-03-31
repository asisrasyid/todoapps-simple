"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NOTIF_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour between push notifications
const STORAGE_KEY = "sm_last_notif";

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  async function requestPermission() {
    if (!("Notification" in window)) return "denied" as const;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }

  return { permission, requestPermission };
}

export async function triggerStaleNotification(
  staleTasks: { title: string; daysSinceUpdate: number }[]
) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const lastNotif = localStorage.getItem(STORAGE_KEY);
  if (lastNotif && Date.now() - parseInt(lastNotif) < NOTIF_COOLDOWN_MS) return;

  const title = "Tasks need your attention 🔔";
  const body =
    staleTasks.length === 1
      ? `"${staleTasks[0].title}" has been idle for ${staleTasks[0].daysSinceUpdate} days`
      : `${staleTasks.length} tasks have been idle and need attention`;

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-72.png",
        tag: "stale-tasks",
        data: { url: "/dashboard" },
      });
    } else {
      new Notification(title, { body, icon: "/icons/icon-192.png" });
    }
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Notification blocked or unavailable
  }
}

interface NotificationBannerProps {
  onDismiss: () => void;
}

export function NotificationBanner({ onDismiss }: NotificationBannerProps) {
  const { permission, requestPermission } = useNotificationPermission();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("sm_notif_dismissed");
    if (!dismissed && "Notification" in window && Notification.permission === "default") {
      setVisible(true);
    }
  }, []);

  if (!visible || permission !== "default") return null;

  function dismiss() {
    localStorage.setItem("sm_notif_dismissed", "1");
    setVisible(false);
    onDismiss();
  }

  async function enable() {
    const result = await requestPermission();
    if (result !== "default") {
      setVisible(false);
      onDismiss();
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3">
      <Bell className="h-4 w-4 text-primary shrink-0" />
      <p className="flex-1 text-sm text-foreground">
        Enable notifications to get alerts when tasks are idle too long.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={enable} className="h-7 text-xs">
          Enable
        </Button>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
