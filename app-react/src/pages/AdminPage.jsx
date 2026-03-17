import { useState, useEffect, useRef, useCallback } from 'react'
import { Reorder, useDragControls, motion, AnimatePresence } from 'framer-motion'
import { GripVertical, Check, RotateCcw, CloudUpload, Clock, Users, Camera, Trash2, Plus } from 'lucide-react'
import { APP_CONFIG } from '../utils/constants'
import { fetchJsonp } from '../services/http'

/* ─── localStorage key ───────────────────────────────────────── */
const LS_KEY = 'mariage_admin_state_v7'

/* ─── Default state ──────────────────────────────────────────── */
const DEFAULT_STATE = {
  delayMinutes: 0,
  photoStart: '2026-06-13T16:30',
  groupIntervalMinutes: 10,
  groups: [
    { name: 'Groupe 1', done: false },
    { name: 'Groupe 2', done: false },
    { name: 'Groupe 3', done: false },
  ],
}

/* ─── ETA helpers ────────────────────────────────────────────── */
function computeEta(photoStart, delayMinutes, groupIntervalMinutes, index) {
  if (!photoStart) return '—'
  try {
    const base = new Date(photoStart)
    const totalMin = delayMinutes + index * groupIntervalMinutes
    base.setMinutes(base.getMinutes() + totalMin)
    return base.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

/* ─── API helpers ────────────────────────────────────────────── */
async function apiFetch(url) {
  try {
    return await fetchJsonp(url)
  } catch {
    return null
  }
}

/* ─── Sync status indicator ──────────────────────────────────── */
function SyncBadge({ status }) {
  const map = {
    idle: { label: 'Non synchronisé', color: 'text-stone-400', bg: 'bg-stone-100' },
    saving: { label: 'Synchronisation…', color: 'text-amber-600', bg: 'bg-amber-50' },
    saved: { label: 'Synchronisé', color: 'text-green-600', bg: 'bg-green-50' },
    error: { label: 'Erreur sync', color: 'text-red-500', bg: 'bg-red-50' },
    loading: { label: 'Chargement…', color: 'text-blue-500', bg: 'bg-blue-50' },
  }
  const { label, color, bg } = map[status] || map.idle
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${bg} ${color}`}>
      {status === 'saving' || status === 'loading' ? (
        <span className="h-2 w-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : status === 'saved' ? (
        <Check size={10} strokeWidth={3} />
      ) : status === 'error' ? (
        <span className="h-2 w-2 rounded-full bg-current" />
      ) : null}
      {label}
    </span>
  )
}

/* ─── Individual group row ───────────────────────────────────── */
function GroupRow({ group, index, eta, onToggleDone, onRename, onDelete }) {
  const controls = useDragControls()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(group.name)
  const inputRef = useRef(null)

  function commitRename() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== group.name) onRename(trimmed)
    else setDraft(group.name)
    setEditing(false)
  }

  return (
    <Reorder.Item
      value={group}
      dragListener={false}
      dragControls={controls}
      className="touch-none"
    >
      <motion.div
        layout
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
          group.done
            ? 'border-stone-100 bg-stone-50 opacity-60'
            : 'border-stone-200 bg-white shadow-sm'
        }`}
      >
        {/* Drag handle */}
        <button
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500 touch-none"
          aria-label="Réordonner"
        >
          <GripVertical size={18} />
        </button>

        {/* Index badge */}
        <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-500">
          {index + 1}
        </span>

        {/* Group name (editable) */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') { setDraft(group.name); setEditing(false) }
              }}
              className="w-full rounded-lg border border-rose-300 bg-rose-50 px-2 py-0.5 text-sm font-semibold text-stone-800 outline-none focus:ring-2 focus:ring-rose-300"
              autoFocus
            />
          ) : (
            <button
              onClick={() => { setDraft(group.name); setEditing(true) }}
              className={`text-left text-sm font-semibold ${group.done ? 'line-through text-stone-400' : 'text-stone-800'}`}
            >
              {group.name}
            </button>
          )}
          {/* ETA */}
          <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-400">
            <Clock size={10} />
            Photos estimées à <span className="font-medium text-stone-600">{eta}</span>
          </p>
        </div>

        {/* Done toggle */}
        <button
          onClick={() => onToggleDone()}
          className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
            group.done
              ? 'border-green-400 bg-green-400 text-white'
              : 'border-stone-200 bg-white text-transparent hover:border-green-300'
          }`}
          aria-label={group.done ? 'Marquer non fait' : 'Marquer fait'}
        >
          <Check size={14} strokeWidth={3} />
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete()}
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-stone-300 hover:bg-red-50 hover:text-red-400 transition-colors"
          aria-label="Supprimer"
        >
          <Trash2 size={14} />
        </button>
      </motion.div>
    </Reorder.Item>
  )
}

/* ─── Main page ──────────────────────────────────────────────── */
export function AdminPage() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      return saved ? JSON.parse(saved) : DEFAULT_STATE
    } catch {
      return DEFAULT_STATE
    }
  })
  const [syncStatus, setSyncStatus] = useState('idle')
  const debounceRef = useRef(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  /* ── Persist to localStorage on every change ── */
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)) } catch {}
  }, [state])

  /* ── Debounced remote sync ── */
  const scheduleSync = useCallback((nextState) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSyncStatus('saving')
    debounceRef.current = setTimeout(async () => {
      const encoded = encodeURIComponent(JSON.stringify(nextState))
      const url = `${APP_CONFIG.adminApi}&action=upsert&state=${encoded}`
      const res = await apiFetch(url)
      setSyncStatus(res?.ok ? 'saved' : 'error')
    }, 800)
  }, [])

  /* ── Load from remote on mount ── */
  useEffect(() => {
    setSyncStatus('loading')
    apiFetch(`${APP_CONFIG.adminApi}&action=get`).then((res) => {
      if (res?.state) {
        setState(res.state)
        setSyncStatus('saved')
      } else {
        setSyncStatus('idle')
      }
    })
  }, [])

  /* ── Setter that also schedules sync ── */
  function update(patch) {
    setState((prev) => {
      const next = { ...prev, ...patch }
      scheduleSync(next)
      return next
    })
  }

  function updateGroups(groups) {
    setState((prev) => {
      const next = { ...prev, groups }
      scheduleSync(next)
      return next
    })
  }

  function toggleDone(idx) {
    const groups = state.groups.map((g, i) => i === idx ? { ...g, done: !g.done } : g)
    updateGroups(groups)
  }

  function renameGroup(idx, name) {
    const groups = state.groups.map((g, i) => i === idx ? { ...g, name } : g)
    updateGroups(groups)
  }

  function deleteGroup(idx) {
    const groups = state.groups.filter((_, i) => i !== idx)
    updateGroups(groups)
  }

  function addGroup() {
    const name = newGroupName.trim() || `Groupe ${state.groups.length + 1}`
    const groups = [...state.groups, { name, done: false }]
    updateGroups(groups)
    setNewGroupName('')
    setShowAddForm(false)
  }

  async function forceSync() {
    setSyncStatus('saving')
    const encoded = encodeURIComponent(JSON.stringify(state))
    const url = `${APP_CONFIG.adminApi}&action=upsert&state=${encoded}`
    const res = await apiFetch(url)
    setSyncStatus(res?.ok ? 'saved' : 'error')
  }

  function resetToDefault() {
    setState(DEFAULT_STATE)
    scheduleSync(DEFAULT_STATE)
  }

  const doneCount = state.groups.filter((g) => g.done).length
  const progress = state.groups.length > 0 ? (doneCount / state.groups.length) * 100 : 0

  return (
    <div className="space-y-5 pb-8">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Admin Photos</h1>
          <p className="text-sm text-stone-500">Gestion des groupes & retards</p>
        </div>
        <SyncBadge status={syncStatus} />
      </div>

      {/* ─── Progress bar ─── */}
      <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">Progression</span>
          <span className="text-sm font-bold text-stone-700">{doneCount} / {state.groups.length}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* ─── Settings panel ─── */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Paramètres</p>

        {/* Photo start */}
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
            <Camera size={16} />
          </span>
          <div className="flex-1">
            <label className="text-xs font-semibold text-stone-600">Début des photos</label>
            <input
              type="datetime-local"
              value={state.photoStart}
              onChange={(e) => update({ photoStart: e.target.value })}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            />
          </div>
        </div>

        {/* Interval */}
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <Users size={16} />
          </span>
          <div className="flex-1">
            <label className="text-xs font-semibold text-stone-600">Intervalle entre groupes (min)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={state.groupIntervalMinutes}
              onChange={(e) => update({ groupIntervalMinutes: Number(e.target.value) })}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            />
          </div>
        </div>

        {/* Delay */}
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
            <Clock size={16} />
          </span>
          <div className="flex-1">
            <label className="text-xs font-semibold text-stone-600">Retard global (min)</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="range"
                min={-30}
                max={90}
                step={5}
                value={state.delayMinutes}
                onChange={(e) => update({ delayMinutes: Number(e.target.value) })}
                className="flex-1 accent-rose-500"
              />
              <span className="w-14 rounded-xl border border-stone-200 bg-stone-50 px-2 py-1 text-center text-sm font-bold text-stone-700">
                {state.delayMinutes > 0 ? `+${state.delayMinutes}` : state.delayMinutes} min
              </span>
            </div>
            {state.delayMinutes !== 0 && (
              <p className="mt-1 text-xs text-amber-600">
                {state.delayMinutes > 0
                  ? `⚠️ Programme décalé de ${state.delayMinutes} min`
                  : `⏩ Programme avancé de ${Math.abs(state.delayMinutes)} min`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Groups list ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
            Groupes ({state.groups.length})
          </p>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-1 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-600 transition-colors"
          >
            <Plus size={12} />
            Ajouter
          </button>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3">
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGroup()}
                  placeholder="Nom du groupe…"
                  className="flex-1 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300"
                  autoFocus
                />
                <button
                  onClick={addGroup}
                  className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
                >
                  OK
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag-and-drop list */}
        <Reorder.Group
          axis="y"
          values={state.groups}
          onReorder={updateGroups}
          className="space-y-2"
        >
          <AnimatePresence initial={false}>
            {state.groups.map((group, idx) => (
              <GroupRow
                key={group.name + idx}
                group={group}
                index={idx}
                eta={computeEta(state.photoStart, state.delayMinutes, state.groupIntervalMinutes, idx)}
                onToggleDone={() => toggleDone(idx)}
                onRename={(name) => renameGroup(idx, name)}
                onDelete={() => deleteGroup(idx)}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>

        {state.groups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-200 py-10 text-center text-sm text-stone-400">
            Aucun groupe — cliquez sur Ajouter
          </div>
        )}
      </div>

      {/* ─── Action buttons ─── */}
      <div className="flex gap-3">
        <button
          onClick={forceSync}
          disabled={syncStatus === 'saving'}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-stone-800 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          <CloudUpload size={16} />
          Forcer la sync
        </button>
        <button
          onClick={resetToDefault}
          className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <RotateCcw size={15} />
          Reset
        </button>
      </div>

      {/* ─── Summary table ─── */}
      {state.groups.length > 0 && (
        <div className="rounded-2xl border border-stone-100 bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Récapitulatif ETAs</p>
          </div>
          <div className="divide-y divide-stone-50">
            {state.groups.map((group, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400">#{idx + 1}</span>
                  <span className={`text-sm font-medium ${group.done ? 'line-through text-stone-300' : 'text-stone-700'}`}>
                    {group.name}
                  </span>
                  {group.done && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-600">
                      FAIT
                    </span>
                  )}
                </div>
                <span className={`text-sm font-bold tabular-nums ${group.done ? 'text-stone-300' : 'text-stone-600'}`}>
                  {computeEta(state.photoStart, state.delayMinutes, state.groupIntervalMinutes, idx)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
