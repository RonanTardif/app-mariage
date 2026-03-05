import { QUIZ_STORAGE_KEY } from "./config.js";
import { loadJSONFromStorage, saveJSONToStorage } from "./storage.js";
import { initPlan } from "./features/plan.js";
import { initChambre } from "./features/chambre.js";
import { initPhotos } from "./features/photos.js";
import { initQuiz } from "./features/quiz.js";
import { initLeaderboard } from "./features/leaderboard.js";
import {
  fetchLeaderboardScores,
  resetLeaderboardScores,
  submitLeaderboardScore,
} from "./features/leaderboard-api.js";
import { initWhatsApp } from "./features/whatsapp.js";
import { initAdmin } from "./features/admin.js";
import { initProgramme } from "./features/programme.js";

function loadScores() {
  return loadJSONFromStorage(QUIZ_STORAGE_KEY, []);
}

function saveScores(scores) {
  saveJSONToStorage(QUIZ_STORAGE_KEY, scores);
}

async function saveScore(scoreEntry) {
  const scores = loadScores();
  scores.push(scoreEntry);
  saveScores(scores);

  try {
    await submitLeaderboardScore(scoreEntry);
  } catch (error) {
    scores.pop();
    saveScores(scores);
    throw error;
  }
}

let cleanupCurrentPage = null;

function setCleanup(cleanup) {
  if (typeof cleanupCurrentPage === "function") {
    cleanupCurrentPage();
  }
  cleanupCurrentPage = typeof cleanup === "function" ? cleanup : null;
}

export async function initPage(routePath) {
  let cleanup;

  switch (routePath) {
    case "/programme":
      cleanup = await initProgramme();
      break;
    case "/plan":
      cleanup = await initPlan();
      break;
    case "/chambre":
      cleanup = await initChambre();
      break;
    case "/photos":
      cleanup = await initPhotos();
      break;
    case "/quiz":
      cleanup = await initQuiz({ saveScore });
      break;
    case "/leaderboard":
      cleanup = await initLeaderboard({
        fetchScores: fetchLeaderboardScores,
        resetScores: resetLeaderboardScores,
      });
      break;
    case "/whatsapp":
      cleanup = await initWhatsApp();
      break;
    case "/admin":
      cleanup = await initAdmin();
      break;
    default:
      cleanup = null;
      break;
  }

  setCleanup(cleanup);
}
