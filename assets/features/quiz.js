import { fetchJSON, escapeHTML, renderNotFound } from "../ui.js";

function pad(n) {
  return String(n).padStart(2, "0");
}

function getRemark(score, total) {
  const ratio = total > 0 ? score / total : 0;

  if (ratio >= 0.9) return "Tu connais les mariés parfaitement, c'est presque suspect 😄";
  if (ratio >= 0.75) return "Très solide ! Tu fais clairement partie du premier cercle 🫶";
  if (ratio >= 0.5) return "Pas mal du tout ! Mais il reste quelques anecdotes à réviser 😉";
  if (ratio >= 0.25) return "Hmm... on sent un potentiel, mais il faut un petit rattrapage 😅";
  return "Es-tu sûr de bien connaître les mariés ? On t'aime quand même ❤️";
}

export async function initQuiz({ loadScores, saveScores }) {
  const quiz = await fetchJSON("./data/quiz.json");
  const container = document.getElementById("quizContainer");
  const finalStep = document.getElementById("finalStep");
  const nameInput = document.getElementById("playerName");
  const submit = document.getElementById("submitQuiz");
  const out = document.getElementById("quizResult");
  if (!container || !finalStep || !nameInput || !submit || !out) return;

  if (!quiz?.questions?.length) {
    container.innerHTML = renderNotFound("Quiz non configuré.");
    return;
  }

  let currentQuestion = 0;
  const selectedAnswers = new Array(quiz.questions.length).fill(null);
  let finalScore = 0;
  let finalAnswered = 0;

  function renderQuestion() {
    if (currentQuestion >= quiz.questions.length) {
      finalAnswered = selectedAnswers.filter((answer) => answer !== null).length;
      finalScore = quiz.questions.reduce((acc, q, idx) => {
        const chosen = selectedAnswers[idx];
        if (chosen === null) return acc;
        return Number(chosen) === Number(q.answer_index) ? acc + 1 : acc;
      }, 0);

      const total = quiz.questions.length;
      const remark = getRemark(finalScore, total);

      container.innerHTML = `
        <div class="list-item">
          <p class="list-title">Quiz terminé 🎉</p>
          <p class="card-subtitle" style="margin:8px 0 0 0;"><b>Ton score : ${finalScore}/${total}</b></p>
          <p class="small" style="margin:8px 0 0 0;">${escapeHTML(remark)}</p>
          <p class="small" style="margin:8px 0 0 0;">Si tu veux enregistrer ton résultat, indique ton prénom / pseudo ci-dessous.</p>
        </div>
      `;
      finalStep.style.display = "block";
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
            <p class="card-subtitle">Entre ton prénom ou pseudo avant d'envoyer.</p>
          </div>
        </div>
      `;
      nameInput.focus();
      return;
    }

    const total = quiz.questions.length;
    const now = new Date();
    const ts = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const scores = loadScores();
    scores.push({
      player,
      score: finalScore,
      total,
      answered: finalAnswered,
      time: ts,
      created_at: now.toISOString(),
    });
    saveScores(scores);

    out.innerHTML = `
      <div class="card flash" style="box-shadow:none;">
        <div class="card-inner">
          <h3 class="card-title">Résultat envoyé 🎉</h3>
          <p class="card-subtitle"><b>${escapeHTML(player)}</b> : ${finalScore}/${total}</p>
        </div>
      </div>
    `;

    submit.disabled = true;
  });
}
