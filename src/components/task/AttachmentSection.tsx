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
} from "lucide-react";
import { Attachment, Role } from "@/types";
import { canEdit } from "@/lib/utils";
import { getDriveUrls, ACCEPTED_ATTACHMENT_TYPES, MAX_ATTACHMENT_SIZE } from "@/lib/api";
import { useTaskAttachments, useAttachmentMutations } from "@/hooks/useBoard";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

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

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  const category = getFileCategory(mimeType);
  if (category === "image") return <ImageIcon className={className} />;
  if (category === "pdf") return <FileText className={className} />;
  if (category === "text") return <FileCode className={className} />;
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
  const urls = getDriveUrls(attachment.fileId);
  const category = getFileCategory(attachment.mimeType);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative z-10 flex flex-col w-full max-w-4xl max-h-[90vh] mx-4 rounded-xl bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <FileIcon mimeType={attachment.mimeType} className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1 text-sm font-medium truncate">{attachment.fileName}</span>
          <a
            href={urls.download}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Download
          </a>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-black/20">
          {category === "image" ? (
            <div className="flex h-full items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urls.image}
                alt={attachment.fileName}
                className="max-h-full max-w-full object-contain rounded"
              />
            </div>
          ) : (
            <iframe
              src={urls.preview}
              className="w-full h-full min-h-[60vh]"
              title={attachment.fileName}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          )}
        </div>
      </div>
    </div>
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
  const urls = getDriveUrls(attachment.fileId);
  const category = getFileCategory(attachment.mimeType);

  return (
    <div className="group relative flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 hover:bg-accent/50 transition-colors">
      {/* Thumbnail / Icon */}
      <button
        onClick={onPreview}
        className="shrink-0 flex items-center justify-center w-10 h-10 rounded-md overflow-hidden bg-background border border-border"
        title="Preview"
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
          <FileIcon mimeType={attachment.mimeType} className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Info */}
      <button onClick={onPreview} className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium truncate leading-tight">{attachment.fileName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(attachment.fileSize)}</p>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <a
          href={urls.download}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent opacity-0 group-hover:opacity-100 transition-all"
          title="Download"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {editable && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
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
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AttachmentSection({ taskId, myRole }: AttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewing, setPreviewing] = useState<Attachment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    if (!confirm(`Hapus lampiran "${attachment.fileName}"?`)) return;
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Paperclip className="h-4 w-4" />
            <span>Lampiran</span>
            {attachments.length > 0 && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold text-foreground">
                {attachments.length}
              </span>
            )}
          </div>
          {editable && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 text-xs"
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

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat lampiran…
          </div>
        ) : attachments.length === 0 ? (
          editable ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-lg border border-dashed border-border py-6 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary/70 transition-colors"
            >
              <Upload className="mx-auto mb-1.5 h-5 w-5 opacity-50" />
              Klik untuk upload lampiran
              <span className="block text-xs mt-1 opacity-60">
                Gambar, PDF, Office, .txt, .md, .sql — maks 4MB
              </span>
            </button>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">Tidak ada lampiran</p>
          )
        ) : (
          <div className="space-y-2">
            {attachments.map((att) => (
              <AttachmentCard
                key={att.id}
                attachment={att}
                editable={editable}
                onPreview={() => setPreviewing(att)}
                onDelete={() => handleDelete(att)}
                deleting={deletingId === att.id}
              />
            ))}
          </div>
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

      {previewing && (
        <PreviewModal attachment={previewing} onClose={() => setPreviewing(null)} />
      )}
    </>
  );
}
