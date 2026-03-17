import { APP_CONFIG } from '../utils/constants'
import { fetchJson, fetchJsonp } from './http'

export async function getPlaces() {
  return fetchJson('/data/places.json')
}

export async function getQuiz() {
  return fetchJson('/data/quiz.json')
}

export async function getRooms() {
  try {
    const payload = await fetchJsonp(APP_CONFIG.roomsApi)
    return Array.isArray(payload?.rooms) ? payload.rooms : []
  } catch {
    return fetchJson('/data/rooms.json')
  }
}

export async function getPhotoSlots() {
  try {
    const payload = await fetchJsonp(APP_CONFIG.photosApi)
    return {
      people: Array.isArray(payload?.people) ? payload.people : [],
      groups: Array.isArray(payload?.groups) ? payload.groups : [],
      slots: Array.isArray(payload?.slots) ? payload.slots : [],
    }
  } catch {
    // Fallback local — structure alignée sur le format API :
    // groups ont un slot_id, slots sont indexés par slot_id
    const rows = await fetchJson('/data/photo_slots.json')
    return {
      people: rows.map((item, i) => ({
        person_id: String(i),
        display_name: item.full_name,
        search_text: item.full_name,
        group_ids: String(i),
      })),
      groups: rows.map((item, i) => ({
        group_id: String(i),
        group_name: item.full_name,
        slot_id: String(i),
      })),
      slots: rows.map((item, i) => ({
        slot_id: String(i),
        eta: item.slot_time,
        location: item.location,
        status: 'pending',
        notes: '',
      })),
      updated_at: new Date().toISOString(),
    }
  }
}

export async function getLeaderboard() {
  try {
    const data = await fetchJsonp(`${APP_CONFIG.leaderboardApi}&action=list`)
    return Array.isArray(data?.scores) ? data.scores : []
  } catch {
    // Fallback localStorage — protégé contre un JSON corrompu
    try {
      const stored = JSON.parse(localStorage.getItem('mariage_quiz_scores_v1') || '[]')
      return Array.isArray(stored) ? stored : []
    } catch {
      return []
    }
  }
}

function normalizeScore(raw) {
  const player = String(raw?.player || '').trim().slice(0, 40)
  const score = Number(raw?.score)
  const total = Number(raw?.total)
  const answered = Number(raw?.answered)
  const time = String(raw?.time || '').trim().slice(0, 5)
  const createdAt = String(raw?.created_at || new Date().toISOString())
  return {
    player,
    score: Number.isFinite(score) ? score : 0,
    total: Number.isFinite(total) ? total : 0,
    answered: Number.isFinite(answered) ? answered : 0,
    time,
    created_at: createdAt,
  }
}

export async function submitScore(scoreEntry) {
  const score = normalizeScore(scoreEntry)

  // Sauvegarde locale immédiate
  try {
    const stored = JSON.parse(localStorage.getItem('mariage_quiz_scores_v1') || '[]')
    stored.push(score)
    localStorage.setItem('mariage_quiz_scores_v1', JSON.stringify(stored))
  } catch {
    // localStorage indisponible, on continue
  }

  // Envoi à l'API
  const encoded = encodeURIComponent(JSON.stringify(score))
  const payload = await fetchJsonp(`${APP_CONFIG.leaderboardApi}&action=submit&score=${encoded}`)
  if (!payload?.ok) {
    throw new Error(payload?.error || "Impossible d'envoyer le score.")
  }
  return payload
}
