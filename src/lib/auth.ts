import { Session, User } from "@/types";

const TOKEN_KEY = "sm_token";
const USER_KEY = "sm_user";

export function saveSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);
  if (!token || !userStr) return null;
  try {
    return { token, user: JSON.parse(userStr) };
  } catch {
    return null;
  }
}

export function clearSession(): void {
  // Remove all app-specific keys (sm_* prefix) — clears session, tour state, notifications, etc.
  const keysToRemove = Object.keys(localStorage).filter((k) => k.startsWith("sm_"));
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

export function isAuthenticated(): boolean {
  return !!getSession();
}

export function getStoredUser(): User | null {
  return getSession()?.user ?? null;
}
