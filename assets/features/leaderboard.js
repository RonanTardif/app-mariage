import { escapeHTML } from "../ui.js";

function pad(n) {
  return String(n).padStart(2, "0");
}

function sortScores(scores) {
  return scores
    .slice()
    .sort((a, b) => (b.score - a.score) || (new Date(b.created_at) - new Date(a.created_at)))
    .slice(0, 10);
}

export function initLeaderboard({ fetchScores }) {
  const body = document.getElementById("lbBody");
  const timeEl = document.getElementById("lbTime");
  if (!body || !timeEl) return;

  let hasRenderedScores = false;

  function showStatus(message) {
    body.innerHTML = `
      <tr>
        <td colspan="4">${message}</td>
      </tr>
    `;
  }

  function setTime() {
    const now = new Date();
    timeEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  async function render() {
    setTime();

    if (!hasRenderedScores) {
      showStatus("Chargement en cours…");
    }

    let scores = [];
    try {
      scores = await fetchScores();
    } catch (_error) {
      if (hasRenderedScores) {
        return;
      }

      showStatus("Impossible de charger le leaderboard pour le moment.");
      return;
    }

    const sorted = sortScores(scores);

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
    hasRenderedScores = true;

    const lastCount = Number(sessionStorage.getItem("lb_count") || "0");
    if (scores.length > lastCount) {
      document.querySelector(".card")?.classList.add("flash");
      setTimeout(() => document.querySelector(".card")?.classList.remove("flash"), 800);
    }
    sessionStorage.setItem("lb_count", String(scores.length));
  }

  render();
  const interval = setInterval(() => {
    render();
  }, 5000);

  window.addEventListener("hashchange", () => clearInterval(interval), { once: true });
}
