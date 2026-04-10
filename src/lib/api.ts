import { ApiResponse, Attachment, Board, BoardData, BoardMember, Approval, Comment, User } from "@/types";

// Replace this with your deployed Google Apps Script Web App URL
const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";

const API_TIMEOUT_MS = 15000;

async function callAPI<T>(
  action: string,
  params: Record<string, unknown> = {},
  token?: string
): Promise<T> {
  const body: Record<string, unknown> = { action, ...params };
  if (token) body.token = token;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const data: ApiResponse<T> = await res.json();
    if (!data.success) throw new Error(data.error || "API error");
    return data.data as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Koneksi ke server timeout. Coba lagi.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("sm_token") || "";
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function apiLogin(username: string, password: string) {
  return callAPI<{ token: string; user: User }>("login", { username, password });
}

export async function apiLogout() {
  return callAPI("logout", {}, getToken());
}

// ─── Boards ──────────────────────────────────────────────────────────────────

export async function apiGetBoards() {
  return callAPI<Board[]>("getBoards", {}, getToken());
}

export async function apiCreateBoard(name: string, description: string) {
  return callAPI<Board>("createBoard", { name, description }, getToken());
}

export async function apiUpdateBoard(boardId: string, name: string, description: string) {
  return callAPI<Board>("updateBoard", { boardId, name, description }, getToken());
}

export async function apiDeleteBoard(boardId: string) {
  return callAPI("deleteBoard", { boardId }, getToken());
}

export async function apiGetBoard(boardId: string) {
  return callAPI<BoardData>("getBoard", { boardId }, getToken());
}

// ─── Board Members ────────────────────────────────────────────────────────────

export async function apiGetBoardMembers(boardId: string) {
  return callAPI<BoardMember[]>("getBoardMembers", { boardId }, getToken());
}

export async function apiAddBoardMember(boardId: string, username: string, role: string) {
  return callAPI("addBoardMember", { boardId, username, role }, getToken());
}

export async function apiUpdateBoardMember(boardId: string, userId: string, role: string) {
  return callAPI("updateBoardMember", { boardId, userId, role }, getToken());
}

export async function apiRemoveBoardMember(boardId: string, userId: string) {
  return callAPI("removeBoardMember", { boardId, userId }, getToken());
}

// ─── Columns ─────────────────────────────────────────────────────────────────

export async function apiCreateColumn(boardId: string, name: string, color: string) {
  return callAPI("createColumn", { boardId, name, color }, getToken());
}

export async function apiUpdateColumn(
  columnId: string,
  name: string,
  color: string,
  requiresApproval: boolean
) {
  return callAPI("updateColumn", { columnId, name, color, requiresApproval }, getToken());
}

export async function apiDeleteColumn(columnId: string) {
  return callAPI("deleteColumn", { columnId }, getToken());
}

export async function apiReorderColumns(columnIds: string[]) {
  return callAPI("reorderColumns", { columnIds }, getToken());
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function apiCreateTask(
  boardId: string,
  columnId: string,
  title: string,
  priority: string = "medium"
) {
  return callAPI("createTask", { boardId, columnId, title, priority }, getToken());
}

export async function apiUpdateTask(taskId: string, updates: Record<string, unknown>) {
  return callAPI<{ approvalRequested?: boolean } | null>("updateTask", { taskId, ...updates }, getToken());
}

export async function apiDeleteTask(taskId: string) {
  return callAPI("deleteTask", { taskId }, getToken());
}

export async function apiMoveTask(taskId: string, toColumnId: string, position: number, note?: string) {
  return callAPI("moveTask", { taskId, toColumnId, position, note }, getToken());
}

export async function apiReorderTasks(columnId: string, taskIds: string[]) {
  return callAPI("reorderTasks", { columnId, taskIds }, getToken());
}

// ─── SubTasks ─────────────────────────────────────────────────────────────────

export async function apiCreateSubTask(taskId: string, title: string) {
  return callAPI("createSubTask", { taskId, title }, getToken());
}

export async function apiUpdateSubTask(
  subTaskId: string,
  updates: { title?: string; isCompleted?: boolean }
) {
  return callAPI("updateSubTask", { subTaskId, ...updates }, getToken());
}

export async function apiDeleteSubTask(subTaskId: string) {
  return callAPI("deleteSubTask", { subTaskId }, getToken());
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export async function apiCreateLabel(boardId: string, name: string, color: string) {
  return callAPI("createLabel", { boardId, name, color }, getToken());
}

export async function apiDeleteLabel(labelId: string) {
  return callAPI("deleteLabel", { labelId }, getToken());
}

export async function apiAddTaskLabel(taskId: string, labelId: string) {
  return callAPI("addTaskLabel", { taskId, labelId }, getToken());
}

export async function apiRemoveTaskLabel(taskId: string, labelId: string) {
  return callAPI("removeTaskLabel", { taskId, labelId }, getToken());
}

// ─── Assignees ────────────────────────────────────────────────────────────────

export async function apiAddAssignee(taskId: string, userId: string) {
  return callAPI("addAssignee", { taskId, userId }, getToken());
}

export async function apiRemoveAssignee(taskId: string, userId: string) {
  return callAPI("removeAssignee", { taskId, userId }, getToken());
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardData {
  activity: Record<string, number>;
  stats: { total: number; completed: number; inProgress: number; overdue: number; pendingApprovals: number };
  staleTasks: { id: string; title: string; boardId: string; boardName: string; columnName: string; priority: string; updatedAt: string; daysSinceUpdate: number }[];
  recentActivity: { id: string; title: string; boardId: string; boardName: string; columnName: string; priority: string; updatedAt: string; isDone: boolean }[];
}

export async function apiGetDashboardData() {
  return callAPI<DashboardData>("getDashboardData", {}, getToken());
}

// ─── Public Board (no auth) ──────────────────────────────────────────────────

export async function apiGetPublicBoard(boardId: string) {
  const url = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";
  const res = await fetch(`${url}?action=getPublicBoard&boardId=${boardId}`);
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "API error");
  return data.data as {
    board: { id: string; name: string; description: string };
    columns: { id: string; name: string; position: number; color: string }[];
    tasks: { id: string; columnId: string; title: string; priority: string; deadline: string | null; position: number; assignees: { id: string; name: string; avatarColor: string }[] }[];
  };
}

// ─── Attachments ─────────────────────────────────────────────────────────────

export const ACCEPTED_ATTACHMENT_TYPES =
  "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.sql";

export const MAX_ATTACHMENT_SIZE = 4 * 1024 * 1024; // 4MB

export function getDriveUrls(fileId: string) {
  return {
    preview: `https://drive.google.com/file/d/${fileId}/preview`,
    thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`,
    // uc?export=view deprecated — thumbnail with large size is reliable & CORS-safe
    image: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
    download: `https://drive.google.com/uc?export=download&id=${fileId}`,
  };
}

export async function apiGetTaskAttachments(taskId: string) {
  return callAPI<Attachment[]>("getTaskAttachments", { taskId }, getToken());
}

export async function apiUploadAttachment(taskId: string, file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      reject(new Error("File terlalu besar. Maksimal 4MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const result = await callAPI<Attachment>(
          "uploadAttachment",
          {
            taskId,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            fileSize: file.size,
            data: base64,
          },
          getToken()
        );
        resolve(result);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

export async function apiDeleteAttachment(attachmentId: string) {
  return callAPI("deleteAttachment", { attachmentId }, getToken());
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function apiGetTaskComments(taskId: string) {
  return callAPI<Comment[]>("getTaskComments", { taskId }, getToken());
}

export async function apiCreateComment(taskId: string, content: string, parentId?: string) {
  return callAPI<Comment>("createComment", { taskId, content, parentId }, getToken());
}

export async function apiUpdateComment(commentId: string, content: string) {
  return callAPI("updateComment", { commentId, content }, getToken());
}

export async function apiDeleteComment(commentId: string) {
  return callAPI("deleteComment", { commentId }, getToken());
}

// ─── API Key Management ───────────────────────────────────────────────────────

export async function apiGenerateApiKey(name: string) {
  return callAPI<{ key: string; name: string; createdAt: string }>("generateApiKey", { name }, getToken());
}

export async function apiListApiKeys() {
  return callAPI<{ id: string; name: string; keyPreview: string; createdAt: string }[]>("listApiKeys", {}, getToken());
}

export async function apiRevokeApiKey(keyId: string) {
  return callAPI("revokeApiKey", { keyId }, getToken());
}

// ─── User Management ─────────────────────────────────────────────────────────

export async function apiGetUsers() {
  return callAPI<User[]>("getUsers", {}, getToken());
}

export async function apiCreateUser(username: string, password: string, name: string, role: string) {
  return callAPI("createUserAction", { username, password, name, role }, getToken());
}

export async function apiUpdateUser(targetUserId: string, updates: { name?: string; role?: string; isActive?: boolean; password?: string }) {
  return callAPI("updateUserAction", { targetUserId, ...updates }, getToken());
}

export async function apiUpdateOwnProfile(name: string) {
  return callAPI("updateOwnProfile", { name }, getToken());
}

export async function apiChangeOwnPassword(currentPassword: string, newPassword: string) {
  return callAPI("changeOwnPassword", { currentPassword, newPassword }, getToken());
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export async function apiGetPendingApprovals() {
  return callAPI<Approval[]>("getPendingApprovals", {}, getToken());
}

export async function apiApproveTask(approvalId: string) {
  return callAPI("approveTask", { approvalId }, getToken());
}

export async function apiRejectTask(approvalId: string, note: string) {
  return callAPI("rejectTask", { approvalId, note }, getToken());
}
