"use client";
import { useRef, useState } from "react";
import {
  Paperclip,
  Upload,
  Trash2,
  X,
  File,
  FileText,
  FileCode,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
  Download,
  ZoomIn,
} from "lucide-react";
import { Attachment, Role } from "@/types";
import { canEdit } from "@/lib/utils";
import { getDriveUrls, ACCEPTED_ATTACHMENT_TYPES, MAX_ATTACHMENT_SIZE } from "@/lib/api";
import { useTaskAttachments, useAttachmentMutations } from "@/hooks/useBoard";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface AttachmentSectionProps {
  taskId: string;
  myRole: Role;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFileCategory(mimeType: string): "image" | "pdf" | "text" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/sql" ||
    mimeType === "application/x-sql"
  )
    return "text";
  return "other";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Color accent per file type — consistent with palette
const CATEGORY_ACCENT: Record<string, string> = {
  image:  "hsl(var(--secondary))",          // steel blue for images
  pdf:    "hsl(0 78% 58%)",                  // red for PDF
  text:   "hsl(var(--primary))",             // amber for text/code
  other:  "hsl(var(--muted-foreground))",
};

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  const category = getFileCategory(mimeType);
  if (category === "image") return <ImageIcon className={className} />;
  if (category === "pdf")   return <FileText  className={className} />;
  if (category === "text")  return <FileCode  className={className} />;
  return <File className={className} />;
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────

function PreviewModal({
  attachment,
  onClose,
}: {
  attachment: Attachment;
  onClose: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const urls     = getDriveUrls(attachment.fileId);
  const category = getFileCategory(attachment.mimeType);
  const accent   = CATEGORY_ACCENT[category];

  // Close on Escape key
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    // Outer container — captures focus for keyboard
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onKeyDown={handleKey}
      tabIndex={-1}
    >
      {/* ── Backdrop — transparent clickable area ── */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* ── Modal panel — 20% wider + taller ── */}
      <motion.div
        className="relative z-10 flex flex-col w-full max-w-[1075px] rounded-2xl bg-card border-2 border-border overflow-hidden"
        style={{
          maxHeight: "95vh",
          boxShadow: `5px 5px 0px 0px ${accent}50`,
        }}
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.94,  y: 12 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Accent bar (file-type color) ── */}
        <div className="h-1.5 shrink-0" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}80)` }} />

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-card shrink-0">
          {/* File-type icon badge */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2"
            style={{
              borderColor: `${accent}50`,
              backgroundColor: `${accent}18`,
              color: accent,
            }}
          >
            <FileIcon mimeType={attachment.mimeType} className="h-5 w-5" />
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">{attachment.fileName}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {category} · {formatBytes(attachment.fileSize)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={urls.download}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border-2 border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/8 shadow-toon-sm transition-[color,border-color,background-color]"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              aria-label="Close preview"
              className="rounded-xl border-2 border-border p-2 text-muted-foreground hover:border-destructive/50 hover:text-destructive hover:bg-destructive/8 shadow-toon-sm transition-[color,border-color,background-color]"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* ── Content area ── */}
        <div className="flex-1 overflow-hidden bg-muted/20 min-h-0">
          {category === "image" && !imgError ? (
            <motion.div
              className="flex h-full w-full items-center justify-center p-6"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urls.image}
                alt={attachment.fileName}
                className="max-h-full max-w-full object-contain rounded-xl"
                style={{ boxShadow: `0 8px 32px hsl(var(--toon-shadow-base) / 0.4)` }}
                onError={() => setImgError(true)}
              />
            </motion.div>
          ) : (
            <iframe
              src={urls.preview}
              className="w-full h-full"
              style={{ minHeight: "600px" }}
              title={attachment.fileName}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Attachment Card ───────────────────────────────────────────────────────────

function AttachmentCard({
  attachment,
  editable,
  onPreview,
  onDelete,
  deleting,
}: {
  attachment: Attachment;
  editable: boolean;
  onPreview: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const urls     = getDriveUrls(attachment.fileId);
  const category = getFileCategory(attachment.mimeType);
  const accent   = CATEGORY_ACCENT[category];

  return (
    <motion.div
      className="group relative flex items-center gap-3 rounded-xl border-2 border-border bg-card px-3 py-2.5 cursor-pointer"
      whileHover={{ y: -2, boxShadow: `3px 3px 0px 0px ${accent}40` }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={onPreview}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPreview(); } }}
      aria-label={`Preview ${attachment.fileName}`}
    >
      {/* Thumbnail / Icon */}
      <div
        className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border-2 overflow-hidden"
        style={{ borderColor: `${accent}40`, backgroundColor: `${accent}12` }}
        onClick={(e) => { e.stopPropagation(); onPreview(); }}
      >
        {category === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urls.thumbnail}
            alt={attachment.fileName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <FileIcon mimeType={attachment.mimeType} className="h-5 w-5" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">{attachment.fileName}</p>
        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{category} · {formatBytes(attachment.fileSize)}</p>
      </div>

      {/* Hover hint */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Actions — always show, separated */}
      <div
        className="flex items-center gap-1 shrink-0 ml-1"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={urls.download}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          title="Download"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {editable && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={deleting}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
            title="Hapus lampiran"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AttachmentSection({ taskId, myRole }: AttachmentSectionProps) {
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const [previewing, setPreviewing]   = useState<Attachment | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null);

  const { data: attachments = [], isLoading } = useTaskAttachments(taskId);
  const { upload, remove } = useAttachmentMutations(taskId);
  const editable = canEdit(myRole);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = "";

    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        toast({ title: `${file.name}: terlalu besar (maks 4MB)`, variant: "destructive" });
        continue;
      }
      try {
        await upload.mutateAsync(file);
        toast({ title: `${file.name} berhasil diupload` });
      } catch (err) {
        toast({
          title: `Gagal upload ${file.name}`,
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
      }
    }
  }

  async function handleDelete(attachment: Attachment) {
    setDeleteTarget(attachment);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const attachment = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(attachment.id);
    try {
      await remove.mutateAsync(attachment.id);
    } catch {
      toast({ title: "Gagal menghapus lampiran", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="space-y-3">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Paperclip className="h-4 w-4" />
            <span>Lampiran</span>
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.span
                  key="count"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-bold text-primary"
                >
                  {attachments.length}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {editable && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 text-xs rounded-lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={upload.isPending}
            >
              {upload.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Upload
            </Button>
          )}
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat lampiran…
          </div>
        ) : attachments.length === 0 ? (
          editable ? (
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ borderColor: "hsl(var(--primary) / 0.5)", y: -1 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="w-full rounded-2xl border-2 border-dashed border-border py-8 text-sm text-muted-foreground transition-colors"
            >
              <Upload className="mx-auto mb-2 h-6 w-6 opacity-40" />
              <p className="font-medium">Klik untuk upload lampiran</p>
              <p className="text-xs mt-1 opacity-60">Gambar, PDF, Office, .txt, .md, .sql — maks 4MB</p>
            </motion.button>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">Tidak ada lampiran</p>
          )
        ) : (
          <motion.div
            className="space-y-2"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {attachments.map((att) => (
              <motion.div
                key={att.id}
                variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <AttachmentCard
                  attachment={att}
                  editable={editable}
                  onPreview={() => setPreviewing(att)}
                  onDelete={() => handleDelete(att)}
                  deleting={deletingId === att.id}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_ATTACHMENT_TYPES}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Preview modal with AnimatePresence for enter/exit */}
      <AnimatePresence>
        {previewing && (
          <PreviewModal
            key={previewing.id}
            attachment={previewing}
            onClose={() => setPreviewing(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete attachment confirmation dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Lampiran</DialogTitle>
            <DialogDescription>
              Hapus lampiran &quot;{deleteTarget?.fileName}&quot;? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={confirmDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
