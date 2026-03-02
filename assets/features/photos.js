import { normalizeName, escapeHTML } from "../ui.js";
import { fetchJSONP } from "../jsonp.js";
import { PHOTOS_API, PHOTOS_REFRESH_MS } from "../config.js";

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

function nowHHMM() {
  const d = new Date();
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export async function initPhotos() {
  let dataStore = null;
  let selectedPersonId = null;
  let refreshTimer = null;

  const searchEl = document.getElementById("search");
  const resultsEl = document.getElementById("results");
  const profileEl = document.getElementById("profile");
  const profileNameEl = document.getElementById("profileName");
  const updatedAtEl = document.getElementById("updatedAt");
  const slotsListEl = document.getElementById("slotsList");
  const statusLineEl = document.getElementById("statusLine");
  const clearBtn = document.getElementById("clearBtn");
  const refreshBtn = document.getElementById("refreshBtn");

  if (!searchEl || !resultsEl || !profileEl || !profileNameEl || !updatedAtEl || !slotsListEl || !statusLineEl) {
    return;
  }

  function setStatus(msg) {
    statusLineEl.textContent = msg;
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
    if (!q || q.length < 2) {
      resultsEl.style.display = "none";
      return;
    }

    resultsEl.style.display = "grid";

    const index = buildIndex(dataStore);

    const matches = (dataStore.people || [])
      .map((p) => {
        const st = normalizeName(p.search_text || p.display_name);
        return { p, score: st.includes(q) ? st.indexOf(q) : -1 };
      })
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
      const p = m.p;
      const groups = personGroups(p, index.groupsById).map((g) => g.group_name).slice(0, 2);
      const groupsText = groups.length ? groups.join(" • ") : "";

      const div = document.createElement("div");
      div.className = "list-item";
      div.style.cursor = "pointer";
      div.innerHTML = `
        <p class="list-title">${escapeHTML(p.display_name)}</p>
        <p class="list-text">${escapeHTML(groupsText)}</p>
      `;

      div.addEventListener("click", () => {
        selectedPersonId = p.person_id;
        searchEl.value = p.display_name;
        resultsEl.style.display = "none";
        renderProfile();
      });

      resultsEl.appendChild(div);
    }
  }

  function renderProfile() {
    if (!dataStore || !selectedPersonId) return;

    const person = (dataStore.people || []).find((p) => String(p.person_id) === String(selectedPersonId));
    if (!person) return;

    const index = buildIndex(dataStore);
    const slots = personSlots(person, index);

    profileNameEl.textContent = person.display_name;
    updatedAtEl.textContent = `Mis à jour : ${nowHHMM()}`;

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

  async function fetchData() {
    if (!PHOTOS_API) {
      setStatus("⚠️ API_URL manquant");
      return;
    }

    try {
      setStatus("🔄 Chargement des données…");
      const data = await fetchJSONP(PHOTOS_API);

      if (!data.people || !data.groups || !data.slots) {
        throw new Error("JSON incomplet: people/groups/slots manquants");
      }

      dataStore = data;

      const serverTime = data.updated_at
        ? new Date(data.updated_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : "--:--";

      setStatus(`✅ Données OK (maj serveur: ${serverTime})`);

      renderResults(searchEl.value);
      renderProfile();
    } catch (err) {
      setStatus(`❌ Erreur: ${err.message || err}`);
    }
  }

  window.addEventListener("hashchange", stopAutoRefresh, { once: true });

  searchEl.addEventListener("input", (e) => {
    if (!dataStore) return;
    renderResults(e.target.value);
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchEl.value = "";
      resultsEl.innerHTML = "";
      resultsEl.style.display = "none";
      selectedPersonId = null;
      profileEl.style.display = "none";
      setStatus("Prêt.");
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      fetchData();
    });
  }

  document.addEventListener("click", (e) => {
    const within = e.target === searchEl || resultsEl.contains(e.target);
    if (!within) resultsEl.style.display = "none";
  });

  await fetchData();
  startAutoRefresh();
}
