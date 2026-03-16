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
    return Array.isArray(payload?.rooms) ? payload.rooms : payload
  } catch {
    return fetchJson('/data/rooms.json')
  }
}

export async function getPhotoSlots() {
  try {
    return await fetchJsonp(APP_CONFIG.photosApi)
  } catch {
    const rows = await fetchJson('/data/photo_slots.json')
    return {
      people: rows.map((item, index) => ({ person_id: String(index), display_name: item.full_name, group_ids: [String(index)] })),
      groups: rows.map((item, index) => ({ group_id: String(index), group_name: item.full_name })),
      slots: rows.map((item, index) => ({ group_id: String(index), eta: item.slot_time, location: item.location, status: 'pending' })),
      updated_at: new Date().toISOString(),
    }
  }
}

export async function getLeaderboard() {
  try {
    const data = await fetchJsonp(`${APP_CONFIG.leaderboardApi}&action=list`)
    return data?.scores || []
  } catch {
    return JSON.parse(localStorage.getItem('mariage_quiz_scores_v1') || '[]')
  }
}

export async function submitScore(score) {
  const stored = JSON.parse(localStorage.getItem('mariage_quiz_scores_v1') || '[]')
  stored.push(score)
  localStorage.setItem('mariage_quiz_scores_v1', JSON.stringify(stored))
}
