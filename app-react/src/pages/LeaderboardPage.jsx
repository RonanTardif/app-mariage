import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { useAsyncData } from '../hooks/useAsyncData'
import { getLeaderboard } from '../services/dataService'
import { LoadingState, ErrorState } from '../components/shared/LoadingState'

/* ─── Helpers ────────────────────────────────────────────────── */
function pct(score, total) {
  if (!total) return 0
  return Math.round((score / total) * 100)
}

function initials(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/* ─── Medal config ───────────────────────────────────────────── */
const MEDAL = {
  1: { emoji: '🥇', label: 'or',     bg: 'from-amber-400 to-yellow-300',  ring: 'ring-amber-300', text: 'text-amber-700', podiumH: 'h-24', podiumBg: 'bg-amber-400', avatarBg: 'bg-amber-100', avatarText: 'text-amber-700' },
  2: { emoji: '🥈', label: 'argent', bg: 'from-slate-400 to-slate-300',   ring: 'ring-slate-300',  text: 'text-slate-600', podiumH: 'h-16', podiumBg: 'bg-slate-400', avatarBg: 'bg-slate-100',  avatarText: 'text-slate-600'  },
  3: { emoji: '🥉', label: 'bronze', bg: 'from-orange-400 to-amber-300',  ring: 'ring-orange-300', text: 'text-orange-700', podiumH: 'h-12', podiumBg: 'bg-orange-400', avatarBg: 'bg-orange-100', avatarText: 'text-orange-700' },
}

/* ─── Podium card ────────────────────────────────────────────── */
function PodiumCard({ entry, rank, delay }) {
  const m = MEDAL[rank]
  const p = pct(entry.score, entry.total)
  const order = rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3'

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center gap-2 ${order}`}
    >
      {/* Avatar + medal emoji */}
      <div className="relative">
        <div className={`flex h-14 w-14 items-center justify-center rounded-full ${m.avatarBg} ring-4 ${m.ring} text-lg font-bold ${m.avatarText}`}>
          {initials(entry.player)}
        </div>
        <span className="absolute -bottom-1 -right-1 text-lg leading-none">{m.emoji}</span>
      </div>

      {/* Name + score */}
      <div className="text-center">
        <p className="max-w-[80px] truncate text-sm font-bold text-stone-800 leading-tight">{entry.player}</p>
        <p className={`text-xs font-semibold ${m.text}`}>{entry.score}/{entry.total} · {p}%</p>
      </div>

      {/* Podium block */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: delay + 0.15, duration: 0.4, ease: 'backOut' }}
        style={{ transformOrigin: 'bottom' }}
        className={`w-20 ${m.podiumH} ${m.podiumBg} rounded-t-2xl flex items-start justify-center pt-2`}
      >
        <span className="text-white font-black text-xl">{rank}</span>
      </motion.div>
    </motion.div>
  )
}

/* ─── Row for 4th+ ──────────────────────────────────────────── */
function RankRow({ entry, rank, delay }) {
  const p = pct(entry.score, entry.total)

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-3 rounded-2xl bg-white border border-stone-100 px-4 py-3 shadow-sm"
    >
      {/* Rank */}
      <span className="w-6 shrink-0 text-center text-sm font-bold text-stone-400">{rank}</span>

      {/* Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-600">
        {initials(entry.player)}
      </div>

      {/* Name + bar */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-stone-800">{entry.player}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-stone-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${p}%` }}
              transition={{ delay: delay + 0.2, duration: 0.5 }}
              className="h-full rounded-full bg-rose-400"
            />
          </div>
          <span className="shrink-0 text-xs text-stone-400 tabular-nums">{p}%</span>
        </div>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-stone-700">{entry.score}<span className="font-normal text-stone-400">/{entry.total}</span></p>
        {entry.time && <p className="text-[10px] text-stone-400 tabular-nums">{entry.time}</p>}
      </div>
    </motion.div>
  )
}

/* ─── Empty state ────────────────────────────────────────────── */
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 py-16 text-center"
    >
      <Trophy size={36} className="text-stone-200" />
      <p className="font-semibold text-stone-500">Aucun score pour le moment</p>
      <p className="text-sm text-stone-400">Les résultats du quiz apparaîtront ici.</p>
    </motion.div>
  )
}

/* ─── Main page ──────────────────────────────────────────────── */
export function LeaderboardPage() {
  const { data, loading, error } = useAsyncData(getLeaderboard, [])
  const [expanded, setExpanded] = useState(false)

  if (loading) return <LoadingState message="Chargement du classement…" />
  if (error) return <ErrorState message="Impossible de charger le classement." />

  const scores = (Array.isArray(data) ? data : [])
    .slice()
    .sort((a, b) => (b.score - a.score) || (new Date(a.created_at) - new Date(b.created_at)))

  if (scores.length === 0) return <EmptyState />

  const top3 = scores.slice(0, 3)
  const rest = scores.slice(3)
  const shown = expanded ? rest : rest.slice(0, 3)

  // Podium order: [2nd, 1st, 3rd]
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)
  const podiumRanks = top3[1] ? [2, 1, 3] : top3[0] ? [1] : []

  return (
    <div className="space-y-6 pb-8">
      {/* ─── Header ─── */}
      <div className="text-center pt-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">Quiz</p>
        <h1 className="text-2xl font-bold text-stone-900">Classement</h1>
        <p className="text-sm text-stone-500 mt-1">{scores.length} participant{scores.length > 1 ? 's' : ''}</p>
      </div>

      {/* ─── Podium ─── */}
      <div className="rounded-3xl border border-stone-100 px-4 pt-6 pb-0 overflow-hidden" style={{ backgroundImage: 'url(/assets/podium_background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="flex items-end justify-center gap-2">
          {podiumOrder.map((entry, i) => (
            <PodiumCard
              key={entry.player + i}
              entry={entry}
              rank={podiumRanks[i]}
              delay={0.1 + i * 0.12}
            />
          ))}
        </div>
      </div>

      {/* ─── Rest of the list ─── */}
      {rest.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 px-1">Suite du classement</p>

          <AnimatePresence initial={false}>
            {shown.map((entry, i) => (
              <RankRow
                key={entry.player + (i + 4)}
                entry={entry}
                rank={i + 4}
                delay={i * 0.05}
              />
            ))}
          </AnimatePresence>

          {rest.length > 3 && (
            <motion.button
              layout
              onClick={() => setExpanded((v) => !v)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors shadow-sm"
            >
              {expanded ? (
                <><ChevronUp size={16} /> Réduire</>
              ) : (
                <><ChevronDown size={16} /> Voir les {rest.length - 3} autres</>
              )}
            </motion.button>
          )}
        </div>
      )}
    </div>
  )
}
