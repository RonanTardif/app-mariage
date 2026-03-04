import { LEADERBOARD_API } from "../config.js";
import { fetchJSONP } from "../jsonp.js";

function sortScores(scores) {
  return scores
    .slice()
    .sort((a, b) => (b.score - a.score) || (new Date(b.created_at) - new Date(a.created_at)));
}

function normalizeScore(raw) {
  const player = String(raw?.player || "").trim().slice(0, 40);
  const score = Number(raw?.score);
  const total = Number(raw?.total);
  const answered = Number(raw?.answered);
  const createdAt = String(raw?.created_at || new Date().toISOString());
  const time = String(raw?.time || "").trim().slice(0, 5);

  return {
    player,
    score: Number.isFinite(score) ? score : 0,
    total: Number.isFinite(total) ? total : 0,
    answered: Number.isFinite(answered) ? answered : 0,
    time,
    created_at: createdAt,
  };
}

export async function fetchLeaderboardScores() {
  const payload = await fetchJSONP(`${LEADERBOARD_API}&action=list`);
  const scores = Array.isArray(payload?.scores) ? payload.scores.map(normalizeScore) : [];
  return sortScores(scores);
}

export async function submitLeaderboardScore(scoreEntry) {
  const score = normalizeScore(scoreEntry);
  const encoded = encodeURIComponent(JSON.stringify(score));
  const payload = await fetchJSONP(`${LEADERBOARD_API}&action=submit&score=${encoded}`);

  if (!payload?.ok) {
    throw new Error(payload?.error || "Impossible d'envoyer le score.");
  }

  return payload;
}

export async function resetLeaderboardScores() {
  const payload = await fetchJSONP(`${LEADERBOARD_API}&action=reset`);
  if (!payload?.ok) {
    throw new Error(payload?.error || "Impossible de réinitialiser le leaderboard.");
  }
}
