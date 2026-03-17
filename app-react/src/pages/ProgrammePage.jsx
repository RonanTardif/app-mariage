import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { programmeEvents, PROTOTYPE_MODE } from '../data/programme'
import { ProgrammeTimeline } from '../components/programme/ProgrammeTimeline'

const n = programmeEvents.length

function computeStatus(events, now) {
  let currentIdx = -1
  for (let i = 0; i < events.length; i++) {
    if (now >= new Date(events[i].startsAt).getTime()) currentIdx = i
  }
  const nextIdx = events.findIndex((e) => new Date(e.startsAt).getTime() > now)
  return { currentIdx, nextIdx }
}

function formatTimeUntil(startsAt, now) {
  const ms = new Date(startsAt).getTime() - now
  if (ms <= 0) return null
  const totalMin = Math.floor(ms / 60000)
  if (totalMin < 60) return `dans ${totalMin} min`
  const h = Math.floor(totalMin / 60)
  const min = totalMin % 60
  return min > 0 ? `dans ${h}h${String(min).padStart(2, '0')}` : `dans ${h}h`
}

export function ProgrammePage() {
  // — Mode prototype : index qui tourne toutes les 15s
  const [protoIdx, setProtoIdx] = useState(0)
  // — Mode réel : timestamp mis à jour toutes les 30s
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (PROTOTYPE_MODE) {
      const id = setInterval(() => setProtoIdx((i) => (i + 1) % n), 15_000)
      return () => clearInterval(id)
    } else {
      const id = setInterval(() => setNow(Date.now()), 30_000)
      return () => clearInterval(id)
    }
  }, [])

  // Indices effectifs selon le mode
  const { currentIdx, nextIdx } = PROTOTYPE_MODE
    ? { currentIdx: protoIdx, nextIdx: (protoIdx + 1) % n }
    : computeStatus(programmeEvents, now)

  const current = currentIdx >= 0 ? programmeEvents[currentIdx] : null
  const next = nextIdx >= 0 ? programmeEvents[nextIdx] : null

  const weddingOver = !PROTOTYPE_MODE && currentIdx === n - 1 && nextIdx === -1
  const weddingStarted = PROTOTYPE_MODE || currentIdx >= 0

  return (
    <div className="space-y-4">
      {/* ─── Hero dynamique ─────────────────────────────── */}
      {weddingOver ? (
        <div className="rounded-3xl bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-100 p-5 text-center">
          <p className="text-3xl mb-2">💛</p>
          <p className="font-bold text-lg text-stone-800">Merci d'avoir été là !</p>
          <p className="text-sm text-stone-500 mt-1">Le mariage de Ronan &amp; Lorie est terminé.</p>
        </div>
      ) : !weddingStarted && next ? (
        /* Avant le début */
        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Prochain moment</p>
          <div className="flex items-center gap-4">
            <span className="text-3xl">{next.icon}</span>
            <div>
              <p className="font-bold text-xl text-stone-900">{next.title}</p>
              <p className="text-sm text-stone-500 mt-0.5">{next.timeLabel} · {next.place}</p>
              {next.baseText && <p className="mt-2 text-sm text-stone-500">{next.baseText}</p>}
            </div>
          </div>
        </div>
      ) : (
        /* Pendant le mariage — EN COURS + PROCHAIN */
        <div className="overflow-hidden rounded-3xl border border-rose-200 shadow-sm">
          {/* EN COURS */}
          {current && (
            <div className="bg-gradient-to-r from-rose-500 to-rose-400 p-5">
              {PROTOTYPE_MODE && (
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-rose-200">
                  ⚙ Prototype · rotation 15 s
                </p>
              )}
              <div className="flex items-center gap-2 mb-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-rose-100">En cours</span>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-3xl mt-0.5">{current.icon}</span>
                <div>
                  <p className="font-bold text-2xl text-white leading-tight">{current.title}</p>
                  <p className="text-rose-100 text-sm mt-1">{current.timeLabel} · {current.place}</p>
                  {current.specialText && (
                    <p className="mt-2 text-sm text-rose-50 leading-snug">{current.specialText}</p>
                  )}
                  {current.ctaTo && (
                    <Link
                      to={current.ctaTo}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/30"
                    >
                      {current.ctaLabel} →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* PROCHAIN */}
          {next && next.id !== current?.id && (
            <div className="bg-white/90 border-t border-rose-100 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{next.icon}</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Prochain</p>
                    <p className="font-semibold text-stone-800">{next.title}</p>
                    <p className="text-xs text-stone-500">{next.place}</p>
                    {next.baseText && (
                      <p className="mt-1 text-xs text-stone-400 leading-snug">{next.baseText}</p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-stone-800">{next.timeLabel}</p>
                  {!PROTOTYPE_MODE && formatTimeUntil(next.startsAt, now) && (
                    <p className="text-xs text-stone-400 mt-0.5">{formatTimeUntil(next.startsAt, now)}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Timeline complète ───────────────────────────── */}
      <ProgrammeTimeline
        events={programmeEvents}
        currentIdx={currentIdx}
        nextIdx={nextIdx}
      />
    </div>
  )
}
