"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle, XCircle, Clock, Loader2, ChevronRight, Pencil } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApprovals, useApproveTask, useRejectTask } from "@/hooks/useApprovals";
import { Approval } from "@/types";
import { toast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/utils";
import { usePageTour } from "@/hooks/usePageTour";
import { approvalsTourSteps, TOUR_APPROVALS_KEY } from "@/lib/tour";

export default function ApprovalsPage() {
  const { data: approvals, isLoading } = useApprovals();
  const approveTask = useApproveTask();
  const rejectTask = useRejectTask();

  const [rejectModal, setRejectModal] = useState<Approval | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  async function handleApprove(approval: Approval) {
    try {
      await approveTask.mutateAsync(approval.id);
      const desc = approval.type === "edit"
        ? `Perubahan pada "${approval.taskTitle}" telah diterapkan.`
        : `"${approval.taskTitle}" dipindah ke ${approval.toColumnName}.`;
      toast({ title: "Approved", description: desc, variant: "success" });
    } catch (err: unknown) {
      toast({ title: "Failed to approve", variant: "destructive" });
    }
  }

  async function handleReject() {
    if (!rejectModal) return;
    try {
      await rejectTask.mutateAsync({ approvalId: rejectModal.id, note: rejectNote });
      toast({ title: "Task rejected", description: rejectNote || undefined });
      setRejectModal(null);
      setRejectNote("");
    } catch {
      toast({ title: "Failed to reject", variant: "destructive" });
    }
  }

  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  usePageTour(approvalsTourSteps, TOUR_APPROVALS_KEY);
  const pending = approvals?.filter((a) => a.status === "pending") ?? [];
  const filtered = filter === "pending" ? pending : (approvals ?? []);
  const displayed = [...filtered].sort((a, b) => {
    const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return sort === "newest" ? diff : -diff;
  });

  const filterActions = (
    <div data-tour="approval-filter" className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {(["pending", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-2.5 py-1 rounded-md transition-colors ${filter === f ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
          >
            {f === "pending" ? `Pending${pending.length > 0 ? ` (${pending.length})` : ""}` : "Semua"}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 border-l border-border pl-2">
        {(["newest", "oldest"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`text-xs px-2.5 py-1 rounded-md transition-colors ${sort === s ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
          >
            {s === "newest" ? "Terbaru" : "Terlama"}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Topbar title="Approvals" actions={filterActions} />
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Semua bersih!</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Tidak ada permintaan approval yang menunggu. Semua task sudah diproses.
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            className="space-y-3 max-w-2xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          >
            <p className="text-sm text-muted-foreground mb-4">
              {displayed.length} approval{displayed.length !== 1 ? "s" : ""}
            </p>
            {displayed.map((approval, idx) => (
              <motion.div
                key={approval.id}
                data-tour={idx === 0 ? "approval-card" : undefined}
                variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <ApprovalCard
                  approval={approval}
                  onApprove={() => handleApprove(approval)}
                  onReject={() => setRejectModal(approval)}
                  approving={approveTask.isPending}
                  isOwnRequest={approval.isOwnRequest}
                  canApprove={approval.canApprove}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Reject modal */}
      <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rejectModal?.type === "edit" ? "Tolak Perubahan Task" : "Tolak Perpindahan Task"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {rejectModal && (
              <p className="text-sm text-muted-foreground">
                {rejectModal.type === "edit" ? (
                  <>Menolak perubahan pada <span className="font-medium text-foreground">"{rejectModal.taskTitle}"</span>. Perubahan tidak akan diterapkan.</>
                ) : (
                  <>Menolak perpindahan <span className="font-medium text-foreground">"{rejectModal.taskTitle}"</span> ke <span className="font-medium text-foreground">{rejectModal.toColumnName}</span>.</>
                )}
              </p>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Alasan (opsional)</label>
              <Textarea
                placeholder="Jelaskan alasan penolakan…"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectTask.isPending}>
              {rejectTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const FIELD_LABELS: Record<string, string> = {
  title: "Judul",
  description: "Deskripsi",
  priority: "Prioritas",
  deadline: "Deadline",
};

function ApprovalCard({
  approval,
  onApprove,
  onReject,
  approving,
  isOwnRequest,
  canApprove,
}: {
  approval: Approval;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  isOwnRequest?: boolean;
  canApprove?: boolean;
}) {
  const isEdit = approval.type === "edit";

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-3 shadow-toon hover:shadow-toon-primary transition-shadow duration-150">
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isEdit ? "bg-sky-500/15" : "bg-amber-500/15"}`}>
          {isEdit
            ? <Pencil className="h-4 w-4 text-sky-400" />
            : <Clock className="h-4 w-4 text-amber-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium truncate">{approval.taskTitle}</p>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isEdit ? "bg-sky-500/15 text-sky-400" : "bg-amber-500/15 text-amber-400"}`}>
              {isEdit ? "Edit" : "Pindah Kolom"}
            </span>
            {isOwnRequest && (
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-violet-500/15 text-violet-400">
                Request Anda
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {approval.boardName} · Diminta oleh {approval.requestedByName} · {formatDate(approval.createdAt)}
          </p>
        </div>
      </div>

      {/* Content: edit diff or move path */}
      {isEdit && approval.pendingUpdates ? (
        <div className="rounded-lg bg-muted/40 px-3 py-2 space-y-1.5">
          {Object.entries(approval.pendingUpdates).map(([field, value]) => (
            <div key={field} className="flex items-start gap-2 text-xs">
              <span className="shrink-0 text-muted-foreground w-20">{FIELD_LABELS[field] ?? field}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
              <span className="font-medium text-sky-400 break-all">
                {field === "deadline" ? (value ? formatDate(String(value)) : "Dihapus") : String(value)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">{approval.fromColumnName}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          <span className="font-medium text-amber-400">{approval.toColumnName}</span>
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
        </div>
      )}

      {/* Actions — only shown to owner/approver */}
      {canApprove && (
        <div className="flex gap-2 justify-end">
          <Button data-tour="reject-btn" size="sm" variant="outline" onClick={onReject} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
            <XCircle className="h-4 w-4" />
            Tolak
          </Button>
          <Button data-tour="approve-btn" size="sm" onClick={onApprove} disabled={approving} className="gap-1.5">
            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Approve
          </Button>
        </div>
      )}
      {isOwnRequest && !canApprove && (
        <div className="flex justify-end">
          <span className="text-xs text-muted-foreground italic">Menunggu persetujuan approver…</span>
        </div>
      )}
    </div>
  );
}
