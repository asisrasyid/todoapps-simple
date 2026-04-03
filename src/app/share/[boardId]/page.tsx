"use client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Loader2, AlertCircle, Calendar, User } from "lucide-react";
import { apiGetPublicBoard } from "@/lib/api";
import { cn } from "@/lib/utils";

const PRIORITY_COLOR: Record<string, string> = {
  low: "text-slate-400 bg-slate-400/10",
  medium: "text-blue-400 bg-blue-400/10",
  high: "text-amber-400 bg-amber-400/10",
  urgent: "text-red-400 bg-red-400/10",
};

interface PageProps {
  params: Promise<{ boardId: string }>;
}

export default function SharePage({ params }: PageProps) {
  const { boardId } = use(params);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-board", boardId],
    queryFn: () => apiGetPublicBoard(boardId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <AlertCircle className="h-10 w-10 opacity-40" />
        <p className="text-sm">Board not found or no longer available.</p>
      </div>
    );
  }

  const { board, columns, tasks } = data;
  const sortedCols = [...columns].sort((a, b) => a.position - b.position);

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20">
            <CheckSquare className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-sm text-foreground tracking-tight">SheetMaster</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-sm truncate max-w-[200px]">{board.name}</span>
        </div>
        <span className="text-xs text-muted-foreground rounded-full border border-border px-2.5 py-1">
          Read-only view
        </span>
      </header>

      {/* Board description */}
      {board.description && (
        <div className="shrink-0 border-b border-border bg-card/50 px-4 md:px-6 py-2">
          <p className="text-xs text-muted-foreground">{board.description}</p>
        </div>
      )}

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-3 p-4 md:p-6 w-max min-w-full">
          {sortedCols.map((col) => {
            const colTasks = tasks
              .filter((t) => t.columnId === col.id)
              .sort((a, b) => a.position - b.position);

            return (
              <div key={col.id} className="flex h-full w-72 shrink-0 flex-col rounded-xl border border-border bg-card overflow-hidden">
                {/* Column header */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-medium flex-1 truncate">{col.name}</span>
                  <span className="text-xs text-muted-foreground">{colTasks.length}</span>
                </div>

                {/* Tasks */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 kanban-scroll">
                  {colTasks.length === 0 ? (
                    <div className="flex h-20 items-center justify-center">
                      <p className="text-xs text-muted-foreground/50">No tasks</p>
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div key={task.id} className="rounded-lg border border-border bg-background p-3 space-y-2">
                        <p className="text-sm font-medium leading-snug">{task.title}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("text-xs font-semibold rounded px-1.5 py-0.5 capitalize", PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium)}>
                            {task.priority}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {task.deadline && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.deadline).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                              </div>
                            )}
                            {task.assignees.length > 0 && (
                              <div className="flex -space-x-1">
                                {task.assignees.slice(0, 3).map((a) => (
                                  <div
                                    key={a.id}
                                    className="h-5 w-5 rounded-full border-2 border-card flex items-center justify-center text-[8px] font-bold"
                                    style={{ backgroundColor: a.avatarColor + "33", color: a.avatarColor }}
                                    title={a.name}
                                  >
                                    {a.name.slice(0, 1).toUpperCase()}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
