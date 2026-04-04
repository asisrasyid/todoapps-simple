// ─── Cache Helper ─────────────────────────────────────────────────────────────
// Wraps Google Apps Script CacheService with JSON serialization.
// CacheService limit: 100KB per key, max 6 hours TTL.
//
// P18: keepAlive() — set a time-based trigger every 15 minutes in
//      Apps Script editor: Triggers → Add Trigger → keepAlive → Time-driven →
//      Minutes timer → Every 15 minutes.
// ─────────────────────────────────────────────────────────────────────────────

var CACHE = CacheService.getScriptCache();

/**
 * Read from cache; on miss run fetcherFn(), store result, return it.
 * @param {string} key
 * @param {function} fetcherFn  - must return a ContentService output (ok/err)
 * @param {number}  ttl         - seconds, default 120 (2 min)
 */
function getCached(key, fetcherFn, ttl) {
  ttl = ttl || 120;
  try {
    var hit = CACHE.get(key);
    if (hit) {
      return ContentService
        .createTextOutput(hit)
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (e) { /* cache read failure — fall through to fetch */ }

  var result = fetcherFn();

  // Store the raw JSON string returned by the ContentService output
  try {
    var json = result.getContent();
    // Only cache successful responses, skip if too large (>95 KB)
    if (json.length < 95000 && json.indexOf('"success":true') !== -1) {
      CACHE.put(key, json, ttl);
    }
  } catch (e) { /* cache write failure — safe to ignore */ }

  return result;
}

/**
 * Invalidate one or more cache keys.
 * @param {...string} keys
 */
function invalidateCache(/* keys */) {
  try {
    var keys = Array.prototype.slice.call(arguments);
    CACHE.removeAll(keys);
  } catch (e) { /* safe to ignore */ }
}

// ─── P18: Keep-alive — call via time-based trigger every 15 minutes ──────────
// Setup: Apps Script editor → Triggers (clock icon) → + Add Trigger
//        Function: keepAlive | Deployment: Head | Event: Time-driven
//        Time-based type: Minutes timer | Interval: Every 15 minutes
function keepAlive() {
  CACHE.put("__ping__", "1", 60);
}
