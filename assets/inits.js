import { fetchJSON, normalizeName, escapeHTML, renderNotFound } from "./ui.js";

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
  const rooms = await fetchJSON("./data/rooms.json");
  const input = document.getElementById("roomSearch");
  const result = document.getElementById("roomResult");
  if (!input || !result) return;

  function render(matches) {
    if (!matches.length) {
      result.innerHTML = renderNotFound("Aucun résultat pour le moment.");
      return;
    }

    result.innerHTML = matches
      .slice(0, 8)
      .map(
        (r) => `
        <div class="card" style="box-shadow:none;">
          <div class="card-inner">
            <div class="badge">🛏 ${escapeHTML(r.building)}</div>
            <h3 class="card-title" style="margin-top:10px;">${escapeHTML(r.full_name)}</h3>

            <div class="kv">
              <div class="kv-row">
                <div class="kv-key">Chambre</div>
                <div class="kv-val">${escapeHTML(r.room_name)}</div>
              </div>
              <div class="kv-row">
                <div class="kv-key">Infos</div>
                <div class="kv-val">${escapeHTML(r.notes || "—")}</div>
              </div>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  }

  function search() {
    const q = normalizeName(input.value);
    if (!q) {
      result.innerHTML = "";
      return;
    }
    const matches = rooms.filter((r) => normalizeName(r.full_name).includes(q));
    render(matches);
  }

  input.addEventListener("input", search);
}

async function initPhotos() {
  const slots = await fetchJSON("./data/photo_slots.json");
  const input = document.getElementById("photoSearch");
  const result = document.getElementById("photoResult");
  if (!input || !result) return;

  function render(matches) {
    if (!matches.length) {
      result.innerHTML = renderNotFound("Aucun résultat pour le moment.");
      return;
    }

    result.innerHTML = matches
      .slice(0, 8)
      .map(
        (s) => `
        <div class="card" style="box-shadow:none;">
          <div class="card-inner">
            <div class="badge">📸 Photos de groupe</div>
            <h3 class="card-title" style="margin-top:10px;">${escapeHTML(s.full_name)}</h3>

            <div class="kv">
              <div class="kv-row">
                <div class="kv-key">Créneau</div>
                <div class="kv-val">${escapeHTML(s.slot_time)}</div>
              </div>
              <div class="kv-row">
                <div class="kv-key">Lieu</div>
                <div class="kv-val">${escapeHTML(s.location || "Lac")}</div>
              </div>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  }

  function search() {
    const q = normalizeName(input.value);
    if (!q) {
      result.innerHTML = "";
      return;
    }
    const matches = slots.filter((r) => normalizeName(r.full_name).includes(q));
    render(matches);
  }

  input.addEventListener("input", search);
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
