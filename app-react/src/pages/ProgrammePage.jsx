import { useMemo } from 'react'
import { PageIntro } from '../components/shared/PageIntro'
import { programmeEvents } from '../data/programme'
import { ProgrammeTimeline } from '../components/programme/ProgrammeTimeline'
import { Card, CardContent } from '../components/ui/card'

export function ProgrammePage() {
  const currentId = useMemo(() => {
    const now = Date.now()
    const upcoming = programmeEvents.find((event) => new Date(event.startsAt).getTime() > now)
    return upcoming?.id || programmeEvents[programmeEvents.length - 1].id
  }, [])

  const current = programmeEvents.find((event) => event.id === currentId)

  return (
    <>
      <PageIntro eyebrow="Programme" title="Une timeline premium et lisible" description="Le prochain temps fort est mis en avant, puis le détail complet reste accessible immédiatement." />
      <Card className="mb-4 border-rose-200 bg-gradient-to-r from-rose-100 to-sand">
        <CardContent>
          <p className="text-xs uppercase tracking-wide text-rose-700">Prochain moment clé</p>
          <p className="mt-2 text-xl font-semibold">{current?.title}</p>
          <p className="text-sm text-stone-600">{current?.timeLabel} • {current?.place}</p>
        </CardContent>
      </Card>
      <ProgrammeTimeline events={programmeEvents} currentId={currentId} />
    </>
  )
}
