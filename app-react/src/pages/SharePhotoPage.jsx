import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Images, Check, AlertCircle, X, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { submitPhoto } from '../services/galleryService'

/* ─── Image compression via canvas ──────────────────────────── */
async function compressImage(file, maxPx = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
        const w = Math.round(img.width * ratio)
        const h = Math.round(img.height * ratio)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function genId() {
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

/* ─── Step: Pick ─────────────────────────────────────────────── */
function StepPick({ onFiles }) {
  const cameraRef = useRef()
  const galleryRef = useRef()

  function handleChange(e) {
    const files = Array.from(e.target.files || [])
    if (files.length) onFiles(files)
    e.target.value = ''
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center pt-4">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
          <Camera size={28} className="text-rose-400" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Partage tes souvenirs</h1>
        <p className="mt-2 text-sm text-stone-500">Une ou plusieurs photos — elles rejoindront l'album commun</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Camera — single shot */}
        <button
          onClick={() => cameraRef.current?.click()}
          className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-rose-200 bg-rose-50/50 px-4 py-8 transition hover:border-rose-300 hover:bg-rose-50 active:scale-[0.97]"
        >
          <Camera size={28} className="text-rose-400" />
          <div className="text-center">
            <p className="text-sm font-semibold text-stone-700">Photo</p>
            <p className="text-xs text-stone-400 mt-0.5">Appareil photo</p>
          </div>
        </button>

        {/* Gallery — multiple */}
        <button
          onClick={() => galleryRef.current?.click()}
          className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50/50 px-4 py-8 transition hover:border-stone-300 hover:bg-stone-50 active:scale-[0.97]"
        >
          <Images size={28} className="text-stone-400" />
          <div className="text-center">
            <p className="text-sm font-semibold text-stone-700">Galerie</p>
            <p className="text-xs text-stone-400 mt-0.5">Plusieurs photos</p>
          </div>
        </button>
      </div>

      {/* Hidden inputs */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment"
        className="sr-only" onChange={handleChange} />
      <input ref={galleryRef} type="file" accept="image/*" multiple
        className="sr-only" onChange={handleChange} />
    </motion.div>
  )
}

/* ─── Step: Preview (multi) ──────────────────────────────────── */
function StepPreview({ items, author, onAuthor, onRemove, onAddMore, onSubmit, canAddMore }) {
  const addRef = useRef()
  const canSubmit = author.trim().length > 0 && items.length > 0

  function handleAddMore(e) {
    const files = Array.from(e.target.files || [])
    if (files.length) onAddMore(files)
    e.target.value = ''
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

      {/* Photo grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
            {items.length} photo{items.length > 1 ? 's' : ''} sélectionnée{items.length > 1 ? 's' : ''}
          </p>
          {canAddMore && (
            <button
              onClick={() => addRef.current?.click()}
              className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600"
            >
              <Plus size={13} /> Ajouter
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: i * 0.05 }}
              className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100"
            >
              <img src={item.preview} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => onRemove(item.id)}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </div>
        <input ref={addRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleAddMore} />
      </div>

      {/* Author — shared for all photos */}
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-stone-400">
          Ton prénom *
        </label>
        <input
          value={author}
          onChange={(e) => onAuthor(e.target.value)}
          placeholder="Marie, Jean-Pierre…"
          maxLength={40}
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        />
        <p className="mt-1 text-xs text-stone-400">Appliqué à toutes les photos</p>
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full rounded-2xl bg-rose-500 py-4 text-sm font-bold text-white shadow-sm hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
      >
        Partager {items.length > 1 ? `${items.length} photos` : 'la photo'}
      </button>
    </motion.div>
  )
}

/* ─── Step: Processing ───────────────────────────────────────── */
function StepProcessing({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-5 py-24"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-rose-400" />
      <div className="w-full max-w-xs space-y-2 text-center">
        <p className="text-sm font-medium text-stone-600">
          Traitement {current}/{total}…
        </p>
        <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-rose-400"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Step: Done ─────────────────────────────────────────────── */
function StepDone({ count, onAnother, onAlbum }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-5 py-16 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
        <Check size={36} className="text-green-500" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-xl font-bold text-stone-900">
          {count > 1 ? `${count} photos partagées !` : 'Photo partagée !'}
        </p>
        <p className="mt-1 text-sm text-stone-500">
          {count > 1 ? 'Elles sont' : 'Elle est'} maintenant visibles dans l'album.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <button onClick={onAlbum}
          className="w-full rounded-2xl bg-rose-500 py-4 text-sm font-bold text-white shadow-sm hover:bg-rose-600 transition-colors">
          Voir l'album
        </button>
        <button onClick={onAnother}
          className="w-full rounded-2xl border border-stone-200 bg-white py-3.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors">
          Partager d'autres photos
        </button>
      </div>
    </motion.div>
  )
}

/* ─── Step: Error ────────────────────────────────────────────── */
function StepError({ message, onRetry }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4 py-16 text-center"
    >
      <AlertCircle size={40} className="text-red-400" />
      <div>
        <p className="font-semibold text-stone-800">Une erreur est survenue</p>
        <p className="mt-1 text-sm text-stone-500">{message}</p>
      </div>
      <button onClick={onRetry}
        className="rounded-2xl bg-stone-800 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700">
        Réessayer
      </button>
    </motion.div>
  )
}

/* ─── Main page ──────────────────────────────────────────────── */
const MAX_PHOTOS = 20

export function SharePhotoPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('pick')
  // items = [{ id, file, preview }]
  const [items, setItems] = useState([])
  const [author, setAuthor] = useState('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [doneCount, setDoneCount] = useState(0)
  const [error, setError] = useState(null)

  function addFiles(files) {
    const newItems = files.slice(0, MAX_PHOTOS - items.length).map((f) => ({
      id: genId(),
      file: f,
      preview: URL.createObjectURL(f),
    }))
    setItems((prev) => [...prev, ...newItems])
    setStep('preview')
  }

  function removeItem(id) {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id)
      if (next.length === 0) setStep('pick')
      return next
    })
  }

  function reset() {
    setItems([])
    setAuthor('')
    setProgress({ current: 0, total: 0 })
    setStep('pick')
    setError(null)
  }

  async function handleSubmit() {
    if (!items.length || !author.trim()) return
    setStep('processing')
    setProgress({ current: 0, total: items.length })
    setError(null)

    try {
      for (let i = 0; i < items.length; i++) {
        setProgress({ current: i + 1, total: items.length })
        const base64 = await compressImage(items[i].file)
        submitPhoto({
          photo_id: items[i].id,
          author: author.trim().slice(0, 40),
          caption: '',
          image_url: base64,
          thumb_url: base64,
          likes: 0,
          created_at: new Date().toISOString(),
        })
      }
      setDoneCount(items.length)
      setStep('done')
    } catch (err) {
      setError(err?.message || 'Impossible de traiter une image.')
      setStep('error')
    }
  }

  return (
    <div className="pb-8">
      <AnimatePresence mode="wait">
        {step === 'pick' && (
          <StepPick key="pick" onFiles={addFiles} />
        )}
        {step === 'preview' && (
          <StepPreview
            key="preview"
            items={items}
            author={author}
            onAuthor={setAuthor}
            onRemove={removeItem}
            onAddMore={addFiles}
            onSubmit={handleSubmit}
            canAddMore={items.length < MAX_PHOTOS}
          />
        )}
        {step === 'processing' && (
          <StepProcessing key="processing" current={progress.current} total={progress.total} />
        )}
        {step === 'done' && (
          <StepDone key="done" count={doneCount} onAnother={reset} onAlbum={() => navigate('/album')} />
        )}
        {step === 'error' && (
          <StepError key="error" message={error} onRetry={() => setStep('preview')} />
        )}
      </AnimatePresence>
    </div>
  )
}
