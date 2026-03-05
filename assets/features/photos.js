import { normalizeName, escapeHTML } from "../ui.js";
import { fetchPhotosData, getCachedPhotosData } from "../data-cache.js";
import { PHOTOS_REFRESH_MS } from "../config.js";

function badgeClass(status) {
  const s = (status || "").toUpperCase();
  if (s === "DONE") return "ok";
  if (s === "NOW") return "warn";
  if (s === "SKIP") return "danger";
  if (s === "REPLAN") return "warn";
  return "";
}

function statusLabel(status) {
  const s = (status || "").toUpperCase();
  if (s === "DONE") return "Fait";
  if (s === "NOW") return "En cours";
  if (s === "SKIP") return "Sauté";
  if (s === "REPLAN") return "Replanifié";
  return "À venir";
}

function buildIndex(data) {
  const groupsById = new Map();
  (data.groups || []).forEach((g) => groupsById.set(String(g.group_id), g));

  const slotsById = new Map();
  (data.slots || []).forEach((s) => slotsById.set(String(s.slot_id), s));

  return { groupsById, slotsById };
}

function personGroups(person, groupsById) {
  const ids = String(person.group_ids || "")
    .split(/[;,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return ids.map((id) => groupsById.get(id)).filter(Boolean);
}

function personSlots(person, index) {
  const groups = personGroups(person, index.groupsById);

  const slots = groups.map((g) => {
    const slot = index.slotsById.get(String(g.slot_id));
    const etaRaw = slot ? slot.eta : "";
    const m = String(etaRaw || "").match(/(\d{1,2}:\d{2})/);
    const eta = m ? m[1] : String(etaRaw || "");

    return {
      group_name: g.group_name,
      slot_id: g.slot_id,
      eta,
      location: slot ? slot.location : "",
      status: slot ? slot.status : "",
      notes: slot ? slot.notes : "",
    };
  });

  slots.sort((a, b) => (a.eta || "99:99").localeCompare(b.eta || "99:99"));
  return slots;
}

function preparePeopleIndex(dataStore, index) {
  return (dataStore.people || []).map((person) => ({
    person,
    searchText: normalizeName(person.search_text || person.display_name),
    groupsText: personGroups(person, index.groupsById)
      .map((group) => group.group_name)
      .slice(0, 2)
      .join(" • "),
  }));
}

export async function initPhotos() {
  let dataStore = null;
  let dataIndex = null;
  let peopleIndex = [];
  let selectedPersonId = null;
  let showResults = false;
  let serverUpdatedAt = "--:--";
  let refreshTimer = null;

  const searchEl = document.getElementById("search");
  const resultsEl = document.getElementById("results");
  const profileEl = document.getElementById("profile");
  const profileNameEl = document.getElementById("profileName");
  const updatedAtEl = document.getElementById("updatedAt");
  const slotsListEl = document.getElementById("slotsList");
  const statusLineEl = document.getElementById("statusLine");
  const refreshBtn = document.getElementById("refreshBtn");

  if (!searchEl || !resultsEl || !profileEl || !profileNameEl || !updatedAtEl || !slotsListEl || !statusLineEl) {
    return;
  }

  function setStatus(msg) {
    statusLineEl.textContent = msg;
  }

  function applyData(data) {
    dataStore = data;
    dataIndex = buildIndex(data);
    peopleIndex = preparePeopleIndex(data, dataIndex);
  }

  function stopAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = null;
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = setInterval(fetchData, PHOTOS_REFRESH_MS);
  }

  function renderResults(query) {
    resultsEl.innerHTML = "";

    const q = normalizeName(query);
    if (!showResults || !q || q.length < 2) {
      resultsEl.style.display = "none";
      return;
    }

    resultsEl.style.display = "grid";

    const matches = peopleIndex
      .map((entry) => ({
        ...entry,
        score: entry.searchText.includes(q) ? entry.searchText.indexOf(q) : -1,
      }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 12);

    if (matches.length === 0) {
      resultsEl.innerHTML = `
        <div class="list-item">
          <p class="list-title">Aucun résultat</p>
          <p class="list-text">Essaie avec prénom + nom.</p>
        </div>
      `;
      return;
    }

    for (const m of matches) {
      const person = m.person;

      const div = document.createElement("div");
      div.className = "list-item";
      div.style.cursor = "pointer";
      div.innerHTML = `
        <p class="list-title">${escapeHTML(person.display_name)}</p>
        <p class="list-text">${escapeHTML(m.groupsText)}</p>
      `;

      div.addEventListener("click", () => {
        selectedPersonId = person.person_id;
        searchEl.value = person.display_name;
        showResults = false;
        resultsEl.innerHTML = "";
        resultsEl.style.display = "none";
        renderProfile();
      });

      resultsEl.appendChild(div);
    }
  }

  function renderProfile() {
    if (!dataStore || !selectedPersonId || !dataIndex) {
      profileEl.style.display = "none";
      return;
    }

    const person = (dataStore.people || []).find((p) => String(p.person_id) === String(selectedPersonId));
    if (!person) {
      profileEl.style.display = "none";
      return;
    }

    const slots = personSlots(person, dataIndex);

    profileNameEl.textContent = person.display_name;
    updatedAtEl.textContent = `Mis à jour : ${serverUpdatedAt}`;

    slotsListEl.innerHTML = "";

    for (const s of slots) {
      const etaDisplay = s.eta ? s.eta : "--:--";
      const badge = statusLabel(s.status);
      const bClass = badgeClass(s.status);

      const card = document.createElement("div");
      card.className = "list-item";
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:baseline;">
          <div style="font-weight:900;">${escapeHTML(s.group_name)}</div>
          <div style="font-weight:900;">${escapeHTML(etaDisplay)}</div>
        </div>

        <div style="margin-top:8px; display:flex; gap:10px; align-items:center;">
          <span class="badge ${escapeHTML(bClass)}">${escapeHTML(badge)}</span>
          <span class="small">📍 ${escapeHTML(s.location || "Lieu à confirmer")}</span>
        </div>

        <div class="small" style="margin-top:8px;">⏱️ Sois là 5 min avant.</div>
        ${s.notes ? `<div class="small" style="margin-top:6px;">📝 ${escapeHTML(s.notes)}</div>` : ""}
      `;

      slotsListEl.appendChild(card);
    }

    profileEl.style.display = "block";
  }

  async function fetchData({ forceRefresh = false } = {}) {
    try {
      setStatus("🔄 Chargement des données…");
      const data = await fetchPhotosData({ forceRefresh });

      if (!data?.people || !data?.groups || !data?.slots) {
        throw new Error("JSON incomplet: people/groups/slots manquants");
      }

      applyData(data);

      serverUpdatedAt = data.updated_at
        ? new Date(data.updated_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : "--:--";

      setStatus("");

      const selectedPerson = (data.people || []).find((p) => String(p.person_id) === String(selectedPersonId));
      const hasLockedSelection = Boolean(selectedPerson && normalizeName(searchEl.value) === normalizeName(selectedPerson.display_name));

      if (!hasLockedSelection) {
        renderResults(searchEl.value);
      } else {
        showResults = false;
        resultsEl.innerHTML = "";
        resultsEl.style.display = "none";
      }

      renderProfile();
    } catch (err) {
      setStatus(`❌ Erreur: ${err.message || err}`);
    }
  }

  window.addEventListener("hashchange", stopAutoRefresh, { once: true });

  searchEl.addEventListener("input", (e) => {
    if (!dataStore) return;

    const query = e.target.value;
    const selectedPerson = (dataStore.people || []).find((p) => String(p.person_id) === String(selectedPersonId));

    if (!selectedPerson || normalizeName(query) !== normalizeName(selectedPerson.display_name)) {
      selectedPersonId = null;
      profileEl.style.display = "none";
      showResults = true;
    }

    renderResults(query);
  });


  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      fetchData({ forceRefresh: true });
    });
  }

  document.addEventListener("click", (e) => {
    const within = e.target === searchEl || resultsEl.contains(e.target);
    if (!within) {
      showResults = false;
      resultsEl.style.display = "none";
    }
  });

  const cachedData = getCachedPhotosData();
  if (cachedData?.people && cachedData?.groups && cachedData?.slots) {
    applyData(cachedData);
    setStatus("⚡ Données en cache chargées");
    showResults = true;
    renderResults(searchEl.value);
    renderProfile();
  }

  await fetchData();
  startAutoRefresh();
}
