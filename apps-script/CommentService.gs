// ─── Comment Service ──────────────────────────────────────────────────────────
// Sheet: Task_Comments
// Columns: id, task_id, parent_id, user_id, content, created_at

function getTaskComments(params, userId) {
  var taskId = params.taskId;
  var task = findRow("Tasks", "id", taskId);
  if (!task) return err("Task not found");
  if (!getBoardRole(task.board_id, userId)) return err("Access denied");

  return getCached("cmts_" + taskId, function() {
    var comments = findRows("Task_Comments", "task_id", taskId);
    var allUsers = getAllRows("Users");
    var userMap = {};
    allUsers.forEach(function(u) {
      userMap[u.id] = { name: u.name, avatarColor: u.avatar_color };
    });

    return ok(comments
      .sort(function(a, b) { return new Date(a.created_at) - new Date(b.created_at); })
      .map(function(c) {
        var u = userMap[c.user_id] || {};
        return {
          id: c.id,
          taskId: c.task_id,
          parentId: c.parent_id || null,
          userId: c.user_id,
          userName: u.name || "Unknown",
          avatarColor: u.avatarColor || "#888",
          content: c.content,
          createdAt: c.created_at
        };
      }));
  }, 60);
}

function createComment(params, userId) {
  var taskId = params.taskId;
  var task = findRow("Tasks", "id", taskId);
  if (!task) return err("Task not found");

  var role = getBoardRole(task.board_id, userId);
  if (!role || role === "viewer") return err("Insufficient permissions");

  var content = (params.content || "").trim();
  if (!content) return err("Comment cannot be empty");
  if (content.length > 1000) return err("Comment too long (max 1000 chars)");

  var commentId = generateId();
  var timestamp = now();

  appendRow("Task_Comments", {
    id: commentId,
    task_id: taskId,
    parent_id: params.parentId || "",
    user_id: userId,
    content: content,
    created_at: timestamp
  });

  invalidateCache("brd_" + task.board_id + "_" + userId, "cmts_" + taskId);

  var user = findRow("Users", "id", userId);
  return ok({
    id: commentId,
    taskId: taskId,
    parentId: params.parentId || null,
    userId: userId,
    userName: user ? user.name : "Unknown",
    avatarColor: user ? user.avatar_color : "#888",
    content: content,
    createdAt: timestamp
  });
}

function deleteComment(params, userId) {
  var comment = findRow("Task_Comments", "id", params.commentId);
  if (!comment) return err("Comment not found");

  var task = findRow("Tasks", "id", comment.task_id);
  if (!task) return err("Task not found");

  var role = getBoardRole(task.board_id, userId);
  // Only owner of comment or board owner/approver can delete
  if (comment.user_id !== userId && role !== "owner" && role !== "approver") {
    return err("Cannot delete this comment");
  }

  // Also delete replies to this comment
  deleteRows("Task_Comments", "parent_id", params.commentId);
  deleteRow("Task_Comments", "id", params.commentId);
  invalidateCache("brd_" + task.board_id + "_" + userId, "cmts_" + comment.task_id);
  return ok(null);
}

function updateComment(params, userId) {
  var comment = findRow("Task_Comments", "id", params.commentId);
  if (!comment) return err("Comment not found");
  if (comment.user_id !== userId) return err("Can only edit own comments");

  var content = (params.content || "").trim();
  if (!content) return err("Comment cannot be empty");
  if (content.length > 1000) return err("Comment too long");

  updateRow("Task_Comments", "id", params.commentId, { content: content });

  var task = findRow("Tasks", "id", comment.task_id);
  if (task) invalidateCache("brd_" + task.board_id + "_" + userId, "cmts_" + comment.task_id);
  return ok(null);
}
