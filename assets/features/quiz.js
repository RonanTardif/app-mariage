import { fetchJSON, escapeHTML, renderNotFound } from "../ui.js";

function pad(n) {
  return String(n).padStart(2, "0");
}

export async function initQuiz({ loadScores, saveScores }) {
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

  let currentQuestion = 0;
  const selectedAnswers = new Array(quiz.questions.length).fill(null);

  function renderQuestion() {
    const q = quiz.questions[currentQuestion];
    if (!q) return;

    const options = q.options
      .map((opt, j) => {
        const checked = selectedAnswers[currentQuestion] === j ? "checked" : "";
        return `
          <label class="list-item" style="display:flex; gap:10px; align-items:center; cursor:pointer;">
            <input type="radio" name="current_question" value="${escapeHTML(String(j))}" ${checked} />
            <div><p class="list-title" style="margin:0;">${escapeHTML(opt)}</p></div>
          </label>
        `;
      })
      .join("");

    const isFirst = currentQuestion === 0;
    const isLast = currentQuestion === quiz.questions.length - 1;

    container.innerHTML = `
      <div class="list-item">
        <p class="small" style="margin:0 0 8px 0;">Question ${currentQuestion + 1} / ${quiz.questions.length}</p>
        <p class="list-title">${escapeHTML(q.question)}</p>
        <div class="list" style="margin-top:10px;">${options}</div>
        <div style="display:flex; gap:10px; margin-top:12px;">
          <button type="button" id="prevQuestion" class="badge" ${isFirst ? "disabled" : ""}>← Précédente</button>
          <button type="button" id="nextQuestion" class="badge" ${isLast ? "disabled" : ""}>Suivante →</button>
        </div>
      </div>
    `;

    const radios = container.querySelectorAll('input[name="current_question"]');
    radios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        selectedAnswers[currentQuestion] = Number(e.target.value);
      });
    });

    const prev = document.getElementById("prevQuestion");
    const next = document.getElementById("nextQuestion");

    prev?.addEventListener("click", () => {
      if (currentQuestion === 0) return;
      currentQuestion -= 1;
      renderQuestion();
    });

    next?.addEventListener("click", () => {
      if (currentQuestion >= quiz.questions.length - 1) return;
      currentQuestion += 1;
      renderQuestion();
    });
  }

  renderQuestion();

  submit.addEventListener("click", () => {
    const player = (nameInput.value || "").trim();
    if (!player) {
      out.innerHTML = `
        <div class="card" style="box-shadow:none;">
          <div class="card-inner">
            <h3 class="card-title">Pseudo manquant</h3>
            <p class="card-subtitle">Entre ton prénom ou pseudo dans le champ au-dessus avant de valider.</p>
          </div>
        </div>
      `;
      nameInput.focus();
      return;
    }

    let score = 0;
    let answered = 0;

    quiz.questions.forEach((q, idx) => {
      const chosen = selectedAnswers[idx];
      if (chosen === null) return;
      answered += 1;
      if (Number(chosen) === Number(q.answer_index)) score += 1;
    });

    const total = quiz.questions.length;
    const now = new Date();
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
