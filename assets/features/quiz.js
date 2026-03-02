import { fetchJSON, escapeHTML, renderNotFound } from "../ui.js";

function pad(n) {
  return String(n).padStart(2, "0");
}

export async function initQuiz({ loadScores, saveScores }) {
  const quiz = await fetchJSON("./data/quiz.json");
  const container = document.getElementById("quizContainer");
  const nameStep = document.getElementById("playerNameStep");
  const nameInput = document.getElementById("playerName");
  const submit = document.getElementById("submitQuiz");
  const out = document.getElementById("quizResult");
  if (!container || !nameStep || !nameInput || !submit || !out) return;

  if (!quiz?.questions?.length) {
    container.innerHTML = renderNotFound("Quiz non configuré.");
    return;
  }

  let currentQuestion = 0;
  const selectedAnswers = new Array(quiz.questions.length).fill(null);

  function renderQuestion() {
    if (currentQuestion >= quiz.questions.length) {
      container.innerHTML = `
        <div class="list-item">
          <p class="list-title">Quiz terminé 🎉</p>
          <p class="small" style="margin:8px 0 0 0;">Entre ton prénom / pseudo ci-dessous, puis clique sur "Valider".</p>
        </div>
      `;
      nameStep.style.display = "flex";
      submit.disabled = false;
      nameInput.focus();
      return;
    }

    const q = quiz.questions[currentQuestion];
    const options = q.options
      .map(
        (opt, j) => `
          <label class="list-item" style="display:flex; gap:10px; align-items:center; cursor:pointer;">
            <input type="radio" name="current_question" value="${escapeHTML(String(j))}" />
            <div><p class="list-title" style="margin:0;">${escapeHTML(opt)}</p></div>
          </label>
        `
      )
      .join("");

    container.innerHTML = `
      <div class="list-item">
        <p class="small" style="margin:0 0 8px 0;">Question ${currentQuestion + 1} / ${quiz.questions.length}</p>
        <p class="list-title">${escapeHTML(q.question)}</p>
        <div class="list" style="margin-top:10px;">${options}</div>
        <p class="small" style="margin-top:10px;">Le quiz passera automatiquement à la question suivante.</p>
      </div>
    `;

    const radios = container.querySelectorAll('input[name="current_question"]');
    radios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        selectedAnswers[currentQuestion] = Number(e.target.value);
        currentQuestion += 1;
        renderQuestion();
      });
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
            <p class="card-subtitle">Entre ton prénom ou pseudo avant de valider.</p>
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

    submit.disabled = true;
  });
}
