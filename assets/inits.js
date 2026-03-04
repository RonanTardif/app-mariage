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

export async function initPage(routePath) {
  switch (routePath) {
    case "/plan":
      return initPlan();
    case "/chambre":
      return initChambre();
    case "/photos":
      return initPhotos();
    case "/quiz":
      return initQuiz({ saveScore });
    case "/leaderboard":
      return initLeaderboard({
        fetchScores: fetchLeaderboardScores,
        resetScores: resetLeaderboardScores,
      });
    case "/whatsapp":
      return initWhatsApp();
    case "/admin":
      return initAdmin();
    default:
      return;
  }
}
