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

function renderResultCards(matches) {
  return matches
    .slice(0, 8)
    .map((r) => {
      const rows = [];

      if (isNonEmpty(r.building)) rows.push(line("Bâtiment", r.building));
      if (isNonEmpty(r.room_name)) rows.push(line("Chambre", r.room_name));
      if (isNonEmpty(r.notes)) rows.push(line("Infos", r.notes));

      if (isNonEmpty(r.bed_type)) rows.push(line("Lit", r.bed_type));
      if (isNonEmpty(r.capacity)) rows.push(line("Capacité", r.capacity));
      if (isNonEmpty(r.bathroom)) rows.push(line("Salle de bain", r.bathroom));
      if (isNonEmpty(r.extra)) rows.push(line("Extra", r.extra));

      return `
        <div class="card" style="box-shadow:none;">
          <div class="card-inner">
            <div class="badge">🛏 ${escapeHTML(r.building || "Chambre")}</div>
            <h3 class="card-title" style="margin-top:10px;">${escapeHTML(r.display_name || r.person_id || "—")}</h3>

            <div class="kv">
              ${rows.join("") || `<div class="small">Aucune info disponible.</div>`}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function prepareRoomIndex(rooms) {
  return rooms.map((room) => ({
    room,
    searchName: normalizeName(room.display_name || ""),
    searchPersonId: normalizeName(room.person_id || ""),
  }));
}

export async function initChambre() {
  const input = document.getElementById("roomSearch");
  const result = document.getElementById("roomResult");
  if (!input || !result) return;

  const cachedPayload = getCachedRoomsData();
  let rooms = Array.isArray(cachedPayload?.rooms) ? cachedPayload.rooms : [];
  let roomIndex = prepareRoomIndex(rooms);

  try {
    const payload = await fetchRoomsData();
    rooms = Array.isArray(payload?.rooms) ? payload.rooms : [];
    roomIndex = prepareRoomIndex(rooms);
  } catch (e) {
    if (!rooms.length) {
      result.innerHTML = renderNotFound(`Impossible de charger les chambres. ${String(e?.message || e)}`);
      return;
    }
  }

  function render(matches) {
    if (!matches.length) {
      result.innerHTML = renderNotFound("Aucun résultat pour le moment.");
      return;
    }

    result.innerHTML = renderResultCards(matches);
  }

  function search() {
    const q = normalizeName(input.value);
    if (!q) {
      result.innerHTML = "";
      return;
    }

    const matches = roomIndex
      .filter((item) => item.searchName.includes(q) || item.searchPersonId.includes(q))
      .map((item) => item.room);

    render(matches);
  }

  input.addEventListener("input", search);
}
