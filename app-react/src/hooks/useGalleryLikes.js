import { useState, useCallback } from 'react'
import { reactToPhoto, getMyReactions, totalReactions } from '../services/galleryService'

export function useGalleryLikes() {
  const [myReactions, setMyReactions] = useState(getMyReactions)
  // { [photo_id]: { '❤️': N, '🔥': N, ... } }
  const [reactionOverrides, setReactionOverrides] = useState({})

  const handleReact = useCallback((photo, emoji) => {
    const result = reactToPhoto(photo.photo_id, emoji)
    if (!result) return
    setMyReactions((prev) => ({ ...prev, [photo.photo_id]: result.myReaction }))
    setReactionOverrides((prev) => ({ ...prev, [photo.photo_id]: result.reactions }))
  }, [])

  function getReactionCounts(photo) {
    return reactionOverrides[photo.photo_id] ?? photo.reactions ?? {}
  }

  function getMyReaction(photo_id) {
    return myReactions[photo_id] ?? null
  }

  function getTotal(photo) {
    const counts = getReactionCounts(photo)
    return Object.values(counts).reduce((s, n) => s + n, 0)
  }

  // Kept for backward compat (Lightbox still checks isLiked / getDisplayCount)
  function isLiked(photo_id) { return !!myReactions[photo_id] }
  function getDisplayCount(photo) { return getTotal(photo) }

  return { handleReact, getReactionCounts, getMyReaction, getTotal, isLiked, getDisplayCount }
}
