import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Images, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAsyncData } from '../hooks/useAsyncData'
import { useGalleryLikes } from '../hooks/useGalleryLikes'
import { getGalleryPhotos, getMyName, totalReactions, REACTION_EMOJIS } from '../services/galleryService'
import { Lightbox } from '../components/shared/Lightbox'
import { LoadingState } from '../components/shared/LoadingState'

/* ─── Tabs ───────────────────────────────────────────────────── */
const TABS = [
  { id: 'all',  label: 'Toutes' },
  { id: 'mine', label: 'Miennes' },
  { id: 'top',  label: 'Top ❤️' },
]

function TabBar({ active, onChange }) {
  return (
    <div className="flex gap-1 rounded-2xl bg-stone-100 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
            active === tab.id ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          {active === tab.id && (
            <motion.div layoutId="tab-pill"
              className="absolute inset-0 rounded-xl bg-white shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ─── New photos badge ───────────────────────────────────────── */
function NewPhotosBadge({ count, onRefresh }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      onClick={onRefresh}
      className="flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-lg mx-auto"
    >
      <span className="flex h-2 w-2 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
      </span>
      {count} nouvelle{count > 1 ? 's' : ''} photo{count > 1 ? 's' : ''} · Voir
    </motion.button>
  )
}

/* ─── Hero photo ─────────────────────────────────────────────── */
function HeroPhoto({ photo, reactionCounts, myReaction, onClick }) {
  const topReactions = REACTION_EMOJIS
    .map((e) => ({ e, n: reactionCounts[e] || 0 }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 3)

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-3xl aspect-[4/3] bg-stone-200 active:scale-[0.99] transition-transform"
    >
      <motion.img
        layoutId={`photo-${photo.photo_id}`}
        src={photo.thumb_url}
        alt={photo.caption || photo.author}
        className="h-full w-full object-cover"
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      {/* Bottom info */}
      <div className="absolute bottom-0 inset-x-0 px-4 py-3 flex items-end justify-between">
        <div className="text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-0.5">À l'instant</p>
          <p className="font-bold text-white text-lg leading-tight">{photo.author}</p>
          {photo.caption && <p className="text-sm text-white/70 mt-0.5 line-clamp-1">{photo.caption}</p>}
        </div>
        {topReactions.length > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm">
            {topReactions.map((r) => (
              <span key={r.e} className="text-base">{r.e}</span>
            ))}
            <span className="ml-1 text-xs font-bold text-white">
              {topReactions.reduce((s, r) => s + r.n, 0)}
            </span>
          </div>
        )}
      </div>
    </motion.button>
  )
}

/* ─── Masonry photo card ─────────────────────────────────────── */
function PhotoCard({ photo, globalIndex, myReaction, reactionTotal, onClick }) {
  const topEmoji = REACTION_EMOJIS
    .map((e) => ({ e, n: (photo.reactions?.[e] || 0) }))
    .sort((a, b) => b.n - a.n)[0]

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: globalIndex * 0.03, duration: 0.25 }}
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-2xl bg-stone-100 active:scale-[0.97] transition-transform"
    >
      <motion.img
        layoutId={`photo-${photo.photo_id}`}
        src={photo.thumb_url}
        alt={photo.caption || photo.author}
        className="w-full h-auto block"
        loading="lazy"
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      />
      {/* Bottom overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent px-2.5 pb-2 pt-8">
        <p className="text-xs font-semibold text-white truncate">{photo.author}</p>
      </div>
      {/* Reaction badge */}
      {reactionTotal > 0 && (
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
          <span>{myReaction ?? topEmoji?.e ?? '❤️'}</span>
          <span>{reactionTotal}</span>
        </div>
      )}
    </motion.button>
  )
}

/* ─── Empty state ────────────────────────────────────────────── */
function EmptyState({ tab, onShare }) {
  const msgs = {
    all:  { title: "Aucune photo pour l'instant", sub: 'Soyez les premiers à partager un souvenir !' },
    mine: { title: "Tu n'as pas encore partagé de photo", sub: 'Prends le premier souvenir !' },
    top:  { title: "Aucune réaction pour l'instant", sub: 'Partagez et réagissez aux photos !' },
  }
  const { title, sub } = msgs[tab] || msgs.all
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 py-20 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
        <Images size={32} className="text-stone-300" />
      </div>
      <div>
        <p className="font-semibold text-stone-600">{title}</p>
        <p className="mt-1 text-sm text-stone-400">{sub}</p>
      </div>
      <button onClick={onShare}
        className="flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 transition-colors">
        <Camera size={16} />Partager une photo
      </button>
    </motion.div>
  )
}

/* ─── Main page ──────────────────────────────────────────────── */
export function AlbumPage() {
  const navigate = useNavigate()
  const { data, loading, refetch } = useAsyncData(getGalleryPhotos, [])
  const allPhotos = data || []
  const [tab, setTab] = useState('all')
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [newCount, setNewCount] = useState(0)
  const knownCountRef = useRef(0)
  const { handleReact, getReactionCounts, getMyReaction, getTotal } = useGalleryLikes()
  const myName = getMyName()

  /* ── Polling for new photos (30s) ── */
  useEffect(() => {
    if (!loading) knownCountRef.current = allPhotos.length
  }, [loading, allPhotos.length])

  useEffect(() => {
    const id = setInterval(async () => {
      const fresh = await getGalleryPhotos()
      const diff = fresh.length - knownCountRef.current
      if (diff > 0) setNewCount(diff)
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  function handleRefresh() {
    refetch()
    setNewCount(0)
    knownCountRef.current = allPhotos.length
  }

  /* ── Filtered + sorted photos ── */
  const filteredPhotos = (() => {
    if (tab === 'mine') return allPhotos.filter((p) => p.author === myName)
    if (tab === 'top')  return [...allPhotos].sort((a, b) => totalReactions(b) - totalReactions(a))
    return allPhotos
  })()

  /* ── Hero + masonry ── */
  const heroPhoto   = tab === 'all' && filteredPhotos.length > 0 ? filteredPhotos[0] : null
  const masonryPhotos = heroPhoto ? filteredPhotos.slice(1) : filteredPhotos

  // Split masonry into 2 columns (interleaved)
  const col1 = masonryPhotos.filter((_, i) => i % 2 === 0)
  const col2 = masonryPhotos.filter((_, i) => i % 2 !== 0)

  // Map masonry photo → its global index in allPhotos (for lightbox)
  function globalIndex(photo) {
    return allPhotos.findIndex((p) => p.photo_id === photo.photo_id)
  }

  if (loading) return <LoadingState message="Chargement de l'album…" />

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Galerie</p>
          <h1 className="text-xl font-bold text-stone-900">
            Vos souvenirs
            {allPhotos.length > 0 && (
              <span className="ml-2 text-sm font-normal text-stone-400">
                {allPhotos.length} photo{allPhotos.length > 1 ? 's' : ''}
              </span>
            )}
          </h1>
        </div>
        <button onClick={handleRefresh}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Tabs */}
      <TabBar active={tab} onChange={setTab} />

      {/* New photos badge */}
      <AnimatePresence>
        {newCount > 0 && (
          <div className="flex justify-center">
            <NewPhotosBadge count={newCount} onRefresh={handleRefresh} />
          </div>
        )}
      </AnimatePresence>

      {/* Content */}
      {filteredPhotos.length === 0 ? (
        <EmptyState tab={tab} onShare={() => navigate('/partager')} />
      ) : (
        <div className="space-y-2">
          {/* Hero */}
          {heroPhoto && (
            <HeroPhoto
              photo={heroPhoto}
              reactionCounts={getReactionCounts(heroPhoto)}
              myReaction={getMyReaction(heroPhoto.photo_id)}
              onClick={() => setLightboxIndex(0)}
            />
          )}

          {/* Masonry 2-col */}
          {masonryPhotos.length > 0 && (
            <div className="flex gap-2 items-start">
              <div className="flex-1 flex flex-col gap-2">
                {col1.map((photo) => (
                  <PhotoCard
                    key={photo.photo_id}
                    photo={photo}
                    globalIndex={globalIndex(photo)}
                    myReaction={getMyReaction(photo.photo_id)}
                    reactionTotal={getTotal(photo)}
                    onClick={() => setLightboxIndex(globalIndex(photo))}
                  />
                ))}
              </div>
              <div className="flex-1 flex flex-col gap-2 mt-6">
                {col2.map((photo) => (
                  <PhotoCard
                    key={photo.photo_id}
                    photo={photo}
                    globalIndex={globalIndex(photo)}
                    myReaction={getMyReaction(photo.photo_id)}
                    reactionTotal={getTotal(photo)}
                    onClick={() => setLightboxIndex(globalIndex(photo))}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            photos={allPhotos}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onPrev={() => setLightboxIndex((i) => Math.max(0, i - 1))}
            onNext={() => setLightboxIndex((i) => Math.min(allPhotos.length - 1, i + 1))}
            getReactionCounts={getReactionCounts}
            getMyReaction={getMyReaction}
            handleReact={handleReact}
          />
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        onClick={() => navigate('/partager')}
        className="fixed bottom-24 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg hover:bg-rose-600 transition-colors active:scale-95"
        aria-label="Partager une photo"
      >
        <Camera size={22} />
      </button>
    </div>
  )
}
