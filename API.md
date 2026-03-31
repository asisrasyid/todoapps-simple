# SheetMaster Public API

REST-style API backed by Google Apps Script. All requests are `POST` to a single endpoint, with the action specified in the request body.

---

## Base URL

```
https://script.google.com/macros/s/{YOUR_SCRIPT_ID}/exec
```

Replace `{YOUR_SCRIPT_ID}` with your deployed Apps Script ID (same URL in your `.env.local`).

---

## Authentication

All API requests (except `getPublicBoard`) require an API key.

Generate a key from the app: **Profile → API Keys → Generate**.

Include the key in every request body:

```json
{
  "apiKey": "sm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "action": "...",
  ...
}
```

> API keys inherit the same permissions as the user who generated them.

---

## Request Format

```
POST {BASE_URL}
Content-Type: text/plain
Body: JSON string
```

**Example (curl):**

```bash
curl -X POST "{BASE_URL}" \
  -H "Content-Type: text/plain" \
  -d '{
    "apiKey": "sm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "action": "getTasks",
    "boardId": "abc123"
  }'
```

> Note: Use `Content-Type: text/plain` (not `application/json`) to avoid CORS preflight issues with Google Apps Script.

---

## Response Format

All responses return JSON:

```json
{ "success": true, "data": { ... } }
```

On error:

```json
{ "success": false, "error": "Error message here" }
```

---

## Endpoints

### Boards

#### Get All Boards

Returns all boards the API key owner is a member of.

```json
{
  "apiKey": "sm_...",
  "action": "getBoards"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "board123",
      "name": "My Project",
      "description": "Project board",
      "createdBy": "user123",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "isArchived": false,
      "myRole": "owner"
    }
  ]
}
```

---

#### Get Board Detail

Returns full board data including columns, tasks, members, and labels.

```json
{
  "apiKey": "sm_...",
  "action": "getBoard",
  "boardId": "board123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "board": { "id": "board123", "name": "My Project", "myRole": "owner", ... },
    "columns": [
      { "id": "col1", "name": "To Do", "position": 0, "color": "#64748b", "requiresApproval": false }
    ],
    "tasks": [ ... ],
    "members": [ ... ],
    "labels": [ ... ]
  }
}
```

---

#### Get Public Board (No auth required)

Read-only view of a board. Uses `GET` request.

```
GET {BASE_URL}?action=getPublicBoard&boardId=board123
```

**Example (curl):**
```bash
curl "{BASE_URL}?action=getPublicBoard&boardId=board123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "board": { "id": "board123", "name": "My Project", "description": "..." },
    "columns": [ { "id": "col1", "name": "To Do", "position": 0, "color": "#64748b" } ],
    "tasks": [
      {
        "id": "task1",
        "columnId": "col1",
        "title": "Fix login bug",
        "priority": "high",
        "deadline": "2025-06-01T00:00:00.000Z",
        "position": 0,
        "assignees": [ { "id": "u1", "name": "Alice", "avatarColor": "#6366f1" } ]
      }
    ]
  }
}
```

---

### Tasks

#### Get Tasks

Get all tasks in a board.

```json
{
  "apiKey": "sm_...",
  "action": "getBoard",
  "boardId": "board123"
}
```

> Use `getBoard` — tasks are included in the response under `data.tasks`.

---

#### Create Task

```json
{
  "apiKey": "sm_...",
  "action": "createTask",
  "boardId": "board123",
  "columnId": "col1",
  "title": "Fix login bug",
  "priority": "high"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `boardId` | string | Yes | Board ID |
| `columnId` | string | Yes | Column ID to place the task in |
| `title` | string | Yes | Task title |
| `priority` | string | No | `low` \| `medium` \| `high` \| `urgent` (default: `medium`) |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "task123",
    "boardId": "board123",
    "columnId": "col1",
    "title": "Fix login bug",
    "priority": "high",
    "position": 3,
    ...
  }
}
```

---

#### Update Task

Update task fields. Only include fields you want to change.

```json
{
  "apiKey": "sm_...",
  "action": "updateTask",
  "taskId": "task123",
  "title": "Fix login bug (urgent)",
  "priority": "urgent",
  "description": "Users cannot login on mobile",
  "deadline": "2025-06-15"
}
```

| Field | Type | Description |
|---|---|---|
| `taskId` | string | **Required** — Task ID |
| `title` | string | New title |
| `description` | string | Task description |
| `priority` | string | `low` \| `medium` \| `high` \| `urgent` |
| `deadline` | string | ISO date string or `""` to clear |

**Response:**
```json
{ "success": true, "data": null }
```

---

#### Move Task (Change Column)

Move a task to a different column.

```json
{
  "apiKey": "sm_...",
  "action": "moveTask",
  "taskId": "task123",
  "toColumnId": "col2",
  "position": 0
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `taskId` | string | Yes | Task ID |
| `toColumnId` | string | Yes | Destination column ID |
| `position` | number | Yes | Position in the column (0 = top) |

> Note: Moving to a column with `requiresApproval: true` will create a pending approval instead of moving immediately.

---

#### Delete Task

```json
{
  "apiKey": "sm_...",
  "action": "deleteTask",
  "taskId": "task123"
}
```

**Response:**
```json
{ "success": true, "data": null }
```

---

### Subtasks

#### Create Subtask

```json
{
  "apiKey": "sm_...",
  "action": "createSubTask",
  "taskId": "task123",
  "title": "Write unit tests"
}
```

---

#### Update Subtask

```json
{
  "apiKey": "sm_...",
  "action": "updateSubTask",
  "subTaskId": "sub123",
  "title": "Write unit tests (updated)",
  "isCompleted": true
}
```

---

#### Delete Subtask

```json
{
  "apiKey": "sm_...",
  "action": "deleteSubTask",
  "subTaskId": "sub123"
}
```

---

### Labels

#### Create Label

```json
{
  "apiKey": "sm_...",
  "action": "createLabel",
  "boardId": "board123",
  "name": "Bug",
  "color": "#ef4444"
}
```

---

#### Add Label to Task

```json
{
  "apiKey": "sm_...",
  "action": "addTaskLabel",
  "taskId": "task123",
  "labelId": "label123"
}
```

---

#### Remove Label from Task

```json
{
  "apiKey": "sm_...",
  "action": "removeTaskLabel",
  "taskId": "task123",
  "labelId": "label123"
}
```

---

### Assignees

#### Add Assignee to Task

```json
{
  "apiKey": "sm_...",
  "action": "addAssignee",
  "taskId": "task123",
  "userId": "user123"
}
```

---

#### Remove Assignee from Task

```json
{
  "apiKey": "sm_...",
  "action": "removeAssignee",
  "taskId": "task123",
  "userId": "user123"
}
```

---

## Code Examples

### JavaScript / Node.js

```javascript
const BASE_URL = "https://script.google.com/macros/s/{SCRIPT_ID}/exec";
const API_KEY = "sm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

async function smApi(action, params = {}) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ apiKey: API_KEY, action, ...params }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

// Get all boards
const boards = await smApi("getBoards");

// Create a task
const task = await smApi("createTask", {
  boardId: "board123",
  columnId: "col1",
  title: "New task from API",
  priority: "medium",
});

// Update task
await smApi("updateTask", {
  taskId: task.id,
  title: "Updated title",
  priority: "high",
});

// Move task to another column
await smApi("moveTask", {
  taskId: task.id,
  toColumnId: "col2",
  position: 0,
});

// Delete task
await smApi("deleteTask", { taskId: task.id });
```

---

### Python

```python
import requests
import json

BASE_URL = "https://script.google.com/macros/s/{SCRIPT_ID}/exec"
API_KEY = "sm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

def sm_api(action, **params):
    payload = {"apiKey": API_KEY, "action": action, **params}
    res = requests.post(
        BASE_URL,
        headers={"Content-Type": "text/plain"},
        data=json.dumps(payload),
        allow_redirects=True
    )
    data = res.json()
    if not data.get("success"):
        raise Exception(data.get("error", "API error"))
    return data["data"]

# Get all boards
boards = sm_api("getBoards")

# Create a task
task = sm_api("createTask",
    boardId="board123",
    columnId="col1",
    title="Task from Python",
    priority="high"
)

# Update task
sm_api("updateTask",
    taskId=task["id"],
    description="Added via Python API",
    deadline="2025-12-31"
)
```

---

### curl (bash)

```bash
BASE_URL="https://script.google.com/macros/s/{SCRIPT_ID}/exec"
API_KEY="sm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Get boards
curl -X POST "$BASE_URL" \
  -H "Content-Type: text/plain" \
  -d "{\"apiKey\":\"$API_KEY\",\"action\":\"getBoards\"}"

# Create task
curl -X POST "$BASE_URL" \
  -H "Content-Type: text/plain" \
  -d "{\"apiKey\":\"$API_KEY\",\"action\":\"createTask\",\"boardId\":\"board123\",\"columnId\":\"col1\",\"title\":\"New task\",\"priority\":\"medium\"}"

# Update task
curl -X POST "$BASE_URL" \
  -H "Content-Type: text/plain" \
  -d "{\"apiKey\":\"$API_KEY\",\"action\":\"updateTask\",\"taskId\":\"task123\",\"title\":\"Updated\",\"priority\":\"urgent\"}"
```

---

## Error Reference

| Error | Cause |
|---|---|
| `Unauthorized` | Missing or invalid `apiKey` / `token` |
| `Board not found` | Invalid `boardId` or no access |
| `Access denied` | Not a member of the board |
| `Insufficient permissions` | Role too low for the action |
| `User not found` | Invalid `userId` or `username` |
| `Username already exists` | Duplicate username on create |
| `Only owner can delete board` | Not the board owner |

---

## Priority Values

| Value | Description |
|---|---|
| `low` | Low priority |
| `medium` | Medium priority (default) |
| `high` | High priority |
| `urgent` | Urgent / critical |

## Role Values

| Value | Permissions |
|---|---|
| `owner` | Full access, manage members, delete board |
| `approver` | Manage columns, approve task movements |
| `contributor` | Create and edit tasks |
| `viewer` | Read-only access |
