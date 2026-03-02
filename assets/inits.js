import { QUIZ_STORAGE_KEY } from "./config.js";
import { loadJSONFromStorage, saveJSONToStorage } from "./storage.js";
import { initPlan } from "./features/plan.js";
import { initChambre } from "./features/chambre.js";
import { initPhotos } from "./features/photos.js";
import { initQuiz } from "./features/quiz.js";
import { initLeaderboard } from "./features/leaderboard.js";
import { initWhatsApp } from "./features/whatsapp.js";

function loadScores() {
  return loadJSONFromStorage(QUIZ_STORAGE_KEY, []);
}

function saveScores(scores) {
  saveJSONToStorage(QUIZ_STORAGE_KEY, scores);
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
      return initQuiz({ loadScores, saveScores });
    case "/leaderboard":
      return initLeaderboard({
        storageKey: QUIZ_STORAGE_KEY,
        loadScores,
        saveScores,
      });
    case "/whatsapp":
      return initWhatsApp();
    default:
      return;
  }
}
