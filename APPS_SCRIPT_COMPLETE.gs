/**
 * Simple JSON/JSONP API for wedding app.
 *
 * Sheets required:
 * - people
 * - groups
 * - slots
 * - rooms
 * - admin_state (A1=json_state, A2=JSON string)
 * - leaderboard
 *
 * Routes:
 * - ?path=data
 * - ?path=rooms
 * - ?path=admin&action=get
 * - ?path=admin&action=upsert&state=<url-encoded-json>
 * - ?path=leaderboard&action=list
 * - ?path=leaderboard&action=submit&score=<url-encoded-json>
 * - ?path=leaderboard&action=reset
 */

const DEFAULT_ADMIN_STATE = {
  delayMinutes: 8,
  photoStart: "2026-06-20T16:00",
  groupIntervalMinutes: 12,
  groups: [
    { name: "Famille mariée", done: false },
    { name: "Témoins", done: false },
    { name: "Famille mariée + marié", done: false },
    { name: "Fratrie", done: false },
    { name: "Famille mariée + mariée", done: false },
    { name: "Amis proches", done: false },
    { name: "Cousins", done: false },
    { name: "Collègues", done: false },
  ],
};

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const path = getParam_(e, "path", "data");

    if (path === "data") return handleData_(e, ss);
    if (path === "rooms") return handleRooms_(e, ss);
    if (path === "admin") return handleAdmin_(e, ss);
    if (path === "leaderboard") return handleLeaderboard_(e, ss);

    return respond_(e, { error: "Unknown path. Use ?path=data|rooms|admin|leaderboard" });
  } catch (err) {
    return respond_(e, { error: String(err) });
  }
}

function handleLeaderboard_(e, ss) {
  const action = getParam_(e, "action", "list");
  const sh = ss.getSheetByName("leaderboard");
  if (!sh) throw new Error("Missing sheet: leaderboard");

  if (action === "list") {
    const rows = readSheetAsObjects_(ss, "leaderboard");
    const scores = rows
      .map((row) => normalizeScore_(row))
      .filter((row) => row.player)
      .sort((a, b) => (b.score - a.score) || (new Date(b.created_at) - new Date(a.created_at)));

    return respond_(e, {
      updated_at: new Date().toISOString(),
      scores,
    });
  }

  if (action === "submit") {
    const rawScore = getParam_(e, "score", "");
    if (!rawScore) return respond_(e, { error: "Missing score" });

    let parsed;
    try {
      parsed = JSON.parse(rawScore);
    } catch (_error) {
      return respond_(e, { error: "Invalid JSON in score" });
    }

    const score = normalizeScore_(parsed);
    if (!score.player) return respond_(e, { error: "Missing player" });

    ensureLeaderboardHeader_(sh);
    sh.appendRow([
      score.player,
      score.score,
      score.total,
      score.answered,
      score.time,
      score.created_at,
    ]);

    return respond_(e, {
      ok: true,
      updated_at: new Date().toISOString(),
      score,
    });
  }

  if (action === "reset") {
    ensureLeaderboardHeader_(sh);
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 6).clearContent();
    }

    return respond_(e, {
      ok: true,
      updated_at: new Date().toISOString(),
      scores: [],
    });
  }

  return respond_(e, { error: "Unknown action for path=leaderboard. Use list|submit|reset" });
}

function ensureLeaderboardHeader_(sheet) {
  const headers = ["player", "score", "total", "answered", "time", "created_at"];
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const same = headers.every((header, index) => String(current[index] || "").trim() === header);
  if (same) return;

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function normalizeScore_(raw) {
  const nowIso = new Date().toISOString();
  const player = String(raw.player || "").trim().slice(0, 40);
  const score = Number(raw.score);
  const total = Number(raw.total);
  const answered = Number(raw.answered);
  const createdAt = String(raw.created_at || nowIso).trim();
  const d = new Date(createdAt);

  return {
    player,
    score: Number.isFinite(score) ? score : 0,
    total: Number.isFinite(total) ? total : 0,
    answered: Number.isFinite(answered) ? answered : 0,
    time: String(raw.time || "").trim().slice(0, 5),
    created_at: String(d) === "Invalid Date" ? nowIso : d.toISOString(),
  };
}

function handleData_(e, ss) {
  const people = readSheetAsObjects_(ss, "people");
  const groups = readSheetAsObjects_(ss, "groups");
  const slots = readSheetAsObjects_(ss, "slots");

  return respond_(e, {
    updated_at: new Date().toISOString(),
    people: people.map((p) => ({
      person_id: String(p.person_id || "").trim(),
      display_name: String(p.display_name || "").trim(),
      search_text: String(p.search_text || "").trim(),
      group_ids: String(p.group_ids || "").trim(),
    })),
    groups: groups.map((g) => ({
      group_id: String(g.group_id || "").trim(),
      group_name: String(g.group_name || "").trim(),
      slot_id: String(g.slot_id || "").trim(),
    })),
    slots: slots.map((s) => ({
      slot_id: String(s.slot_id || "").trim(),
      eta: String(s.eta || "").trim(), // "16:32"
      location: String(s.location || "").trim(),
      status: String(s.status || "").trim(), // TODO / NOW / DONE / REPLAN
      notes: String(s.notes || "").trim(),
    })),
  });
}

function handleRooms_(e, ss) {
  const rooms = readSheetAsObjects_(ss, "rooms");

  return respond_(e, {
    updated_at: new Date().toISOString(),
    rooms: rooms.map((r) => ({
      person_id: String(r.person_id || "").trim(),
      display_name: String(r.display_name || "").trim(),
      building: String(r.building || "").trim(),
      room_name: String(r.room_name || "").trim(),
      notes: String(r.notes || "").trim(),
      bed_type: String(r.bed_type || "").trim(),
      capacity: String(r.capacity || "").trim(),
      bathroom: String(r.bathroom || "").trim(),
      extra: String(r.extra || "").trim(),
    })),
  });
}

function handleAdmin_(e, ss) {
  const action = getParam_(e, "action", "get");
  const sh = ss.getSheetByName("admin_state");
  if (!sh) throw new Error("Missing sheet: admin_state");

  if (action === "get") {
    const state = readAdminState_(sh);
    return respond_(e, {
      updated_at: new Date().toISOString(),
      state,
    });
  }

  if (action === "upsert") {
    const rawState = getParam_(e, "state", "");
    if (!rawState) return respond_(e, { error: "Missing state" });

    let parsed;
    try {
      parsed = JSON.parse(rawState);
    } catch (_error) {
      return respond_(e, { error: "Invalid JSON in state" });
    }

    const next = normalizeAdminState_(parsed);
    writeAdminState_(sh, next);

    return respond_(e, {
      ok: true,
      updated_at: new Date().toISOString(),
      state: next,
    });
  }

  return respond_(e, { error: "Unknown action for path=admin. Use get|upsert" });
}

function readAdminState_(sheet) {
  const raw = String(sheet.getRange("A2").getValue() || "").trim();
  if (!raw) return cloneDefaultAdminState_();

  try {
    return normalizeAdminState_(JSON.parse(raw));
  } catch (_error) {
    return cloneDefaultAdminState_();
  }
}

function writeAdminState_(sheet, state) {
  sheet.getRange("A1").setValue("json_state");
  sheet.getRange("A2").setValue(JSON.stringify(state));
}

function normalizeAdminState_(raw) {
  const fallback = cloneDefaultAdminState_();
  if (!raw || typeof raw !== "object") return fallback;

  const groups = Array.isArray(raw.groups)
    ? raw.groups
        .map((group) => {
          if (typeof group === "string") return { name: group, done: false };
          if (group && typeof group.name === "string") {
            return { name: String(group.name).trim(), done: Boolean(group.done) };
          }
          return null;
        })
        .filter(Boolean)
    : fallback.groups;

  return {
    delayMinutes: Math.max(0, Number(raw.delayMinutes) || fallback.delayMinutes),
    photoStart: typeof raw.photoStart === "string" ? raw.photoStart : fallback.photoStart,
    groupIntervalMinutes: Math.max(1, Number(raw.groupIntervalMinutes) || fallback.groupIntervalMinutes),
    groups: groups.length ? groups : fallback.groups,
  };
}

function cloneDefaultAdminState_() {
  return JSON.parse(JSON.stringify(DEFAULT_ADMIN_STATE));
}

function readSheetAsObjects_(ss, sheetName) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error("Missing sheet: " + sheetName);

  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map((h) => String(h).trim());
  const out = [];

  for (let i = 1; i < values.length; i += 1) {
    const row = values[i];
    if (row.every((v) => String(v).trim() === "")) continue;

    const obj = {};
    for (let j = 0; j < headers.length; j += 1) {
      obj[headers[j]] = row[j];
    }
    out.push(obj);
  }

  return out;
}

function getParam_(e, key, fallback) {
  if (!e || !e.parameter) return fallback;
  if (typeof e.parameter[key] === "undefined") return fallback;
  return String(e.parameter[key]);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonp_(obj, callbackName) {
  const cb = String(callbackName || "").replace(/[^\w$.]/g, "");
  if (!cb) return json_(obj);

  const js = `${cb}(${JSON.stringify(obj)});`;
  return ContentService
    .createTextOutput(js)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function respond_(e, payload) {
  const callback = e && e.parameter ? e.parameter.callback : null;
  return jsonp_(payload, callback);
}
