// ─── Auth ─────────────────────────────────────────────────────────────────────

function login(params) {
  var username = params.username;
  var password = params.password;

  if (!username || !password) return err("Username and password required");

  var user = findRow("Users", "username", username);
  if (!user || String(user.is_active) !== "true") return err("Invalid credentials");

  var hash = hashPassword(password);
  if (hash !== user.password_hash) return err("Invalid credentials");

  // Create session
  var token = generateId() + generateId();
  var expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  appendRow("Sessions", { token: token, user_id: user.id, expires_at: expires });

  return ok({
    token: token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      avatarColor: user.avatar_color,
      roleGlobal: user.role_global,
      isActive: user.is_active === "true" || user.is_active === true,
      createdAt: user.created_at
    }
  });
}

function logout(params, userId) {
  if (params.token) {
    deleteRow("Sessions", "token", params.token);
  }
  return ok(null);
}

function validateToken(token) {
  if (!token) return null;
  var session = findRow("Sessions", "token", token);
  if (!session) return null;

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    deleteRow("Sessions", "token", token);
    return null;
  }

  var user = findRow("Users", "id", session.user_id);
  if (!user || String(user.is_active) !== "true") return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    avatarColor: user.avatar_color,
    roleGlobal: user.role_global,
    isActive: true,
    createdAt: user.created_at
  };
}

// Setup: create first admin user (run once from Apps Script editor)
function createInitialAdmin() {
  var existing = findRow("Users", "username", "admin");
  if (existing) {
    Logger.log("Admin already exists");
    return;
  }
  appendRow("Users", {
    id: generateId(),
    username: "admin",
    password_hash: hashPassword("admin123"),
    name: "Administrator",
    avatar_color: "#6366f1",
    role_global: "owner",
    is_active: "true",
    created_at: now()
  });
  Logger.log("Admin created: admin / admin123");
}

// ─── API Key Auth ─────────────────────────────────────────────────────────────

function validateApiKey(key) {
  if (!key) return null;
  var apiKey = findRow("ApiKeys", "key", key);
  if (!apiKey || String(apiKey.is_active) !== "true") return null;

  var user = findRow("Users", "id", apiKey.user_id);
  if (!user || String(user.is_active) !== "true") return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    avatarColor: user.avatar_color,
    roleGlobal: user.role_global,
    isActive: true,
    createdAt: user.created_at
  };
}

function generateApiKey(params, userId) {
  var name = params.name || "My API Key";
  var key = "sm_" + Utilities.getUuid().replace(/-/g, "");

  appendRow("ApiKeys", {
    id: generateId(),
    user_id: userId,
    key: key,
    name: name,
    is_active: "true",
    created_at: now()
  });

  return ok({ key: key, name: name, createdAt: now() });
}

function listApiKeys(params, userId) {
  var keys = findRows("ApiKeys", "user_id", userId)
    .filter(function(k) { return String(k.is_active) === "true"; })
    .map(function(k) {
      return {
        id: k.id,
        name: k.name,
        keyPreview: k.key.slice(0, 10) + "••••••••••••••••",
        createdAt: k.created_at
      };
    });
  return ok(keys);
}

function revokeApiKey(params, userId) {
  var keyId = params.keyId;
  var apiKey = findRow("ApiKeys", "id", keyId);
  if (!apiKey || apiKey.user_id !== userId) return err("API key not found");

  updateRow("ApiKeys", "id", keyId, { is_active: "false" });
  return ok({ message: "API key revoked" });
}

// ─── User Management API actions ──────────────────────────────────────────────

function getUsers(params, userId) {
  var caller = findRow("Users", "id", userId);
  if (!caller || caller.role_global !== "owner") return err("Unauthorized");

  var rows = getAllRows("Users");
  var users = rows.map(function(row) {
    return {
      id: row.id,
      username: row.username,
      name: row.name,
      avatarColor: row.avatar_color,
      roleGlobal: row.role_global,
      isActive: String(row.is_active) === "true",
      createdAt: row.created_at
    };
  });
  return ok(users);
}

function createUserAction(params, userId) {
  var caller = findRow("Users", "id", userId);
  if (!caller || caller.role_global !== "owner") return err("Unauthorized");

  var username = params.username;
  var password = params.password;
  var name = params.name;
  var role = params.role || "contributor";

  if (!username || !password || !name) return err("Username, password, and name are required");

  var existing = findRow("Users", "username", username);
  if (existing) return err("Username already exists");

  var colors = ["#6366f1", "#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#14b8a6"];
  var color = colors[Math.floor(Math.random() * colors.length)];

  appendRow("Users", {
    id: generateId(),
    username: username,
    password_hash: hashPassword(password),
    name: name,
    avatar_color: color,
    role_global: role,
    is_active: "true",
    created_at: now()
  });
  return ok({ message: "User created" });
}

function updateUserAction(params, userId) {
  var caller = findRow("Users", "id", userId);
  if (!caller || caller.role_global !== "owner") return err("Unauthorized");

  var targetId = params.targetUserId;
  if (!targetId) return err("targetUserId required");

  var target = findRow("Users", "id", targetId);
  if (!target) return err("User not found");

  var updates = {};
  if (params.name) updates.name = params.name;
  if (params.role) updates.role_global = params.role;
  if (params.isActive !== undefined) updates.is_active = String(params.isActive);
  if (params.password) updates.password_hash = hashPassword(params.password);

  updateRow("Users", "id", targetId, updates);
  return ok({ message: "User updated" });
}

function updateOwnProfile(params, userId) {
  var user = findRow("Users", "id", userId);
  if (!user) return err("User not found");

  var updates = {};
  if (params.name) updates.name = params.name;
  updateRow("Users", "id", userId, updates);
  return ok({ message: "Profile updated" });
}

function changeOwnPassword(params, userId) {
  var user = findRow("Users", "id", userId);
  if (!user) return err("User not found");

  if (!params.currentPassword || !params.newPassword) return err("currentPassword and newPassword required");

  var currentHash = hashPassword(params.currentPassword);
  if (currentHash !== user.password_hash) return err("Current password is incorrect");

  updateRow("Users", "id", userId, { password_hash: hashPassword(params.newPassword) });
  return ok({ message: "Password changed" });
}

// Create additional users (run from editor)
function createUser(username, password, name, role) {
  role = role || "contributor";
  var existing = findRow("Users", "username", username);
  if (existing) {
    Logger.log("User already exists: " + username);
    return;
  }
  var colors = ["#6366f1", "#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#14b8a6"];
  var color = colors[Math.floor(Math.random() * colors.length)];
  appendRow("Users", {
    id: generateId(),
    username: username,
    password_hash: hashPassword(password),
    name: name,
    avatar_color: color,
    role_global: role,
    is_active: "true",
    created_at: now()
  });
  Logger.log("User created: " + username);
}
