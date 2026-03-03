import { loadJSONFromStorage, saveJSONToStorage } from "../storage.js";
import { escapeHTML } from "../ui.js";

const ADMIN_STATE_KEY = "mariage_admin_state_v7";
const LONG_PRESS_MS = 220;

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

  board.innerHTML = rows.join("");
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

function wireDesktopDragAndDrop(state, onChange) {
  const board = document.getElementById("slotsBoard");
  if (!board) return;

  let draggedIndex = null;

  const clearHints = () => {
    board.querySelectorAll(".admin-schedule-row").forEach((row) => row.classList.remove("shift-up", "shift-down"));
  };

  const computeInsertIndexFromY = (y) => {
    const rows = Array.from(board.querySelectorAll(".admin-schedule-row"));
    for (let i = 0; i < rows.length; i += 1) {
      if (i === draggedIndex) continue;
      const rect = rows[i].getBoundingClientRect();
      const middle = rect.top + rect.height / 2;
      if (y < middle) return i;
    }
    return rows.length;
  };

  const applyHole = (insertIndex) => {
    clearHints();
    if (!Number.isInteger(draggedIndex)) return;
    board.querySelectorAll(".admin-schedule-row").forEach((row) => {
      const idx = Number(row.dataset.rowIndex);
      if (!Number.isInteger(idx) || idx === draggedIndex) return;
      if (insertIndex > draggedIndex && idx > draggedIndex && idx < insertIndex) row.classList.add("shift-up");
      if (insertIndex <= draggedIndex && idx >= insertIndex && idx < draggedIndex) row.classList.add("shift-down");
    });
  };

  board.querySelectorAll(".admin-schedule-row").forEach((row) => {
    row.addEventListener("dragstart", (event) => {
      draggedIndex = Number(row.dataset.rowIndex);
      event.dataTransfer?.setData("text/plain", "dragging");
      row.classList.add("dragging");
    });

    row.addEventListener("dragend", () => {
      draggedIndex = null;
      row.classList.remove("dragging");
      clearHints();
    });
  });

  board.addEventListener("dragover", (event) => {
    if (!Number.isInteger(draggedIndex)) return;
    event.preventDefault();
    const insertIndex = computeInsertIndexFromY(event.clientY);
    applyHole(insertIndex);
  });

  board.addEventListener("drop", (event) => {
    if (!Number.isInteger(draggedIndex)) return;
    event.preventDefault();
    const insertIndex = computeInsertIndexFromY(event.clientY);
    moveRow(state, draggedIndex, insertIndex);
    onChange();
  });
}

function wireTouchLongPressReorder(state, onChange) {
  const board = document.getElementById("slotsBoard");
  if (!board) return;

  let pressedRow = null;
  let activeRow = null;
  let draggedIndex = null;
  let insertIndex = null;
  let pressTimer = null;
  let startY = 0;
  let lastY = 0;
  let rowHeight = 0;
  let isDragging = false;

  const rows = () => Array.from(board.querySelectorAll(".admin-schedule-row"));

  const clearHole = () => {
    rows().forEach((row) => row.classList.remove("shift-up", "shift-down", "drag-ready"));
  };

  const clearAll = () => {
    window.clearTimeout(pressTimer);
    pressTimer = null;
    clearHole();
    board.classList.remove("is-touch-dragging");

    if (activeRow) {
      activeRow.classList.remove("touch-dragging");
      activeRow.style.transform = "";
    }

    pressedRow = null;
    activeRow = null;
    draggedIndex = null;
    insertIndex = null;
    isDragging = false;
  };

  const computeInsertIndexFromY = (y) => {
    const allRows = rows();
    for (let i = 0; i < allRows.length; i += 1) {
      if (i === draggedIndex) continue;
      const rect = allRows[i].getBoundingClientRect();
      const middle = rect.top + rect.height / 2;
      if (y < middle) return i;
    }
    return allRows.length;
  };

  const applyHole = () => {
    clearHole();
    if (!Number.isInteger(draggedIndex) || !Number.isInteger(insertIndex)) return;

    rows().forEach((row) => {
      const idx = Number(row.dataset.rowIndex);
      if (!Number.isInteger(idx) || idx === draggedIndex) return;

      if (insertIndex > draggedIndex && idx > draggedIndex && idx < insertIndex) {
        row.classList.add("shift-up");
      }
      if (insertIndex <= draggedIndex && idx >= insertIndex && idx < draggedIndex) {
        row.classList.add("shift-down");
      }
    });
  };

  const onTouchStart = (event) => {
    if (event.touches.length !== 1) return;
    const target = event.target.closest(".admin-schedule-row");
    if (!target) return;
    if (event.target.closest(".admin-done-btn")) return;

    pressedRow = target;
    startY = event.touches[0].clientY;
    lastY = startY;

    pressTimer = window.setTimeout(() => {
      if (!pressedRow) return;
      activeRow = pressedRow;
      draggedIndex = Number(activeRow.dataset.rowIndex);
      if (!Number.isInteger(draggedIndex)) return;

      rowHeight = activeRow.getBoundingClientRect().height;
      isDragging = true;
      board.classList.add("is-touch-dragging");
      activeRow.classList.add("touch-dragging");
    }, LONG_PRESS_MS);
  };

  const onTouchMove = (event) => {
    if (event.touches.length !== 1) return;
    lastY = event.touches[0].clientY;

    if (!isDragging) {
      if (Math.abs(lastY - startY) > 8) {
        window.clearTimeout(pressTimer);
        pressTimer = null;
        pressedRow = null;
      }
      return;
    }

    event.preventDefault();
    if (!activeRow || !Number.isInteger(draggedIndex)) return;

    const deltaY = lastY - startY;
    activeRow.style.transform = `translateY(${deltaY}px) scale(1.01)`;

    insertIndex = computeInsertIndexFromY(lastY);
    applyHole();
  };

  const onTouchEnd = () => {
    if (isDragging && Number.isInteger(draggedIndex) && Number.isInteger(insertIndex)) {
      moveRow(state, draggedIndex, insertIndex);
      clearAll();
      onChange();
      return;
    }

    clearAll();
  };

  board.addEventListener("touchstart", onTouchStart, { passive: true });
  board.addEventListener("touchmove", onTouchMove, { passive: false });
  board.addEventListener("touchend", onTouchEnd, { passive: true });
  board.addEventListener("touchcancel", clearAll, { passive: true });
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
    wireDesktopDragAndDrop(state, refreshBoard);
    wireTouchLongPressReorder(state, refreshBoard);
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
