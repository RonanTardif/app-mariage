import { normalizeName, escapeHTML, renderNotFound } from "../ui.js";
import { fetchRoomsData, getCachedRoomsData } from "../data-cache.js";

function isNonEmpty(v) {
  return String(v || "").trim() !== "";
}

function line(label, value) {
  return `
    <div class="kv-row">
      <div class="kv-key">${escapeHTML(label)}</div>
      <div class="kv-val">${escapeHTML(value)}</div>
    </div>
  `;
}

function personLabel(room) {
  return room.display_name || room.full_name || room.person_id || "—";
}

function normalizeRoomValue(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function roomKey(room) {
  return `${normalizeRoomValue(room.building)}::${normalizeRoomValue(room.room_name)}`;
}

function renderSearchResults(matches) {
  return `
    <div class="list">
      ${matches
        .slice(0, 8)
        .map(
          (r) => `
        <button class="btn js-room-match" type="button">
          <span class="icon sage">👤</span>
          <span class="btn-text">
            <span class="btn-title">${escapeHTML(personLabel(r))}</span>
            <span class="btn-desc">Voir ma chambre</span>
          </span>
        </button>
      `
        )
        .join("")}
    </div>
  `;
}

function metadataRows(room) {
  const rows = [];
  if (isNonEmpty(room.building)) rows.push(line("Bâtiment", room.building));
  if (isNonEmpty(room.room_name)) rows.push(line("Chambre", room.room_name));
  if (isNonEmpty(room.notes)) rows.push(line("Infos", room.notes));
  if (isNonEmpty(room.bed_type)) rows.push(line("Lit", room.bed_type));
  if (isNonEmpty(room.capacity)) rows.push(line("Capacité", room.capacity));
  if (isNonEmpty(room.bathroom)) rows.push(line("Salle de bain", room.bathroom));
  if (isNonEmpty(room.extra)) rows.push(line("Extra", room.extra));
  return rows;
}

function renderSelectedRoomCard(selectedRoom, isRoommateVisible, roommates) {
  const rows = metadataRows(selectedRoom);

  return `
    <div class="card" style="margin-top:12px; box-shadow:none;">
      <div class="card-inner">
        <div class="badge">🛏 Ma chambre</div>
        <h3 class="card-title" style="margin-top:10px;">${escapeHTML(personLabel(selectedRoom))}</h3>

        <div class="kv">
          ${rows.join("") || `<div class="small">Aucune info disponible.</div>`}
        </div>

        <button id="showRoommates" class="btn" type="button" style="margin-top:12px;">
          <span class="icon rose">👥</span>
          <span class="btn-text">
            <span class="btn-title">Afficher ma chambre</span>
            <span class="btn-desc">Voir les personnes dans la même chambre</span>
          </span>
        </button>
      </div>
    </div>
    ${
      isRoommateVisible
        ? `
      <div class="card" style="margin-top:12px; box-shadow:none;">
        <div class="card-inner">
          <div class="badge ok">👥 Colocataires</div>
          <div class="list" style="margin-top:10px;">
            ${roommates
              .map(
                (mate) => `
              <div class="list-item">
                <p class="list-title">${escapeHTML(personLabel(mate))}</p>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `
        : ""
    }
  `;
}

function prepareRoomIndex(rooms) {
  return rooms.map((room) => ({
    room,
    searchName: normalizeName(room.display_name || ""),
    searchFullName: normalizeName(room.full_name || ""),
    searchPersonId: normalizeName(room.person_id || ""),
  }));
}

export async function initChambre() {
  const input = document.getElementById("roomSearch");
  const result = document.getElementById("roomResult");
  if (!input || !result) return;

  const cachedPayload = getCachedRoomsData();
  let rooms = Array.isArray(cachedPayload?.rooms) ? cachedPayload.rooms : [];
  if (!rooms.length && Array.isArray(cachedPayload)) rooms = cachedPayload;
  let roomIndex = prepareRoomIndex(rooms);

  try {
    const payload = await fetchRoomsData();
    rooms = Array.isArray(payload?.rooms) ? payload.rooms : [];
    if (!rooms.length && Array.isArray(payload)) rooms = payload;
    roomIndex = prepareRoomIndex(rooms);
  } catch (e) {
    if (!rooms.length) {
      result.innerHTML = renderNotFound(`Impossible de charger les chambres. ${String(e?.message || e)}`);
      return;
    }
  }

  let activeMatches = [];
  let selectedRoom = null;
  let showRoommates = false;

  function roomMatchesForSelected() {
    if (!selectedRoom) return [];
    const selectedKey = roomKey(selectedRoom);
    return rooms.filter((room) => roomKey(room) === selectedKey);
  }

  function isSelectedInputLocked() {
    if (!selectedRoom) return false;
    return normalizeName(input.value) === normalizeName(personLabel(selectedRoom));
  }

  function render() {
    const q = normalizeName(input.value);
    if (!q && !selectedRoom) {
      result.innerHTML = "";
      return;
    }

    const blocks = [];
    const showResults = !selectedRoom || !isSelectedInputLocked();

    if (showResults) {
      if (!activeMatches.length) {
        blocks.push(renderNotFound("Aucun résultat pour le moment."));
      } else {
        blocks.push(renderSearchResults(activeMatches));
      }
    }

    if (selectedRoom) {
      const roommates = roomMatchesForSelected();
      blocks.push(renderSelectedRoomCard(selectedRoom, showRoommates, roommates));
    }

    result.innerHTML = blocks.join("\n");

    if (showResults && activeMatches.length) {
      result.querySelectorAll(".js-room-match").forEach((btn, index) => {
        btn.addEventListener("click", () => {
          selectedRoom = activeMatches[index];
          showRoommates = false;
          input.value = personLabel(selectedRoom);
          activeMatches = [];
          render();
        });
      });
    }

    const roommatesBtn = result.querySelector("#showRoommates");
    if (roommatesBtn) {
      roommatesBtn.addEventListener("click", () => {
        showRoommates = true;
        render();
      });
    }
  }

  function search() {
    const q = normalizeName(input.value);

    if (selectedRoom) {
      if (q === normalizeName(personLabel(selectedRoom))) {
        render();
        return;
      }
      selectedRoom = null;
      showRoommates = false;
    }

    if (!q) {
      activeMatches = [];
      render();
      return;
    }

    activeMatches = roomIndex
      .filter((item) => item.searchName.includes(q) || item.searchFullName.includes(q) || item.searchPersonId.includes(q))
      .map((item) => item.room);

    render();
  }

  input.addEventListener("input", search);
}
