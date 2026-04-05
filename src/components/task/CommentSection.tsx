"use client";
import { useState } from "react";
import { MessageCircle, Reply, Trash2, Pencil, Loader2, CornerDownRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Comment, Role } from "@/types";
import { getStoredUser } from "@/lib/auth";
import { canEdit } from "@/lib/utils";
import { useTaskComments, useCommentMutations } from "@/hooks/useBoard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CommentSectionProps {
  taskId: string;
  myRole: Role;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function buildTree(flat: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];
  flat.forEach((c) => map.set(c.id, { ...c, replies: [] }));
  map.forEach((c) => {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies!.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

// ─── Compose Box ──────────────────────────────────────────────────────────────

function ComposeBox({
  placeholder,
  autoFocus,
  onSubmit,
  onCancel,
  initialValue = "",
  submitLabel = "Kirim",
}: {
  placeholder: string;
  autoFocus?: boolean;
  onSubmit: (text: string) => Promise<void>;
  onCancel?: () => void;
  initialValue?: string;
  submitLabel?: string;
}) {
  const [text, setText] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setText("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        autoFocus={autoFocus}
        rows={2}
        className="w-full rounded-xl border-2 border-border bg-muted/30 px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus:border-primary/50 focus:bg-card transition-[border-color,background-color]"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
          if (e.key === "Escape" && onCancel) onCancel();
        }}
        maxLength={1000}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{text.length}/1000 · Ctrl+Enter kirim</span>
        <div className="flex gap-2">
          {onCancel && (
            <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg" onClick={onCancel}>
              Batal
            </Button>
          )}
          <Button
            size="sm"
            className="h-7 text-xs rounded-lg"
            disabled={!text.trim() || submitting}
            onClick={handleSubmit}
          >
            {submitting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Single Comment ────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  depth,
  myUserId,
  myRole,
  onCreate,
  onUpdate,
  onDelete,
}: {
  comment: Comment;
  depth: number;
  myUserId: string;
  myRole: Role;
  onCreate: (content: string, parentId?: string) => Promise<void>;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const isOwn = comment.userId === myUserId;
  const canDelete = isOwn || myRole === "owner" || myRole === "approver";
  const canReply = canEdit(myRole) && depth < 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <div className="flex gap-2.5">
        {/* Avatar */}
        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
          <AvatarFallback
            className="text-[9px] font-bold"
            style={{ backgroundColor: comment.avatarColor + "33", color: comment.avatarColor }}
          >
            {comment.userName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-semibold leading-none">{comment.userName}</span>
            <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>

          {/* Content or edit form */}
          {editing ? (
            <div className="mt-1.5">
              <ComposeBox
                placeholder="Edit komentar…"
                autoFocus
                initialValue={comment.content}
                submitLabel="Simpan"
                onSubmit={async (text) => {
                  await onUpdate(comment.id, text);
                  setEditing(false);
                }}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : (
            <p className="mt-0.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )}

          {/* Action row */}
          {!editing && (
            <div className="mt-1 flex items-center gap-3">
              {canReply && (
                <button
                  onClick={() => setReplying((v) => !v)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                >
                  <Reply className="h-3 w-3" />
                  Balas
                </button>
              )}
              {isOwn && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Hapus
                </button>
              )}
            </div>
          )}

          {/* Reply compose */}
          <AnimatePresence>
            {replying && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden mt-2"
              >
                <ComposeBox
                  placeholder={`Balas ke ${comment.userName}…`}
                  autoFocus
                  submitLabel="Balas"
                  onSubmit={async (text) => {
                    await onCreate(text, comment.id);
                    setReplying(false);
                  }}
                  onCancel={() => setReplying(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-3 pl-3 border-l-2 border-border/50">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  myUserId={myUserId}
                  myRole={myRole}
                  onCreate={onCreate}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CommentSection({ taskId, myRole }: CommentSectionProps) {
  const currentUser = getStoredUser();
  const myUserId = currentUser?.id ?? "";

  const { data: flat = [], isLoading } = useTaskComments(taskId);
  const { create, update, remove } = useCommentMutations(taskId);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const tree = buildTree(flat);

  async function handleCreate(content: string, parentId?: string) {
    try {
      await create.mutateAsync({ content, parentId });
    } catch (err) {
      toast({
        title: "Gagal mengirim komentar",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
      throw err;
    }
  }

  async function handleUpdate(commentId: string, content: string) {
    try {
      await update.mutateAsync({ commentId, content });
    } catch (err) {
      toast({ title: "Gagal menyimpan perubahan", variant: "destructive" });
      throw err;
    }
  }

  async function handleDelete(commentId: string) {
    setDeleteCommentId(commentId);
  }

  async function confirmDeleteComment() {
    if (!deleteCommentId) return;
    try {
      await remove.mutateAsync(deleteCommentId);
      setDeleteCommentId(null);
    } catch {
      toast({ title: "Gagal menghapus komentar", variant: "destructive" });
    }
  }

  return (
    <>
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MessageCircle className="h-4 w-4" />
        <span>Komentar</span>
        {flat.length > 0 && (
          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-bold text-primary">
            {flat.length}
          </span>
        )}
      </div>

      {/* Compose new comment */}
      {canEdit(myRole) && (
        <div className="flex gap-2.5">
          <Avatar className="h-7 w-7 shrink-0 mt-0.5">
            <AvatarFallback
              className="text-[9px] font-bold"
              style={{
                backgroundColor: (currentUser?.avatarColor ?? "#888") + "33",
                color: currentUser?.avatarColor ?? "#888",
              }}
            >
              {(currentUser?.name ?? "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <ComposeBox
              placeholder="Tulis komentar…"
              onSubmit={(text) => handleCreate(text)}
            />
          </div>
        </div>
      )}

      {/* Comment list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat komentar…
        </div>
      ) : tree.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 py-6 text-muted-foreground/50">
          <CornerDownRight className="h-5 w-5" />
          <p className="text-xs">Belum ada komentar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tree.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              depth={0}
              myUserId={myUserId}
              myRole={myRole}
              onCreate={handleCreate}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>

    {/* Delete comment confirmation dialog */}
    <Dialog open={deleteCommentId !== null} onOpenChange={(open) => { if (!open && !remove.isPending) setDeleteCommentId(null); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus Komentar</DialogTitle>
          <DialogDescription>
            Hapus komentar ini beserta balasannya? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteCommentId(null)} disabled={remove.isPending}>Batal</Button>
          <Button variant="destructive" onClick={confirmDeleteComment} disabled={remove.isPending}>
            {remove.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
