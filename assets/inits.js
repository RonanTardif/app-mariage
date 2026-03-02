import { fetchJSON, normalizeName, escapeHTML, renderNotFound } from "./ui.js";
import { fetchJSONP } from "./jsonp.js"; // <-- AJOUTE CET IMPORT en haut de inits.js

const STORAGE_KEY = "mariage_quiz_scores_v1";

// 🔧 Mets ton vrai lien WhatsApp ici
const WHATSAPP_LINK = "https://wa.me/"; // ou lien d'invitation de groupe/canal

function loadScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveScores(scores) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

async function initPlan() {
  const places = await fetchJSON("./data/places.json");
  const container = document.getElementById("placesList");
  if (!container) return;

  container.innerHTML = places
    .map((p) => {
      const extra = p.links?.length
        ? `<div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
            ${p.links
              .map((l) => `<a class="badge" href="${escapeHTML(l.href)}">${escapeHTML(l.label)}</a>`)
              .join("")}
          </div>`
        : "";

      return `
        <div class="list-item">
          <p class="list-title">${escapeHTML(p.title)}</p>
          <p class="list-text">${escapeHTML(p.description)}</p>
          ${extra}
        </div>
      `;
    })
    .join("");
}

async function initChambre() {
  const ROOMS_API =
    "https://script.google.com/macros/s/AKfycbwZopPyM1mSWliuEMVI0D24v1GCHqSYEmcmeaJTMwQ9MmxxML4Hxwi63d2UDK06Xsu9uw/exec?path=rooms";
  

  const input = document.getElementById("roomSearch");
  const result = document.getElementById("roomResult");
  if (!input || !result) return;

  let rooms = [];
  try {
    const payload = await fetchJSONP(ROOMS_API);
    rooms = Array.isArray(payload?.rooms) ? payload.rooms : [];
  } catch (e) {
    result.innerHTML = renderNotFound(`Impossible de charger les chambres. ${String(e?.message || e)}`);
    return;
  }

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

  function render(matches) {
    if (!matches.length) {
      result.innerHTML = renderNotFound("Aucun résultat pour le moment.");
      return;
    }

    result.innerHTML = matches
      .slice(0, 8)
      .map((r) => {
        const rows = [];

        // Toujours afficher ces champs (si présents)
        if (isNonEmpty(r.building)) rows.push(line("Bâtiment", r.building));
        if (isNonEmpty(r.room_name)) rows.push(line("Chambre", r.room_name));
        if (isNonEmpty(r.notes)) rows.push(line("Infos", r.notes));

        // Optionnels : afficher seulement si non vides
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

  function search() {
    const q = normalizeName(input.value);
    if (!q) {
      result.innerHTML = "";
      return;
    }

    const matches = rooms.filter((r) => {
      const name = normalizeName(r.display_name || "");
      const pid = normalizeName(r.person_id || "");
      return name.includes(q) || pid.includes(q);
    });

    render(matches);
  }

  input.addEventListener("input", search);
}

async function initPhotos() {
  // Mets ton URL Apps Script ici
  const API_URL =
    "https://script.google.com/macros/s/AKfycbwZopPyM1mSWliuEMVI0D24v1GCHqSYEmcmeaJTMwQ9MmxxML4Hxwi63d2UDK06Xsu9uw/exec/exec?path=data";


  const REFRESH_MS = 15000;

  // ====== STATE ======
  let DATA = null;
  let selectedPersonId = null;
  let refreshTimer = null;

  // ====== DOM ======
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

  // Stop refresh when leaving the page
  const stopOnRouteChange = () => stopAutoRefresh();
  window.addEventListener("hashchange", stopOnRouteChange, { once: true });

  // ====== HELPERS ======
  function nowHHMM() {
    const d = new Date();
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  function setStatus(msg) {
    statusLineEl.textContent = msg;
  }

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
    // compatible: "G01;G02" ou "G01 G02" ou "G01,G02"
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
      // affiche HH:MM si possible
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

  // ====== RENDER ======
  function renderResults(query) {
    resultsEl.innerHTML = "";

    const q = normalizeName(query);
    if (!q || q.length < 2) {
      resultsEl.style.display = "none";
      return;
    }

    resultsEl.style.display = "grid";

    const index = buildIndex(DATA);

    const matches = (DATA.people || [])
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
    if (!DATA || !selectedPersonId) return;

    const person = (DATA.people || []).find((p) => String(p.person_id) === String(selectedPersonId));
    if (!person) return;

    const index = buildIndex(DATA);
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

  // ====== DATA FETCH ======
  async function fetchData() {
    if (!API_URL) {
      setStatus("⚠️ API_URL manquant");
      return;
    }

    try {
      setStatus("🔄 Chargement des données…");

     const data = await fetchJSONP(API_URL);

      if (!data.people || !data.groups || !data.slots) {
        throw new Error("JSON incomplet: people/groups/slots manquants");
      }

      DATA = data;

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

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = setInterval(fetchData, REFRESH_MS);
  }

  function stopAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = null;
  }

  // ====== EVENTS ======
  searchEl.addEventListener("input", (e) => {
    if (!DATA) return;
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

  // ====== INIT ======
  await fetchData();
  startAutoRefresh();
}

async function initQuiz() {
  const quiz = await fetchJSON("./data/quiz.json");
  const container = document.getElementById("quizContainer");
  const nameInput = document.getElementById("playerName");
  const submit = document.getElementById("submitQuiz");
  const out = document.getElementById("quizResult");
  if (!container || !nameInput || !submit || !out) return;

  if (!quiz?.questions?.length) {
    container.innerHTML = renderNotFound("Quiz non configuré.");
    return;
  }

  container.innerHTML = quiz.questions
    .map((q, idx) => {
      const options = q.options
        .map(
          (opt, j) => `
          <label class="list-item" style="display:flex; gap:10px; align-items:center; cursor:pointer;">
            <input type="radio" name="q_${idx}" value="${escapeHTML(String(j))}" />
            <div><p class="list-title" style="margin:0;">${escapeHTML(opt)}</p></div>
          </label>
        `
        )
        .join("");

      return `
        <div class="list-item">
          <p class="list-title">${idx + 1}. ${escapeHTML(q.question)}</p>
          <div class="list" style="margin-top:10px;">${options}</div>
        </div>
      `;
    })
    .join("");

  submit.addEventListener("click", () => {
    const player = (nameInput.value || "").trim();
    if (!player) {
      out.innerHTML = `
        <div class="card" style="box-shadow:none;">
          <div class="card-inner">
            <h3 class="card-title">Pseudo manquant</h3>
            <p class="card-subtitle">Renseigne ton prénom/pseudo avant de valider.</p>
          </div>
        </div>
      `;
      return;
    }

    let score = 0;
    let answered = 0;

    quiz.questions.forEach((q, idx) => {
      const chosen = document.querySelector(`input[name="q_${idx}"]:checked`);
      if (!chosen) return;
      answered += 1;
      if (Number(chosen.value) === Number(q.answer_index)) score += 1;
    });

    const total = quiz.questions.length;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const ts = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const scores = loadScores();
    scores.push({
      player,
      score,
      total,
      answered,
      time: ts,
      created_at: now.toISOString(),
    });
    saveScores(scores);

    out.innerHTML = `
      <div class="card flash" style="box-shadow:none;">
        <div class="card-inner">
          <h3 class="card-title">Score enregistré 🎉</h3>
          <p class="card-subtitle"><b>${escapeHTML(player)}</b> : ${score}/${total} (répondu: ${answered}/${total})</p>
          <div style="margin-top:10px;">
            <a class="badge" href="#/leaderboard">Voir le leaderboard</a>
          </div>
        </div>
      </div>
    `;
  });
}

function initLeaderboard() {
  const body = document.getElementById("lbBody");
  const timeEl = document.getElementById("lbTime");
  const resetBtn = document.getElementById("resetScores");
  if (!body || !timeEl) return;

  const pad = (n) => String(n).padStart(2, "0");

  function setTime() {
    const now = new Date();
    timeEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  function render() {
    setTime();

    const scores = loadScores();
    const sorted = scores
      .slice()
      .sort((a, b) => (b.score - a.score) || (new Date(b.created_at) - new Date(a.created_at)))
      .slice(0, 10);

    body.innerHTML = sorted
      .map(
        (s, i) => `
        <tr>
          <td><b>${i + 1}</b></td>
          <td>${escapeHTML(s.player || "")}</td>
          <td><b>${s.score}/${s.total}</b></td>
          <td>${escapeHTML(s.time || "")}</td>
        </tr>
      `
      )
      .join("");

    const lastCount = Number(sessionStorage.getItem("lb_count") || "0");
    if (scores.length > lastCount) {
      document.querySelector(".card")?.classList.add("flash");
      setTimeout(() => document.querySelector(".card")?.classList.remove("flash"), 800);
    }
    sessionStorage.setItem("lb_count", String(scores.length));
  }

  render();
  const interval = setInterval(render, 3000);

  window.addEventListener("hashchange", () => clearInterval(interval), { once: true });
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) render();
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      saveScores([]);
      render();
    });
  }
}

function initWhatsApp() {
  const btn = document.getElementById("waBtn");
  if (!btn) return;
  btn.href = WHATSAPP_LINK;
}

export async function initPage(routePath) {
  switch (routePath) {
    case "/plan":
      return initPlan();
    case "/chambre":
      return initChambre();
    case "/photos":
      return initPhotos();
    case "/quiz":
      return initQuiz();
    case "/leaderboard":
      return initLeaderboard();
    case "/whatsapp":
      return initWhatsApp();
    default:
      return;
  }
}
