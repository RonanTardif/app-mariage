import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { REACTION_EMOJIS } from '../../services/galleryService'

/* ─── Floating heart animation on double-tap ─────────────────── */
function FloatingHeart({ pos }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 1, y: 0 }}
      animate={{ scale: 2, opacity: 0, y: -80 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      style={{ position: 'absolute', left: pos.x - 20, top: pos.y - 20, pointerEvents: 'none', zIndex: 10 }}
      className="text-4xl select-none"
    >
      ❤️
    </motion.div>
  )
}

/* ─── Reaction bar ───────────────────────────────────────────── */
function ReactionBar({ photo, myReaction, reactionCounts, onReact }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {REACTION_EMOJIS.map((emoji) => {
        const count = reactionCounts[emoji] || 0
        const active = myReaction === emoji
        return (
          <motion.button
            key={emoji}
            whileTap={{ scale: 0.85 }}
            onClick={() => onReact(photo, emoji)}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? 'bg-white text-stone-900 shadow-sm'
                : count > 0
                ? 'bg-white/15 text-white'
                : 'bg-white/8 text-white/50 hover:bg-white/15 hover:text-white'
            }`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="text-xs tabular-nums">{count}</span>}
          </motion.button>
        )
      })}
    </div>
  )
}

/* ─── Main Lightbox ──────────────────────────────────────────── */
export function Lightbox({ photos, index, onClose, onPrev, onNext, getReactionCounts, getMyReaction, handleReact }) {
  const photo = photos[index]
  const touchStartX = useRef(null)
  const lastTapRef = useRef(0)
  const imgRef = useRef(null)
  const [heartPos, setHeartPos] = useState(null)

  /* keyboard nav */
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  /* lock scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  /* swipe */
  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) { delta > 0 ? onPrev() : onNext() }
    touchStartX.current = null
  }

  /* double-tap to ❤️ */
  function handleImageTap(e) {
    const now = Date.now()
    if (now - lastTapRef.current < 320) {
      const rect = imgRef.current?.getBoundingClientRect()
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0
      setHeartPos({ x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) })
      handleReact(photo, '❤️')
      setTimeout(() => setHeartPos(null), 800)
    }
    lastTapRef.current = now
  }

  if (!photo) return null

  const reactionCounts = getReactionCounts(photo)
  const myReaction = getMyReaction(photo.photo_id)
  const hasPrev = index > 0
  const hasNext = index < photos.length - 1

  return (
    <>
      {/* Dark overlay — fades separately from image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 bg-black/95"
      />

      {/* Content layer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <span className="text-xs text-white/40 tabular-nums">{index + 1} / {photos.length}</span>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Image — shared layout element */}
        <div className="flex-1 flex items-center justify-center px-4 min-h-0 relative">
          <AnimatePresence mode="wait">
            <div key={photo.photo_id} ref={imgRef} className="relative"
              onClick={handleImageTap} onTouchEnd={handleImageTap}
            >
              <motion.img
                layoutId={`photo-${photo.photo_id}`}
                src={photo.image_url}
                alt={photo.caption || photo.author}
                className="max-h-[68vh] max-w-full rounded-2xl object-contain select-none"
                draggable={false}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
              {/* Floating heart on double-tap */}
              <AnimatePresence>
                {heartPos && <FloatingHeart key={heartPos.x + heartPos.y} pos={heartPos} />}
              </AnimatePresence>
            </div>
          </AnimatePresence>

          {/* Prev / Next */}
          {hasPrev && (
            <button onClick={onPrev}
              className="absolute left-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
              <ChevronLeft size={22} />
            </button>
          )}
          {hasNext && (
            <button onClick={onNext}
              className="absolute right-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
              <ChevronRight size={22} />
            </button>
          )}
        </div>

        {/* Bottom info + reactions */}
        <div className="shrink-0 px-5 py-4 space-y-3">
          <div>
            <p className="font-semibold text-white">{photo.author}</p>
            {photo.caption && (
              <p className="mt-0.5 text-sm text-white/55 line-clamp-2">{photo.caption}</p>
            )}
          </div>
          <ReactionBar
            photo={photo}
            myReaction={myReaction}
            reactionCounts={reactionCounts}
            onReact={handleReact}
          />
        </div>
      </motion.div>
    </>
  )
}
