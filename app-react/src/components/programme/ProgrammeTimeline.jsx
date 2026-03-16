import { motion } from 'framer-motion'
import { Clock3, MapPin } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'

export function ProgrammeTimeline({ events, currentId }) {
  return (
    <div className="space-y-3">
      {events.map((event, i) => (
        <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <Card className={event.id === currentId ? 'border-rose-300 ring-2 ring-rose-200' : ''}>
            <CardContent className="flex gap-4">
              <div className="min-w-16 text-xs font-bold text-sage-700">{event.timeLabel}</div>
              <div>
                <p className="font-semibold">{event.title}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-600">
                  <span className="inline-flex items-center gap-1"><Clock3 size={13} /> {event.day}</span>
                  <span className="inline-flex items-center gap-1"><MapPin size={13} /> {event.place}</span>
                  {event.id === currentId && <Badge>En cours / prochain</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
