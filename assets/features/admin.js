import { loadJSONFromStorage, saveJSONToStorage } from "../storage.js";
import { escapeHTML } from "../ui.js";

const ADMIN_STATE_KEY = "mariage_admin_state_v1";

const DEFAULT_STATE = {
  delayMinutes: 8,
  photoStart: "2026-06-20T16:00",
  slots: [
    { id: "s1", time: "16:00", groups: ["Famille mariée", "Témoins"] },
    { id: "s2", time: "16:20", groups: ["Famille mariée + marié", "Fratrie"] },
    { id: "s3", time: "16:40", groups: ["Famille mariée + mariée", "Amis proches"] },
    { id: "s4", time: "17:00", groups: ["Cousins", "Collègues"] },
  ],
};

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function getState() {
  return loadJSONFromStorage(ADMIN_STATE_KEY, cloneDefaultState());
}

function setState(next) {
  saveJSONToStorage(ADMIN_STATE_KEY, next);
}

function renderSlots(state) {
  const board = document.getElementById("slotsBoard");
  if (!board) return;

  board.innerHTML = state.slots
    .map((slot) => `
      <section class="admin-slot" data-slot-id="${escapeHTML(slot.id)}">
        <div class="admin-slot-title">${escapeHTML(slot.time)}</div>
        <div class="admin-groups" data-drop-slot="${escapeHTML(slot.id)}">
          ${slot.groups
            .map(
              (group, index) => `
              <button
                type="button"
                class="admin-group-item"
                draggable="true"
                data-group-index="${index}"
                data-slot-id="${escapeHTML(slot.id)}"
              >
                ☰ ${escapeHTML(group)}
              </button>
            `,
            )
            .join("")}
        </div>
      </section>
    `)
    .join("");
}

function moveGroup(state, fromSlotId, groupIndex, toSlotId) {
  if (fromSlotId === toSlotId) return state;

  const fromSlot = state.slots.find((slot) => slot.id === fromSlotId);
  const toSlot = state.slots.find((slot) => slot.id === toSlotId);
  if (!fromSlot || !toSlot) return state;

  const idx = Number(groupIndex);
  if (!Number.isInteger(idx) || idx < 0 || idx >= fromSlot.groups.length) return state;

  const [moved] = fromSlot.groups.splice(idx, 1);
  if (moved) toSlot.groups.push(moved);
  return state;
}

function wireDragAndDrop(state, onChange) {
  let payload = null;

  document.querySelectorAll(".admin-group-item").forEach((node) => {
    node.addEventListener("dragstart", (event) => {
      payload = {
        fromSlotId: node.dataset.slotId,
        groupIndex: node.dataset.groupIndex,
      };
      event.dataTransfer?.setData("text/plain", "dragging");
      node.classList.add("dragging");
    });

    node.addEventListener("dragend", () => {
      payload = null;
      node.classList.remove("dragging");
    });
  });

  document.querySelectorAll("[data-drop-slot]").forEach((zone) => {
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("is-drop-target");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("is-drop-target");
    });

    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("is-drop-target");
      if (!payload) return;
      moveGroup(state, payload.fromSlotId, payload.groupIndex, zone.dataset.dropSlot);
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
      `Google Sheet simulé mis à jour · retard ${state.delayMinutes} min · début photos ${state.photoStart}`,
      "ok",
    );
  }, 500);
}

export function initAdmin() {
  const state = getState();

  const delayInput = document.getElementById("delayInput");
  const photoStartInput = document.getElementById("photoStartInput");
  const saveBtn = document.getElementById("saveSettingsBtn");
  const resetBtn = document.getElementById("resetSettingsBtn");

  if (!delayInput || !photoStartInput || !saveBtn || !resetBtn) return;

  delayInput.value = String(state.delayMinutes);
  photoStartInput.value = state.photoStart;

  const refreshBoard = () => {
    renderSlots(state);
    setState(state);
    wireDragAndDrop(state, refreshBoard);
  };

  refreshBoard();

  saveBtn.addEventListener("click", () => {
    state.delayMinutes = Math.max(0, Number(delayInput.value) || 0);
    state.photoStart = photoStartInput.value || DEFAULT_STATE.photoStart;
    setState(state);
    simulateSheetSync(state);
  });

  resetBtn.addEventListener("click", () => {
    const reset = cloneDefaultState();
    state.delayMinutes = reset.delayMinutes;
    state.photoStart = reset.photoStart;
    state.slots = reset.slots;
    delayInput.value = String(state.delayMinutes);
    photoStartInput.value = state.photoStart;
    refreshBoard();
    setStatus("Données synthétiques restaurées.", "ok");
  });
}
