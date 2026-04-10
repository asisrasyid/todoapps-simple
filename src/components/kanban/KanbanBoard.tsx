"use client";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { BoardData, Task, Column, Role } from "@/types";
import { canManageColumns, canEdit, canApprove, COLUMN_COLORS, cn } from "@/lib/utils";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "@/components/task/TaskModal";
import { CommentModal } from "@/components/task/CommentModal";
import { ApprovalRequestModal } from "@/components/approval/ApprovalRequestModal";
import { toast } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useCreateTask,
  useMoveTask,
  useCreateColumn,
  useUpdateColumn,
  useDeleteColumn,
  useReorderColumns,
} from "@/hooks/useBoard";
import { useBoardStore } from "@/store/boardStore";
import { apiMoveTask } from "@/lib/api";
import { useTour } from "@/components/tour/TourProvider";
import { TOUR_BOARD_KEY, isTourDone } from "@/lib/tour";

interface KanbanBoardProps {
  boardData: BoardData;
  myRole: Role;
}

export function KanbanBoard({ boardData, myRole }: KanbanBoardProps) {
  const { board, columns, tasks, members, labels } = boardData;
  const setBoardData = useBoardStore((s) => s.setBoardData);
  const moveTaskOptimistic = useBoardStore((s) => s.moveTaskOptimistic);
  const reorderColumnsFn = useBoardStore((s) => s.reorderColumns);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const createTask = useCreateTask(board.id);
  const moveTask = useMoveTask(board.id);
  const createColumn = useCreateColumn(board.id);
  const updateColumn = useUpdateColumn(board.id);
  const deleteColumn = useDeleteColumn(board.id);
  const reorderColumns = useReorderColumns(board.id);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeColIndex, setActiveColIndex] = useState(0);

  // Deep link: open task from URL ?task={taskId}
  const allTasks = tasks;
  const taskIdFromUrl = searchParams.get("task");
  const selectedTask = useMemo(
    () => (taskIdFromUrl ? allTasks.find((t) => t.id === taskIdFromUrl) ?? null : null),
    [taskIdFromUrl, allTasks]
  );

  function openTask(task: Task) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("task", task.id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function closeTask() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("task");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
  const boardScrollRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [commentTask, setCommentTask] = useState<Task | null>(null);
  const { startBoardTour } = useTour();

  // Auto-start board tour on first visit
  useEffect(() => {
    if (isTourDone(TOUR_BOARD_KEY)) return;
    const t = setTimeout(() => startBoardTour(), 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [approvalPending, setApprovalPending] = useState<{
    task: Task;
    toColumn: Column;
  } | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [addingCol, setAddingCol] = useState(false);
  const [deleteColumnTarget, setDeleteColumnTarget] = useState<{ id: string; taskCount: number } | null>(null);
  const [deletingColumn, setDeletingColumn] = useState(false);

  const reorderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalTaskRef = useRef<Task | null>(null);

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function getTasksForColumn(colId: string) {
    return tasks
      .filter((t) => t.columnId === colId)
      .sort((a, b) => a.position - b.position);
  }

  function onDragStart({ active }: DragStartEvent) {
    const data = active.data.current;
    if (data?.type === "task") {
      setActiveTask(data.task);
      originalTaskRef.current = data.task;
    }
    if (data?.type === "column") setActiveColumn(data.column);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || !activeTask) return;
    const overData = over.data.current;
    const toColId =
      overData?.type === "column"
        ? over.id as string
        : overData?.type === "task"
        ? overData.task.columnId
        : null;

    if (!toColId || toColId === activeTask.columnId) return;
    moveTaskOptimistic(activeTask.id, toColId, 0);
    setActiveTask((prev) => prev ? { ...prev, columnId: toColId } : prev);
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    setActiveColumn(null);
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Column reorder
    if (activeData?.type === "column") {
      const activeColId = (active.id as string).replace("col:", "");
      const overColId = (over.id as string).replace("col:", "");
      if (activeColId === overColId) return;

      const oldIndex = sortedColumns.findIndex((c) => c.id === activeColId);
      const newIndex = sortedColumns.findIndex((c) => c.id === overColId);
      const newOrder = arrayMove(sortedColumns, oldIndex, newIndex).map((c) => c.id);
      reorderColumnsFn(newOrder);

      if (reorderTimer.current) clearTimeout(reorderTimer.current);
      reorderTimer.current = setTimeout(() => {
        reorderColumns.mutate(newOrder);
      }, 500);
      return;
    }

    // Task move
    if (activeData?.type === "task") {
      const task = activeData.task as Task;
      // Use ref to get original column — activeData.task.columnId may already be stale
      // after optimistic updates during onDragOver re-renders
      const originalTask = originalTaskRef.current ?? task;
      originalTaskRef.current = null;

      const toColId =
        overData?.type === "column"
          ? (over.id as string)
          : overData?.type === "task"
          ? overData.task.columnId
          : null;

      if (!toColId) return;
      const toCol = columns.find((c) => c.id === toColId);
      if (!toCol) return;

      // Check if approval needed — compare against original column, not the optimistically-updated one
      if (toCol.requiresApproval && myRole === "contributor" && toColId !== originalTask.columnId) {
        setApprovalPending({ task: originalTask, toColumn: toCol });
        // Revert optimistic using original column/position
        moveTaskOptimistic(originalTask.id, originalTask.columnId, originalTask.position);
        return;
      }

      const colTasks = getTasksForColumn(toColId);
      const overTaskIndex = colTasks.findIndex((t) => t.id === (over.id as string));
      const position = overTaskIndex >= 0 ? overTaskIndex : colTasks.length;

      try {
        await apiMoveTask(task.id, toColId, position);
      } catch (err: unknown) {
        moveTaskOptimistic(originalTask.id, originalTask.columnId, originalTask.position);
        toast({ title: "Failed to move task", variant: "destructive" });
      }
    }
  }

  async function handleAddTask(columnId: string, title: string) {
    try {
      await createTask.mutateAsync({ columnId, title });
    } catch (err: unknown) {
      toast({ title: "Failed to create task", variant: "destructive" });
    }
  }

  async function handleRenameColumn(columnId: string, name: string) {
    const col = columns.find((c) => c.id === columnId);
    if (!col) return;
    try {
      await updateColumn.mutateAsync({ columnId, name, color: col.color, requiresApproval: col.requiresApproval });
    } catch {
      toast({ title: "Failed to rename column", variant: "destructive" });
    }
  }

  async function handleDeleteColumn(columnId: string) {
    const colTasks = getTasksForColumn(columnId);
    if (colTasks.length > 0) {
      setDeleteColumnTarget({ id: columnId, taskCount: colTasks.length });
      return;
    }
    await executeDeleteColumn(columnId);
  }

  async function executeDeleteColumn(columnId: string) {
    setDeletingColumn(true);
    try {
      await deleteColumn.mutateAsync(columnId);
      setDeleteColumnTarget(null);
    } catch {
      toast({ title: "Failed to delete column", variant: "destructive" });
    } finally {
      setDeletingColumn(false);
    }
  }

  async function handleToggleApproval(columnId: string) {
    const col = columns.find((c) => c.id === columnId);
    if (!col) return;
    try {
      await updateColumn.mutateAsync({
        columnId,
        name: col.name,
        color: col.color,
        requiresApproval: !col.requiresApproval,
      });
    } catch {
      toast({ title: "Failed to update column", variant: "destructive" });
    }
  }

  async function handleColorChange(columnId: string, color: string) {
    const col = columns.find((c) => c.id === columnId);
    if (!col) return;
    try {
      await updateColumn.mutateAsync({ columnId, name: col.name, color, requiresApproval: col.requiresApproval });
    } catch {
      toast({ title: "Failed to update color", variant: "destructive" });
    }
  }

  async function handleAddColumn() {
    if (!newColName.trim()) return;
    setAddingCol(true);
    try {
      await createColumn.mutateAsync({
        name: newColName.trim(),
        color: COLUMN_COLORS[columns.length % COLUMN_COLORS.length],
      });
      setNewColName("");
      setAddingColumn(false);
    } catch {
      toast({ title: "Failed to add column", variant: "destructive" });
    } finally {
      setAddingCol(false);
    }
  }

  function scrollToColumn(index: number) {
    const col = sortedColumns[index];
    if (!col) return;
    const el = columnRefs.current.get(col.id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    }
    setActiveColIndex(index);
  }

  // Sync active tab on scroll (mobile)
  useEffect(() => {
    const container = boardScrollRef.current;
    if (!container) return;
    function handleScroll() {
      if (!container) return;
      const containerLeft = container.getBoundingClientRect().left;
      let closestIdx = 0;
      let closestDist = Infinity;
      sortedColumns.forEach((col, i) => {
        const el = columnRefs.current.get(col.id);
        if (!el) return;
        const dist = Math.abs(el.getBoundingClientRect().left - containerLeft);
        if (dist < closestDist) { closestDist = dist; closestIdx = i; }
      });
      setActiveColIndex(closestIdx);
    }
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [sortedColumns]);

  return (
    <>
      {/* Mobile column tab bar */}
      {sortedColumns.length > 1 && (
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-b border-border bg-card shrink-0 kanban-scroll">
          {sortedColumns.map((col, i) => {
            const taskCount = getTasksForColumn(col.id).length;
            return (
              <button
                key={col.id}
                onClick={() => scrollToColumn(i)}
                className={cn(
                  "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activeColIndex === i
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: col.color }}
                />
                {col.name}
                <span className="rounded-full bg-muted px-1 text-xs font-semibold">
                  {taskCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div ref={boardScrollRef} className="flex h-full gap-3 overflow-x-auto px-6 py-4 kanban-scroll">
          <SortableContext
            items={sortedColumns.map((c) => `col:${c.id}`)}
            strategy={horizontalListSortingStrategy}
          >
            {sortedColumns.map((col, colIdx) => (
              <div
                key={col.id}
                ref={(el) => {
                  if (el) columnRefs.current.set(col.id, el);
                  else columnRefs.current.delete(col.id);
                }}
                data-tour={colIdx === 0 ? "kanban-column" : undefined}
                className="flex h-full"
              >
                <KanbanColumn
                  column={col}
                  tasks={getTasksForColumn(col.id)}
                  myRole={myRole}
                  onTaskClick={(task) => openTask(task)}
                  onCommentClick={(task) => setCommentTask(task)}
                  onAddTask={handleAddTask}
                  onRenameColumn={handleRenameColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onToggleApproval={handleToggleApproval}
                  onColorChange={handleColorChange}
                />
              </div>
            ))}
          </SortableContext>

          {/* Add Column */}
          {canManageColumns(myRole) && (
            <div className="w-72 shrink-0">
              {addingColumn ? (
                <div className="rounded-xl border border-border bg-card/50 p-3 space-y-2">
                  <input
                    autoFocus
                    className="w-full bg-transparent text-sm font-medium outline-none border-b border-primary pb-0.5 placeholder:text-muted-foreground"
                    placeholder="Column name…"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddColumn();
                      if (e.key === "Escape") { setAddingColumn(false); setNewColName(""); }
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddColumn}
                      disabled={!newColName.trim() || addingCol}
                      className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                      {addingCol && <Loader2 className="h-3 w-3 animate-spin" />}
                      Add
                    </button>
                    <button
                      onClick={() => { setAddingColumn(false); setNewColName(""); }}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  data-tour="add-column"
                  onClick={() => setAddingColumn(true)}
                  className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border/60 px-4 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add column
                </button>
              )}
            </div>
          )}
        </div>

        {typeof document !== "undefined" &&
          createPortal(
            <DragOverlay dropAnimation={{ duration: 150 }}>
              {activeTask && (
                <TaskCard
                  task={activeTask}
                  myRole={myRole}
                  isDragOverlay
                  onClick={() => {}}
                />
              )}
            </DragOverlay>,
            document.body
          )}
      </DndContext>

      {/* Mobile column position indicator */}
      {sortedColumns.length > 1 && (
        <div className="md:hidden flex items-center justify-center gap-1.5 py-2 shrink-0 border-t border-border/50">
          {sortedColumns.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToColumn(i)}
              aria-label={`Go to column ${i + 1}`}
              className={cn(
                "rounded-full transition-all",
                i === activeColIndex
                  ? "h-2 w-4 bg-primary"
                  : "h-2 w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
          <span className="ml-2 text-xs text-muted-foreground">
            {activeColIndex + 1}/{sortedColumns.length}
          </span>
        </div>
      )}

      {/* Task detail modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskModal
            key={selectedTask.id}
            task={allTasks.find((t) => t.id === selectedTask.id) || selectedTask}
            boardId={board.id}
            myRole={myRole}
            members={members}
            labels={labels}
            columnRequiresApproval={columns.find((c) => c.id === selectedTask.columnId)?.requiresApproval ?? false}
            onClose={closeTask}
          />
        )}
      </AnimatePresence>

      {/* Comment modal */}
      <AnimatePresence>
        {commentTask && (
          <CommentModal
            key={commentTask.id}
            task={commentTask}
            myRole={myRole}
            onClose={() => setCommentTask(null)}
          />
        )}
      </AnimatePresence>

      {/* Approval request modal */}
      {approvalPending && (
        <ApprovalRequestModal
          task={approvalPending.task}
          toColumn={approvalPending.toColumn}
          boardId={board.id}
          onClose={() => setApprovalPending(null)}
        />
      )}

      {/* Delete column confirmation dialog */}
      <Dialog open={deleteColumnTarget !== null} onOpenChange={(open) => { if (!open && !deletingColumn) setDeleteColumnTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Kolom</DialogTitle>
            <DialogDescription>
              Kolom ini memiliki {deleteColumnTarget?.taskCount} task. Hapus kolom beserta semua task-nya?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteColumnTarget(null)} disabled={deletingColumn}>Batal</Button>
            <Button
              variant="destructive"
              disabled={deletingColumn}
              onClick={() => deleteColumnTarget && executeDeleteColumn(deleteColumnTarget.id)}
            >
              {deletingColumn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
