import { loadJSONFromStorage, saveJSONToStorage } from "../storage.js";
import { escapeHTML } from "../ui.js";

const ADMIN_STATE_KEY = "mariage_admin_state_v5";

const DEFAULT_STATE = {
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

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function normalizeState(raw) {
  const fallback = cloneDefaultState();
  if (!raw || typeof raw !== "object") return fallback;

  const normalizedGroups = Array.isArray(raw.groups)
    ? raw.groups
      .map((group) => {
        if (typeof group === "string") return { name: group, done: false };
        if (group && typeof group.name === "string") {
          return { name: group.name, done: Boolean(group.done) };
        }
        return null;
      })
      .filter(Boolean)
    : fallback.groups;

  return {
    delayMinutes: Math.max(0, Number(raw.delayMinutes) || fallback.delayMinutes),
    photoStart: typeof raw.photoStart === "string" ? raw.photoStart : fallback.photoStart,
    groupIntervalMinutes: Math.max(1, Number(raw.groupIntervalMinutes) || fallback.groupIntervalMinutes),
    groups: normalizedGroups.length > 0 ? normalizedGroups : fallback.groups,
  };
}

function getState() {
  return normalizeState(loadJSONFromStorage(ADMIN_STATE_KEY, cloneDefaultState()));
}

function setState(next) {
  saveJSONToStorage(ADMIN_STATE_KEY, next);
}

function toDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(DEFAULT_STATE.photoStart) : parsed;
}

function formatHour(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getPassageTime(state, index) {
  const base = toDate(state.photoStart);
  const offsetMinutes = state.delayMinutes + (index * state.groupIntervalMinutes);
  const time = new Date(base.getTime() + offsetMinutes * 60000);
  return formatHour(time);
}

function renderSchedule(state) {
  const board = document.getElementById("slotsBoard");
  if (!board) return;

  const rows = state.groups.map((group, index) => `
    <div class="admin-drop-zone" data-insert-index="${index}">
      <span>Déposer ici</span>
    </div>
    <div class="admin-schedule-row ${group.done ? "is-done" : ""}" draggable="true" data-row-index="${index}">
      <span class="admin-schedule-time">${escapeHTML(getPassageTime(state, index))}</span>
      <span class="admin-schedule-group">${escapeHTML(group.name)}</span>
      <button
        type="button"
        class="admin-done-btn ${group.done ? "is-done" : ""}"
        aria-label="Marquer le groupe comme fait"
        data-done-index="${index}"
      >
        ${group.done ? "✅ Done" : "Done"}
      </button>
      <span class="admin-schedule-drag" aria-hidden="true">☰</span>
    </div>
  `);

  rows.push(`
    <div class="admin-drop-zone" data-insert-index="${state.groups.length}">
      <span>Déposer ici</span>
    </div>
  `);

  board.innerHTML = rows.join("");

  // Defensive cleanup: if an old cached template injects arrow controls, remove them.
  board.querySelectorAll(".admin-row-controls, .admin-move-btn").forEach((node) => node.remove());
}

function moveRow(state, fromIndex, insertIndex) {
  const start = Number(fromIndex);
  let target = Number(insertIndex);
  if (!Number.isInteger(start) || !Number.isInteger(target)) return start;
  if (start < 0 || target < 0 || start >= state.groups.length) return start;

  if (target > state.groups.length) target = state.groups.length;
  if (target === start || target === start + 1) return start;

  const [moved] = state.groups.splice(start, 1);
  if (!moved) return start;

  const nextIndex = target > start ? target - 1 : target;
  state.groups.splice(nextIndex, 0, moved);
  return nextIndex;
}

function wireDoneButtons(state, onChange) {
  document.querySelectorAll("[data-done-index]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const idx = Number(button.dataset.doneIndex);
      if (!Number.isInteger(idx) || idx < 0 || idx >= state.groups.length) return;
      state.groups[idx].done = !state.groups[idx].done;
      onChange();
    });
  });
}


function wireDragAndDrop(state, onChange) {
  let draggedIndex = null;

  const clearZones = () => {
    document.querySelectorAll(".admin-drop-zone").forEach((zone) => {
      zone.classList.remove("is-active");
    });
  };

  document.querySelectorAll(".admin-schedule-row").forEach((row) => {
    row.addEventListener("dragstart", (event) => {
      draggedIndex = Number(row.dataset.rowIndex);
      event.dataTransfer?.setData("text/plain", "dragging");
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      row.classList.add("dragging");
      document.getElementById("slotsBoard")?.classList.add("is-dragging");
    });

    row.addEventListener("dragend", () => {
      draggedIndex = null;
      row.classList.remove("dragging");
      document.getElementById("slotsBoard")?.classList.remove("is-dragging");
      clearZones();
    });
  });

  document.querySelectorAll(".admin-drop-zone").forEach((zone) => {
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (draggedIndex == null) return;
      clearZones();
      zone.classList.add("is-active");
    });

    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      if (draggedIndex == null) return;
      const insertIndex = Number(zone.dataset.insertIndex);
      moveRow(state, draggedIndex, insertIndex);
      clearZones();
      onChange();
    });
  });
}


function wireTouchDragAndDrop(state, onChange) {
  let draggedIndex = null;
  let activeZone = null;
  let activeRow = null;
  let startY = 0;
  let hasMoved = false;

  const board = document.getElementById("slotsBoard");
  if (!board) return;

  const clearZones = () => {
    document.querySelectorAll(".admin-drop-zone").forEach((zone) => {
      zone.classList.remove("is-active");
    });
    activeZone = null;
  };

  const cleanup = () => {
    clearZones();
    board.classList.remove("is-touch-dragging");
    if (activeRow) {
      activeRow.classList.remove("touch-dragging");
      activeRow.style.transform = "";
    }
    activeRow = null;
    draggedIndex = null;
    hasMoved = false;
  };

  const zoneAtPoint = (x, y) => {
    const candidates = document.elementsFromPoint(x, y);
    return candidates.find((node) => node.classList?.contains("admin-drop-zone")) || null;
  };

  document.querySelectorAll(".admin-schedule-row").forEach((row) => {
    row.addEventListener("touchstart", (event) => {
      if (event.touches.length !== 1) return;
      if (event.target.closest(".admin-done-btn")) return;

      draggedIndex = Number(row.dataset.rowIndex);
      if (!Number.isInteger(draggedIndex)) return;

      activeRow = row;
      startY = event.touches[0].clientY;
      hasMoved = false;
      board.classList.add("is-touch-dragging");
      row.classList.add("touch-dragging");
    }, { passive: true });

    row.addEventListener("touchmove", (event) => {
      if (!activeRow || draggedIndex == null || event.touches.length !== 1) return;
      event.preventDefault();
      const touch = event.touches[0];
      const deltaY = touch.clientY - startY;
      if (Math.abs(deltaY) > 3) hasMoved = true;
      activeRow.style.transform = `translateY(${deltaY}px) scale(1.01)`;

      const zone = zoneAtPoint(touch.clientX, touch.clientY);
      if (zone === activeZone) return;

      clearZones();
      if (zone) {
        zone.classList.add("is-active");
        activeZone = zone;
      }
    }, { passive: false });

    row.addEventListener("touchend", () => {
      if (!activeRow || draggedIndex == null) return;

      if (hasMoved && activeZone) {
        const insertIndex = Number(activeZone.dataset.insertIndex);
        moveRow(state, draggedIndex, insertIndex);
        cleanup();
        onChange();
        return;
      }

      cleanup();
    }, { passive: true });

    row.addEventListener("touchcancel", cleanup, { passive: true });
  });
}

function setStatus(message, tone = "") {
  const status = document.getElementById("adminSyncStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.remove("ok");
  if (tone === "ok") status.classList.add("ok");
}

function simulateSheetSync(state) {
  setStatus("Synchronisation Google Sheet simulée en cours…");
  window.setTimeout(() => {
    setStatus(
      `Google Sheet simulé mis à jour · début ${state.photoStart} · intervalle ${state.groupIntervalMinutes} min · retard ${state.delayMinutes} min`,
      "ok",
    );
  }, 500);
}

export function initAdmin() {
  const state = getState();

  const delayInput = document.getElementById("delayInput");
  const photoStartInput = document.getElementById("photoStartInput");
  const groupIntervalInput = document.getElementById("groupIntervalInput");
  const saveBtn = document.getElementById("saveSettingsBtn");
  const resetBtn = document.getElementById("resetSettingsBtn");

  if (!delayInput || !photoStartInput || !groupIntervalInput || !saveBtn || !resetBtn) return;

  delayInput.value = String(state.delayMinutes);
  photoStartInput.value = state.photoStart;
  groupIntervalInput.value = String(state.groupIntervalMinutes);

  const refreshBoard = () => {
    renderSchedule(state);
    setState(state);
    wireDoneButtons(state, refreshBoard);
    wireDragAndDrop(state, refreshBoard);
    wireTouchDragAndDrop(state, refreshBoard);
  };

  refreshBoard();

  saveBtn.addEventListener("click", () => {
    state.photoStart = photoStartInput.value || DEFAULT_STATE.photoStart;
    state.groupIntervalMinutes = Math.max(1, Number(groupIntervalInput.value) || 1);
    state.delayMinutes = Math.max(0, Number(delayInput.value) || 0);
    setState(state);
    refreshBoard();
    simulateSheetSync(state);
  });

  resetBtn.addEventListener("click", () => {
    const reset = cloneDefaultState();
    state.delayMinutes = reset.delayMinutes;
    state.photoStart = reset.photoStart;
    state.groupIntervalMinutes = reset.groupIntervalMinutes;
    state.groups = reset.groups;
    delayInput.value = String(state.delayMinutes);
    photoStartInput.value = state.photoStart;
    groupIntervalInput.value = String(state.groupIntervalMinutes);
    refreshBoard();
    setStatus("Données synthétiques restaurées.", "ok");
  });
}
