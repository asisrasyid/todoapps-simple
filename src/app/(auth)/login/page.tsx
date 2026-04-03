"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiLogin } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError("");
    try {
      const { token, user } = await apiLogin(username.trim(), password);
      saveSession(token, user);
      router.push("/boards");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-primary/5 blur-2xl" />
      </div>

      <motion.div
        className="relative w-full max-w-sm"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <motion.div
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-toon-primary"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <CheckSquare className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Todo Track</h1>
            <p className="text-sm text-muted-foreground mt-1">Your fun kanban workspace ✨</p>
          </div>
        </div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="rounded-2xl border-2 border-border bg-card p-6 space-y-4 shadow-toon"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="your.username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              disabled={loading}
              className="rounded-xl border-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                className="pr-10 rounded-xl border-2 focus-visible:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-xl bg-destructive/15 border-2 border-destructive/30 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}

          <Button
            type="submit"
            className="w-full rounded-xl h-11 font-bold text-base shadow-toon-primary bg-primary hover:bg-primary/90 active:translate-y-0.5 active:shadow-none transition-all"
            disabled={loading || !username || !password}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in 🚀"
            )}
          </Button>
        </motion.form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Contact your administrator to get an account.
        </p>
      </motion.div>
    </div>
  );
}
