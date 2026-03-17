import { motion } from 'framer-motion'
import { MapPin, Check } from 'lucide-react'

const DAYS = ['Samedi', 'Dimanche']

// Regroupe les événements par jour dans l'ordre des DAYS
function groupByDay(events) {
  const map = new Map(DAYS.map((d) => [d, []]))
  for (const event of events) {
    if (map.has(event.day)) map.get(event.day).push(event)
  }
  return DAYS.map((day) => ({ day, events: map.get(day) })).filter((g) => g.events.length > 0)
}

function DayLabel({ day }) {
  const dateStr = day === 'Samedi' ? '13 juin' : '14 juin'
  return (
    <div className="flex items-center gap-3 mb-2 mt-1">
      <span className="text-xs font-bold uppercase tracking-widest text-stone-400">{day}</span>
      <span className="text-xs text-stone-300">{dateStr}</span>
      <div className="flex-1 h-px bg-stone-100" />
    </div>
  )
}

export function ProgrammeTimeline({ events, currentIdx, nextIdx }) {
  const groups = groupByDay(events)

  return (
    <div className="space-y-2">
      {groups.map(({ day, events: dayEvents }) => (
        <div key={day}>
          <DayLabel day={day} />
          <div className="relative">
            {/* Ligne verticale continue */}
            <div className="absolute left-[30px] top-3 bottom-3 w-px bg-stone-100" />

            <div className="space-y-1">
              {dayEvents.map((event) => {
                const idx = events.indexOf(event)
                const isPast = currentIdx >= 0 && idx < currentIdx
                const isCurrent = idx === currentIdx
                const isNext = idx === nextIdx

                return (
                  <TimelineItem
                    key={event.id}
                    event={event}
                    idx={idx}
                    isPast={isPast}
                    isCurrent={isCurrent}
                    isNext={isNext}
                  />
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TimelineItem({ event, idx, isPast, isCurrent, isNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.25 }}
      className="relative flex items-start gap-0"
    >
      {/* Colonne gauche : heure + dot */}
      <div className="flex w-[62px] shrink-0 flex-col items-center pt-3.5">
        <span
          className={`text-xs font-bold tabular-nums leading-none ${
            isCurrent ? 'text-rose-500' : isNext ? 'text-stone-700' : isPast ? 'text-stone-300' : 'text-stone-400'
          }`}
        >
          {event.timeLabel}
        </span>
      </div>

      {/* Dot sur la ligne */}
      <div className="relative z-10 flex shrink-0 items-start justify-center pt-3" style={{ width: 0 }}>
        {isCurrent ? (
          /* Point pulsant rose pour EN COURS */
          <span className="relative flex h-3 w-3 -translate-x-1/2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-50" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white" />
          </span>
        ) : isPast ? (
          /* Check vert pour passé */
          <span className="-translate-x-1/2 flex h-3 w-3 items-center justify-center rounded-full bg-stone-200">
            <Check size={7} className="text-stone-400" strokeWidth={3} />
          </span>
        ) : isNext ? (
          /* Cercle plein sage pour prochain */
          <span className="-translate-x-1/2 h-3 w-3 rounded-full bg-stone-600 ring-2 ring-white" />
        ) : (
          /* Cercle vide pour futur */
          <span className="-translate-x-1/2 h-3 w-3 rounded-full border-2 border-stone-200 bg-white" />
        )}
      </div>

      {/* Carte événement */}
      <div className="flex-1 pb-1 pl-4 pr-0">
        <div
          className={`rounded-2xl px-4 py-3 transition-colors ${
            isCurrent
              ? 'bg-rose-50 border border-rose-200'
              : isNext
              ? 'bg-stone-50 border border-stone-200'
              : isPast
              ? 'border border-transparent'
              : 'border border-transparent'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className={`text-base leading-none mt-0.5 ${isPast ? 'opacity-40' : ''}`}>
                {event.icon}
              </span>
              <div className="min-w-0">
                <p
                  className={`font-semibold leading-snug ${
                    isCurrent
                      ? 'text-rose-700'
                      : isNext
                      ? 'text-stone-800'
                      : isPast
                      ? 'text-stone-300 line-through decoration-stone-200'
                      : 'text-stone-700'
                  }`}
                >
                  {event.title}
                </p>
                {!isPast && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-400">
                    <MapPin size={10} />
                    {event.place}
                  </p>
                )}
              </div>
            </div>

            {/* Badge état */}
            {isCurrent && (
              <span className="shrink-0 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                En cours
              </span>
            )}
            {isNext && (
              <span className="shrink-0 rounded-full bg-stone-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Prochain
              </span>
            )}
          </div>

          {/* Sous-titre uniquement si non passé */}
          {!isPast && event.subtitle && (
            <p className={`mt-1 text-xs pl-8 ${isCurrent ? 'text-rose-400' : 'text-stone-400'}`}>
              {event.subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
