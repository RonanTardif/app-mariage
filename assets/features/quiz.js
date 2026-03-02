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
