"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User,
  UserPlus,
  Pencil,
  KeyRound,
  Loader2,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Key,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { getStoredUser, saveSession, getSession } from "@/lib/auth";
import { cn, ROLE_CONFIG } from "@/lib/utils";
import {
  apiGetUsers,
  apiCreateUser,
  apiUpdateUser,
  apiUpdateOwnProfile,
  apiChangeOwnPassword,
  apiGenerateApiKey,
  apiListApiKeys,
  apiRevokeApiKey,
} from "@/lib/api";
import { User as UserType } from "@/types";

const ROLES = ["owner", "approver", "contributor", "viewer"] as const;

export default function ProfilePage() {
  const me = getStoredUser();
  const isOwner = me?.roleGlobal === "owner";

  const [tab, setTab] = useState<"profile" | "users" | "apikeys">("profile");

  return (
    <>
      <Topbar title="Profile" />
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          className="max-w-2xl mx-auto space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Tabs */}
          <div className="flex gap-1 rounded-2xl border-2 border-border bg-card p-1 w-fit">
            <button
              onClick={() => setTab("profile")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                tab === "profile"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <User className="h-4 w-4" />
              My Profile
            </button>
            {isOwner && (
              <button
                onClick={() => setTab("users")}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                  tab === "users"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                Manage Users
              </button>
            )}
            <button
              onClick={() => setTab("apikeys")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                tab === "apikeys"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Key className="h-4 w-4" />
              API Keys
            </button>
          </div>

          {tab === "profile" && <MyProfile />}
          {tab === "users" && isOwner && <ManageUsers />}
          {tab === "apikeys" && <ApiKeys />}
        </motion.div>
      </div>
    </>
  );
}

// ─── My Profile ───────────────────────────────────────────────────────────────

function MyProfile() {
  const me = getStoredUser();
  const queryClient = useQueryClient();

  const [name, setName] = useState(me?.name ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const updateProfile = useMutation({
    mutationFn: () => apiUpdateOwnProfile(name),
    onSuccess: () => {
      const session = getSession();
      if (session) {
        saveSession(session.token, { ...session.user, name });
      }
      toast({ title: "Profile updated", variant: "success" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const changePw = useMutation({
    mutationFn: () => apiChangeOwnPassword(currentPw, newPw),
    onSuccess: () => {
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast({ title: "Password changed", variant: "success" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  if (!me) return null;

  return (
    <div className="space-y-4">
      {/* Avatar + info */}
      <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback
            style={{ backgroundColor: me.avatarColor + "33", color: me.avatarColor }}
            className="text-lg font-bold"
          >
            {me.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-lg">{me.name}</p>
          <p className="text-sm text-muted-foreground">@{me.username}</p>
          <span className={cn("text-xs font-medium", ROLE_CONFIG[me.roleGlobal].color)}>
            {ROLE_CONFIG[me.roleGlobal].label}
          </span>
        </div>
      </div>

      {/* Edit name */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Pencil className="h-4 w-4 text-muted-foreground" />
          Edit Profile
        </h2>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Display Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>
        <Button
          onClick={() => updateProfile.mutate()}
          disabled={updateProfile.isPending || !name.trim() || name === me.name}
        >
          {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          Change Password
        </h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Current Password</label>
            <Input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">New Password</label>
            <Input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>
        <Button
          onClick={() => {
            if (newPw !== confirmPw) {
              toast({ title: "Passwords do not match", variant: "destructive" });
              return;
            }
            changePw.mutate();
          }}
          disabled={changePw.isPending || !currentPw || !newPw || !confirmPw}
        >
          {changePw.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Change Password
        </Button>
      </div>
    </div>
  );
}

// ─── Manage Users (Owner only) ────────────────────────────────────────────────

function ManageUsers() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: apiGetUsers,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserType | null>(null);

  const toggleActive = useMutation({
    mutationFn: (u: UserType) =>
      apiUpdateUser(u.id, { isActive: !u.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User updated", variant: "success" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {users?.length ?? 0} user{users?.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {users?.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                  style={{ backgroundColor: u.avatarColor + "33", color: u.avatarColor }}
                  className="text-xs font-bold"
                >
                  {u.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{u.name}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
              <span className={cn("text-xs font-medium shrink-0", ROLE_CONFIG[u.roleGlobal].color)}>
                {ROLE_CONFIG[u.roleGlobal].label}
              </span>
              <button
                onClick={() => toggleActive.mutate(u)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                title={u.isActive ? "Deactivate" : "Activate"}
              >
                {u.isActive ? (
                  <ToggleRight className="h-5 w-5 text-green-400" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditUser(u)}
                className="shrink-0 h-7 w-7 p-0"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
      />
      {editUser && (
        <EditUserDialog
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
        />
      )}
    </div>
  );
}

// ─── Create User Dialog ───────────────────────────────────────────────────────

function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("contributor");

  const create = useMutation({
    mutationFn: () => apiCreateUser(username, password, name, role),
    onSuccess: () => {
      toast({ title: "User created", variant: "success" });
      onCreated();
      onClose();
      setUsername("");
      setPassword("");
      setName("");
      setRole("contributor");
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Display Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !username || !password || !name}
          >
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

function ApiKeys() {
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const { data: keys, isLoading } = useQuery({
    queryKey: ["apikeys"],
    queryFn: apiListApiKeys,
  });

  const generate = useMutation({
    mutationFn: () => apiGenerateApiKey(newKeyName || "My API Key"),
    onSuccess: (data) => {
      setRevealedKey(data.key);
      setNewKeyName("");
      queryClient.invalidateQueries({ queryKey: ["apikeys"] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const revoke = useMutation({
    mutationFn: (keyId: string) => apiRevokeApiKey(keyId),
    onSuccess: () => {
      toast({ title: "API key revoked", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["apikeys"] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      {/* New key revealed */}
      {revealedKey && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 space-y-2">
          <p className="text-sm font-semibold text-green-400">API key generated — copy it now, it won't be shown again</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-md bg-background px-3 py-2 text-xs font-mono text-foreground border border-border">
              {revealedKey}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(revealedKey);
                toast({ title: "Copied!", variant: "success" });
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <button onClick={() => setRevealedKey(null)} className="text-xs text-muted-foreground hover:text-foreground">
            Dismiss
          </button>
        </div>
      )}

      {/* Generate new key */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          Generate API Key
        </h2>
        <div className="flex gap-2">
          <Input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g. CI/CD, Zapier)"
            className="flex-1"
          />
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
            {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="ml-1.5">Generate</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          API keys let external tools access SheetMaster on your behalf. Each key has the same permissions as your account.
        </p>
      </div>

      {/* Key list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium">Active Keys</p>
        </div>
        {isLoading ? (
          <div className="flex h-20 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : !keys?.length ? (
          <div className="flex h-20 items-center justify-center">
            <p className="text-sm text-muted-foreground">No API keys yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center gap-3 px-4 py-3">
                <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{k.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{k.keyPreview}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {new Date(k.createdAt).toLocaleDateString()}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => revoke.mutate(k.id)}
                  disabled={revoke.isPending}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                  title="Revoke key"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Edit User Dialog ─────────────────────────────────────────────────────────

function EditUserDialog({
  user,
  onClose,
  onUpdated,
}: {
  user: UserType;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.roleGlobal);
  const [newPw, setNewPw] = useState("");

  const update = useMutation({
    mutationFn: () =>
      apiUpdateUser(user.id, {
        name,
        role,
        ...(newPw ? { password: newPw } : {}),
      }),
    onSuccess: () => {
      toast({ title: "User updated", variant: "success" });
      onUpdated();
      onClose();
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User — @{user.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Display Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Reset Password (optional)</label>
            <Input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => update.mutate()} disabled={update.isPending || !name.trim()}>
            {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
