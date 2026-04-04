"use client";
import { X, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Task, Role } from "@/types";
import { CommentSection } from "./CommentSection";

interface CommentModalProps {
  task: Task;
  myRole: Role;
  onClose: () => void;
}

export function CommentModal({ task, myRole, onClose }: CommentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Panel — full-width sheet on mobile, centered card on desktop */}
      <motion.div
        className="relative z-10 flex flex-col w-full md:max-w-xl bg-card border-2 border-border rounded-t-2xl md:rounded-2xl overflow-hidden"
        style={{
          maxHeight: "85vh",
          boxShadow: "0 -4px 32px hsl(var(--toon-shadow-base) / 0.4)",
        }}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile visual only) */}
        <div className="md:hidden flex justify-center pt-2 pb-0.5">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground">Komentar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup komentar"
            className="rounded-xl border-2 border-border p-1.5 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 kanban-scroll">
          <CommentSection taskId={task.id} myRole={myRole} />
        </div>
      </motion.div>
    </div>
  );
}
