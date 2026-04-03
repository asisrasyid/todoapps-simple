// ─── Attachment Service ────────────────────────────────────────────────────────

var DRIVE_ROOT_FOLDER_NAME = "Task-Todo_attch";

function getOrCreateFolder(parent, name) {
  var iter = parent.getFoldersByName(name);
  if (iter.hasNext()) return iter.next();
  return parent.createFolder(name);
}

function getUploadFolder(userId) {
  var today = new Date();
  var year  = String(today.getFullYear());
  var month = String(today.getMonth() + 1).padStart(2, "0");
  var date  = String(today.getDate()).padStart(2, "0");

  var user     = findRow("Users", "id", userId);
  var userName = user ? user.username : userId;

  var root     = getOrCreateFolder(DriveApp.getRootFolder(), DRIVE_ROOT_FOLDER_NAME);
  var userDir  = getOrCreateFolder(root, userName);
  var yearDir  = getOrCreateFolder(userDir, year);
  var monDir   = getOrCreateFolder(yearDir, month);
  var dayDir   = getOrCreateFolder(monDir, date);
  return dayDir;
}

function uploadAttachment(params, userId) {
  var taskId = params.taskId;
  var task = findRow("Tasks", "id", taskId);
  if (!task) return err("Task not found");

  var role = getBoardRole(task.board_id, userId);
  if (!role || role === "viewer") return err("Insufficient permissions");

  var fileName = params.fileName;
  var mimeType = params.mimeType || "application/octet-stream";
  var base64Data = params.data;
  var fileSize = parseInt(params.fileSize) || 0;

  if (!fileName || !base64Data) return err("fileName and data required");
  if (fileSize > 4 * 1024 * 1024) return err("File too large. Maximum 4MB.");

  var blob;
  try {
    blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
  } catch (e) {
    return err("Invalid file data: " + e.message);
  }

  var folder = getUploadFolder(userId);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileId = file.getId();
  var attachmentId = generateId();
  var timestamp = now();

  appendRow("Task_Attachments", {
    id: attachmentId,
    task_id: taskId,
    file_id: fileId,
    file_name: fileName,
    mime_type: mimeType,
    file_size: fileSize,
    created_by: userId,
    created_at: timestamp
  });

  return ok({
    id: attachmentId,
    taskId: taskId,
    fileId: fileId,
    fileName: fileName,
    mimeType: mimeType,
    fileSize: fileSize,
    createdBy: userId,
    createdAt: timestamp
  });
}

function deleteAttachment(params, userId) {
  var attachmentId = params.attachmentId;
  var attachment = findRow("Task_Attachments", "id", attachmentId);
  if (!attachment) return err("Attachment not found");

  var task = findRow("Tasks", "id", attachment.task_id);
  if (!task) return err("Task not found");

  var role = getBoardRole(task.board_id, userId);
  if (!role || role === "viewer") return err("Insufficient permissions");
  if (role === "contributor" && String(attachment.created_by) !== String(userId)) {
    return err("Can only delete own attachments");
  }

  try {
    var file = DriveApp.getFileById(attachment.file_id);
    file.setTrashed(true);
  } catch (e) {
    // File may already be gone, continue
  }

  deleteRow("Task_Attachments", "id", attachmentId);
  return ok(null);
}

function getTaskAttachments(params, userId) {
  var taskId = params.taskId;
  var task = findRow("Tasks", "id", taskId);
  if (!task) return err("Task not found");

  var role = getBoardRole(task.board_id, userId);
  if (!role) return err("Access denied");

  var rows = findRows("Task_Attachments", "task_id", taskId);
  return ok(rows.map(function(a) {
    return {
      id: a.id,
      taskId: a.task_id,
      fileId: a.file_id,
      fileName: a.file_name,
      mimeType: a.mime_type,
      fileSize: parseInt(a.file_size) || 0,
      createdBy: a.created_by,
      createdAt: a.created_at
    };
  }));
}
