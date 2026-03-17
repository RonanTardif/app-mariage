const LS_PHOTOS      = 'mariage_gallery_proto_v1'
const LS_MY_REACTIONS = 'mariage_my_reactions_proto_v1'
const LS_MY_NAME     = 'mariage_my_name_proto_v1'
const MAX_PHOTOS     = 50

export const REACTION_EMOJIS = ['❤️', '🔥', '😂', '😍', '🥹']

/* ─── Internal helpers ───────────────────────────────────────── */
function loadPhotos() {
  try { return JSON.parse(localStorage.getItem(LS_PHOTOS) || '[]') } catch { return [] }
}
function savePhotos(photos) {
  try { localStorage.setItem(LS_PHOTOS, JSON.stringify(photos.slice(0, MAX_PHOTOS))) } catch {}
}
function emptyReactions() {
  return Object.fromEntries(REACTION_EMOJIS.map((e) => [e, 0]))
}

/* ─── Read ───────────────────────────────────────────────────── */
export async function getGalleryPhotos() {
  return loadPhotos()
    .map((p) => ({ ...p, reactions: p.reactions ?? emptyReactions() }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

/* ─── Write ──────────────────────────────────────────────────── */
export function submitPhoto(photoObj) {
  const photos = loadPhotos()
  photos.unshift({ ...photoObj, reactions: emptyReactions() })
  savePhotos(photos)
  // Save author as "my name" for the "Miennes" tab
  if (photoObj.author) saveMyName(photoObj.author)
}

/* ─── Reactions ──────────────────────────────────────────────── */
export function reactToPhoto(photo_id, emoji) {
  const photos = loadPhotos()
  const myReactions = loadMyReactions()
  const idx = photos.findIndex((p) => p.photo_id === photo_id)
  if (idx === -1) return null

  const photo = { ...photos[idx], reactions: photos[idx].reactions ?? emptyReactions() }
  const prevEmoji = myReactions[photo_id] ?? null

  if (prevEmoji === emoji) {
    // Toggle off
    photo.reactions[emoji] = Math.max(0, (photo.reactions[emoji] || 0) - 1)
    delete myReactions[photo_id]
  } else {
    // Switch from prev (if any) to new
    if (prevEmoji) photo.reactions[prevEmoji] = Math.max(0, (photo.reactions[prevEmoji] || 0) - 1)
    photo.reactions[emoji] = (photo.reactions[emoji] || 0) + 1
    myReactions[photo_id] = emoji
  }

  photos[idx] = photo
  savePhotos(photos)
  saveMyReactions(myReactions)
  return { reactions: photo.reactions, myReaction: myReactions[photo_id] ?? null }
}

export function getMyReactions() { return loadMyReactions() }

function loadMyReactions() {
  try { return JSON.parse(localStorage.getItem(LS_MY_REACTIONS) || '{}') } catch { return {} }
}
function saveMyReactions(obj) {
  try { localStorage.setItem(LS_MY_REACTIONS, JSON.stringify(obj)) } catch {}
}

/* ─── My name ────────────────────────────────────────────────── */
export function getMyName() {
  try { return localStorage.getItem(LS_MY_NAME) || '' } catch { return '' }
}
export function saveMyName(name) {
  try { localStorage.setItem(LS_MY_NAME, name) } catch {}
}

/* ─── Totals helper ──────────────────────────────────────────── */
export function totalReactions(photo) {
  if (!photo?.reactions) return 0
  return Object.values(photo.reactions).reduce((s, n) => s + n, 0)
}
