import { loadJSONFromStorage, saveJSONToStorage } from "../storage.js";
import { escapeHTML } from "../ui.js";

const ADMIN_STATE_KEY = "mariage_admin_state_v3";

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

  board.innerHTML = state.groups
    .map(
      (group, index) => `
        <div
          class="admin-schedule-row ${group.done ? "is-done" : ""}"
          draggable="true"
          data-row-index="${index}"
        >
          <span class="admin-schedule-time">${escapeHTML(getPassageTime(state, index))}</span>
          <span class="admin-schedule-group">${escapeHTML(group.name)}</span>
          <button
            type="button"
            class="admin-done-btn ${group.done ? "is-done" : ""}" aria-label="Marquer le groupe comme fait"
            data-done-index="${index}"
          >
            ${group.done ? "✅ Done" : "Done"}
          </button>
          <span class="admin-schedule-drag">☰</span>
        </div>
      `,
    )
    .join("");
}

function moveRow(state, fromIndex, toIndex) {
  const start = Number(fromIndex);
  const end = Number(toIndex);
  if (!Number.isInteger(start) || !Number.isInteger(end)) return;
  if (start === end || start < 0 || end < 0) return;
  if (start >= state.groups.length || end >= state.groups.length) return;

  const [moved] = state.groups.splice(start, 1);
  state.groups.splice(end, 0, moved);
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

  document.querySelectorAll(".admin-schedule-row").forEach((node) => {
    node.addEventListener("dragstart", (event) => {
      draggedIndex = node.dataset.rowIndex;
      event.dataTransfer?.setData("text/plain", "dragging");
      node.classList.add("dragging");
    });

    node.addEventListener("dragend", () => {
      draggedIndex = null;
      node.classList.remove("dragging");
    });

    node.addEventListener("dragover", (event) => {
      event.preventDefault();
      node.classList.add("is-drop-target");
    });

    node.addEventListener("dragleave", () => {
      node.classList.remove("is-drop-target");
    });

    node.addEventListener("drop", (event) => {
      event.preventDefault();
      node.classList.remove("is-drop-target");
      if (draggedIndex == null) return;
      moveRow(state, draggedIndex, node.dataset.rowIndex);
      onChange();
    });
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
