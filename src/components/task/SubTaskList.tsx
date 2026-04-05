"use client";
import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { SubTask, Role } from "@/types";
import { canEdit } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface SubTaskListProps {
  subTasks: SubTask[];
  taskId: string;
  myRole: Role;
  onCreate: (title: string) => Promise<void>;
  onToggle: (subTaskId: string, isCompleted: boolean) => Promise<void> | void;
  onDelete: (subTaskId: string) => Promise<void> | void;
}

export function SubTaskList({
  subTasks,
  taskId,
  myRole,
  onCreate,
  onToggle,
  onDelete,
}: SubTaskListProps) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sorted = [...subTasks].sort((a, b) => a.position - b.position);
  const completed = sorted.filter((s) => s.isCompleted).length;
  const progress = sorted.length > 0 ? (completed / sorted.length) * 100 : 0;

  async function handleAdd() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onCreate(title.trim());
      setTitle("");
      setAdding(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      {sorted.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Checklist</span>
            <span>{completed}/{sorted.length}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Sub-task items */}
      <div className="space-y-1">
        {sorted.map((st) => {
          const isToggling = togglingId === st.id;
          const isDeleting = deletingId === st.id;
          return (
            <div key={st.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors">
              {isToggling
                ? <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                : (
                  <Checkbox
                    id={`st-${st.id}`}
                    checked={st.isCompleted}
                    onCheckedChange={async (checked) => {
                      if (togglingId) return;
                      setTogglingId(st.id);
                      try { await onToggle(st.id, checked as boolean); }
                      finally { setTogglingId(null); }
                    }}
                    disabled={!canEdit(myRole) || !!togglingId}
                  />
                )}
              <label
                htmlFor={`st-${st.id}`}
                className={`flex-1 text-sm cursor-pointer ${st.isCompleted ? "line-through text-muted-foreground" : ""}`}
              >
                {st.title}
              </label>
              {canEdit(myRole) && (
                <button
                  onClick={async () => {
                    if (deletingId) return;
                    setDeletingId(st.id);
                    try { await onDelete(st.id); }
                    finally { setDeletingId(null); }
                  }}
                  disabled={!!deletingId}
                  aria-label={`Delete subtask: ${st.title}`}
                  className="h-8 w-8 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-destructive disabled:opacity-30"
                >
                  {isDeleting
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add sub-task */}
      {canEdit(myRole) && (
        adding ? (
          <div className="space-y-2 px-2">
            <input
              autoFocus
              className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              placeholder="Sub-task title…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") { setAdding(false); setTitle(""); }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!title.trim() || loading}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                Add
              </button>
              <button
                onClick={() => { setAdding(false); setTitle(""); }}
                aria-label="Cancel adding subtask"
                className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add item
          </button>
        )
      )}
    </div>
  );
}
