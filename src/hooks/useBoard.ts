import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiGetBoard,
  apiCreateTask,
  apiUpdateTask,
  apiDeleteTask,
  apiMoveTask,
  apiCreateColumn,
  apiUpdateColumn,
  apiDeleteColumn,
  apiReorderColumns,
  apiCreateSubTask,
  apiUpdateSubTask,
  apiDeleteSubTask,
  apiCreateLabel,
  apiDeleteLabel,
  apiAddTaskLabel,
  apiRemoveTaskLabel,
  apiAddAssignee,
  apiRemoveAssignee,
  apiGetTaskAttachments,
  apiUploadAttachment,
  apiDeleteAttachment,
  apiGetTaskComments,
  apiCreateComment,
  apiUpdateComment,
  apiDeleteComment,
} from "@/lib/api";
import { BoardData, Task } from "@/types";

// ── Helper ────────────────────────────────────────────────────────────────────
/** Patch a single task inside BoardData cache without re-fetching */
function patchTask(old: BoardData | undefined, taskId: string, patch: Partial<Task>): BoardData | undefined {
  if (!old) return old;
  return { ...old, tasks: old.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) };
}

// ── P2: staleTime tuned — 60s board, no polling (mutations invalidate on settle)
export function useBoard(boardId: string) {
  return useQuery({
    queryKey: ["board", boardId],
    queryFn: () => apiGetBoard(boardId),
    staleTime: 60_000,
  });
}

// ── Create task (no optimistic — needs server-assigned ID) ───────────────────
export function useCreateTask(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, title, priority }: { columnId: string; title: string; priority?: string }) =>
      apiCreateTask(boardId, columnId, title, priority),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

// ── P01: Update task — optimistic ────────────────────────────────────────────
export function useUpdateTask(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Record<string, unknown> }) =>
      apiUpdateTask(taskId, updates),
    onMutate: async ({ taskId, updates }) => {
      await qc.cancelQueries({ queryKey: ["board", boardId] });
      const prev = qc.getQueryData<BoardData>(["board", boardId]);
      qc.setQueryData<BoardData>(["board", boardId], (old) =>
        patchTask(old, taskId, updates as Partial<Task>)
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(["board", boardId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

// ── Delete task — wait for server (destructive) ───────────────────────────────
export function useDeleteTask(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => apiDeleteTask(taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

// ── P02: Move task — optimistic ───────────────────────────────────────────────
export function useMoveTask(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, toColumnId, position }: { taskId: string; toColumnId: string; position: number }) =>
      apiMoveTask(taskId, toColumnId, position),
    onMutate: async ({ taskId, toColumnId, position }) => {
      await qc.cancelQueries({ queryKey: ["board", boardId] });
      const prev = qc.getQueryData<BoardData>(["board", boardId]);
      qc.setQueryData<BoardData>(["board", boardId], (old) =>
        patchTask(old, taskId, { columnId: toColumnId, position })
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(["board", boardId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

// ── Column mutations (no optimistic — structure changes are complex) ──────────
export function useCreateColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      apiCreateColumn(boardId, name, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

export function useUpdateColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, name, color, requiresApproval }: {
      columnId: string; name: string; color: string; requiresApproval: boolean;
    }) => apiUpdateColumn(columnId, name, color, requiresApproval),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

export function useDeleteColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (columnId: string) => apiDeleteColumn(columnId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

export function useReorderColumns(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (columnIds: string[]) => apiReorderColumns(columnIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

// ── P03: SubTask mutations — updateSubTask optimistic ────────────────────────
export function useSubTaskMutations(boardId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["board", boardId] });

  return {
    createSubTask: useMutation({
      mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
        apiCreateSubTask(taskId, title),
      onSuccess: invalidate,
    }),

    updateSubTask: useMutation({
      mutationFn: ({ subTaskId, updates }: { subTaskId: string; updates: { title?: string; isCompleted?: boolean } }) =>
        apiUpdateSubTask(subTaskId, updates),
      onMutate: async ({ subTaskId, updates }) => {
        await qc.cancelQueries({ queryKey: ["board", boardId] });
        const prev = qc.getQueryData<BoardData>(["board", boardId]);
        qc.setQueryData<BoardData>(["board", boardId], (old) => {
          if (!old) return old;
          return {
            ...old,
            tasks: old.tasks.map((t) => ({
              ...t,
              subTasks: t.subTasks?.map((st) =>
                st.id === subTaskId ? { ...st, ...updates } : st
              ),
            })),
          };
        });
        return { prev };
      },
      onError: (_, __, ctx) => {
        if (ctx?.prev) qc.setQueryData(["board", boardId], ctx.prev);
      },
      onSettled: invalidate,
    }),

    deleteSubTask: useMutation({
      mutationFn: (subTaskId: string) => apiDeleteSubTask(subTaskId),
      onSuccess: invalidate,
    }),
  };
}

// ── P05: Label mutations — add/remove optimistic ─────────────────────────────
export function useLabelMutations(boardId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["board", boardId] });

  return {
    createLabel: useMutation({
      mutationFn: ({ name, color }: { name: string; color: string }) =>
        apiCreateLabel(boardId, name, color),
      onSuccess: invalidate,
    }),

    deleteLabel: useMutation({
      mutationFn: (labelId: string) => apiDeleteLabel(labelId),
      onSuccess: invalidate,
    }),

    addTaskLabel: useMutation({
      mutationFn: ({ taskId, labelId }: { taskId: string; labelId: string }) =>
        apiAddTaskLabel(taskId, labelId),
      onMutate: async ({ taskId, labelId }) => {
        await qc.cancelQueries({ queryKey: ["board", boardId] });
        const prev = qc.getQueryData<BoardData>(["board", boardId]);
        qc.setQueryData<BoardData>(["board", boardId], (old) => {
          if (!old) return old;
          const label = old.labels.find((l) => l.id === labelId);
          if (!label) return old;
          return {
            ...old,
            tasks: old.tasks.map((t) =>
              t.id === taskId
                ? { ...t, labels: [...(t.labels ?? []), label] }
                : t
            ),
          };
        });
        return { prev };
      },
      onError: (_, __, ctx) => {
        if (ctx?.prev) qc.setQueryData(["board", boardId], ctx.prev);
      },
      onSettled: invalidate,
    }),

    removeTaskLabel: useMutation({
      mutationFn: ({ taskId, labelId }: { taskId: string; labelId: string }) =>
        apiRemoveTaskLabel(taskId, labelId),
      onMutate: async ({ taskId, labelId }) => {
        await qc.cancelQueries({ queryKey: ["board", boardId] });
        const prev = qc.getQueryData<BoardData>(["board", boardId]);
        qc.setQueryData<BoardData>(["board", boardId], (old) => {
          if (!old) return old;
          return {
            ...old,
            tasks: old.tasks.map((t) =>
              t.id === taskId
                ? { ...t, labels: t.labels?.filter((l) => l.id !== labelId) ?? [] }
                : t
            ),
          };
        });
        return { prev };
      },
      onError: (_, __, ctx) => {
        if (ctx?.prev) qc.setQueryData(["board", boardId], ctx.prev);
      },
      onSettled: invalidate,
    }),
  };
}

// ── P04: Assignee mutations — add/remove optimistic ──────────────────────────
export function useAssigneeMutations(boardId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["board", boardId] });

  return {
    addAssignee: useMutation({
      mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
        apiAddAssignee(taskId, userId),
      onMutate: async ({ taskId, userId }) => {
        await qc.cancelQueries({ queryKey: ["board", boardId] });
        const prev = qc.getQueryData<BoardData>(["board", boardId]);
        qc.setQueryData<BoardData>(["board", boardId], (old) => {
          if (!old) return old;
          const member = old.members.find((m) => m.userId === userId);
          if (!member) return old;
          return {
            ...old,
            tasks: old.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    assignees: [
                      ...(t.assignees ?? []),
                      { id: member.userId, name: member.name, avatarColor: member.avatarColor },
                    ],
                  }
                : t
            ),
          };
        });
        return { prev };
      },
      onError: (_, __, ctx) => {
        if (ctx?.prev) qc.setQueryData(["board", boardId], ctx.prev);
      },
      onSettled: invalidate,
    }),

    removeAssignee: useMutation({
      mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
        apiRemoveAssignee(taskId, userId),
      onMutate: async ({ taskId, userId }) => {
        await qc.cancelQueries({ queryKey: ["board", boardId] });
        const prev = qc.getQueryData<BoardData>(["board", boardId]);
        qc.setQueryData<BoardData>(["board", boardId], (old) => {
          if (!old) return old;
          return {
            ...old,
            tasks: old.tasks.map((t) =>
              t.id === taskId
                ? { ...t, assignees: t.assignees?.filter((a) => a.id !== userId) ?? [] }
                : t
            ),
          };
        });
        return { prev };
      },
      onError: (_, __, ctx) => {
        if (ctx?.prev) qc.setQueryData(["board", boardId], ctx.prev);
      },
      onSettled: invalidate,
    }),
  };
}

// ── Attachments ───────────────────────────────────────────────────────────────
export function useTaskAttachments(taskId: string) {
  return useQuery({
    queryKey: ["attachments", taskId],
    queryFn: () => apiGetTaskAttachments(taskId),
    staleTime: 60_000,
  });
}

export function useAttachmentMutations(taskId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["attachments", taskId] });

  return {
    upload: useMutation({
      mutationFn: (file: File) => apiUploadAttachment(taskId, file),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (attachmentId: string) => apiDeleteAttachment(attachmentId),
      onSuccess: invalidate,
    }),
  };
}

// ── Comments ──────────────────────────────────────────────────────────────────
export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => apiGetTaskComments(taskId),
    staleTime: 30_000,
  });
}

export function useCommentMutations(taskId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["comments", taskId] });

  return {
    create: useMutation({
      mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
        apiCreateComment(taskId, content, parentId),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
        apiUpdateComment(commentId, content),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (commentId: string) => apiDeleteComment(commentId),
      onSuccess: invalidate,
    }),
  };
}
