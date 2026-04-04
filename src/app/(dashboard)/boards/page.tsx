"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, Loader2, Trash2, MoreHorizontal, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBoards, useCreateBoard, useDeleteBoard } from "@/hooks/useBoards";
import { Board } from "@/types";
import { ROLE_CONFIG } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { BoardSkeleton } from "@/components/skeletons/BoardSkeleton";
import { ErrorState } from "@/components/ui/error-state";
import { usePageTour } from "@/hooks/usePageTour";
import { boardsTourSteps, TOUR_BOARDS_KEY } from "@/lib/tour";

export default function BoardsPage() {
  const router = useRouter();
  const { data: boards, isLoading, isError, refetch } = useBoards();
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  usePageTour(boardsTourSteps, TOUR_BOARDS_KEY);

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      const board = await createBoard.mutateAsync({ name: name.trim(), description });
      setShowCreate(false);
      setName("");
      setDescription("");
      router.push(`/boards/${board.id}`);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create board", variant: "destructive" });
    }
  }

  async function handleDelete(boardId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this board? All tasks will be lost.")) return;
    try {
      await deleteBoard.mutateAsync(boardId);
      toast({ title: "Board deleted", variant: "success" });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to delete", variant: "destructive" });
    }
  }

  return (
    <>
      <Topbar
        title="My Boards"
        actions={
          <Button data-tour="new-board-btn" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Board
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <BoardSkeleton />
        ) : isError ? (
          <ErrorState
            title="Gagal memuat boards"
            message="Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
            onRetry={() => refetch()}
          />
        ) : !boards?.length ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <LayoutGrid className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Belum ada board</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Board adalah ruang kerja untuk mengorganisir task Anda. Buat board pertama untuk memulai.
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Buat Board Pertama
            </Button>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {boards.map((board, idx) => (
              <motion.div
                key={board.id}
                data-tour={idx === 0 ? "board-card" : undefined}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <BoardCard
                  board={board}
                  onClick={() => router.push(`/boards/${board.id}`)}
                  onDelete={(e) => handleDelete(board.id, e)}
                />
              </motion.div>
            ))}
            <motion.button
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setShowCreate(true)}
              className="flex h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-[border-color,color,background-color]"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">New Board</span>
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Create Board Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="board-name" className="text-sm font-medium">
                Board Name <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <Input
                id="board-name"
                placeholder="e.g. Product Roadmap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
                aria-required="true"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                placeholder="What is this board for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || createBoard.isPending}>
              {createBoard.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BoardCard({
  board,
  onClick,
  onDelete,
}: {
  board: Board;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const colors = ["#FAB95B", "#547792", "#1A3263", "#E8924A", "#3a7cbf", "#6e9ea8"];
  const color = colors[board.id.charCodeAt(0) % colors.length];

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="group relative flex h-40 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border-2 border-border bg-card p-4"
      style={{ boxShadow: `3px 3px 0px 0px ${color}40` }}
    >
      {/* Color accent top */}
      <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-2xl" style={{ backgroundColor: color }} />

      <div className="pt-2">
        <p className="font-semibold leading-tight line-clamp-1">{board.name}</p>
        {board.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{board.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
          style={{ backgroundColor: color + "20", color }}
        >
          {ROLE_CONFIG[board.myRole].label}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button data-tour="board-menu" className="rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Board
            </DropdownMenuItem>
            {board.myRole === "owner" && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
