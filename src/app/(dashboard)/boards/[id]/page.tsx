"use client";
import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Share2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { useBoard } from "@/hooks/useBoard";
import { useBoardStore } from "@/store/boardStore";
import { getStoredUser } from "@/lib/auth";
import { toast } from "@/components/ui/toaster";
import { KanbanSkeleton } from "@/components/skeletons/KanbanSkeleton";
import { ErrorState } from "@/components/ui/error-state";

interface BoardPageProps {
  params: Promise<{ id: string }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: boardData, isLoading, isError } = useBoard(id);
  const setBoardData = useBoardStore((s) => s.setBoardData);
  const storedBoardData = useBoardStore((s) => s.boardData);
  const user = getStoredUser();

  useEffect(() => {
    if (boardData) setBoardData(boardData);
  }, [boardData, setBoardData]);

  if (isError) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <Topbar title="Board" />
        <ErrorState
          title="Gagal memuat board"
          message="Tidak dapat memuat data board. Anda mungkin tidak memiliki akses, atau koneksi bermasalah."
          onRetry={() => router.push("/boards")}
        />
      </div>
    );
  }

  const displayData = (storedBoardData?.board?.id === id ? storedBoardData : boardData) as typeof boardData;

  return (
    <>
      <Topbar
        title={
          <span className="flex items-center gap-1.5 text-sm">
            <Link href="/boards" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Boards
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 hidden sm:inline" aria-hidden="true" />
            <span className="font-semibold truncate">{displayData?.board?.name ?? "Loading…"}</span>
          </span>
        }
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const url = `${window.location.origin}/share/${id}`;
                navigator.clipboard.writeText(url).then(() =>
                  toast({ title: "Share link copied!", description: url, variant: "success" })
                );
              }}
              className="gap-1.5"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            {displayData?.board?.myRole === "owner" && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/boards/${id}/settings`}>
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="flex-1 overflow-hidden">
        {isLoading && !displayData ? (
          <KanbanSkeleton />
        ) : displayData ? (
          <KanbanBoard
            boardData={displayData}
            myRole={displayData!.board.myRole}
          />
        ) : null}
      </div>
    </>
  );
}
