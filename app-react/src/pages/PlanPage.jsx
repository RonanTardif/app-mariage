import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { PageIntro } from '../components/shared/PageIntro'
import { useAsyncData } from '../hooks/useAsyncData'
import { getPlaces } from '../services/dataService'
import { Card, CardContent } from '../components/ui/card'

export function PlanPage() {
  const { data: places = [] } = useAsyncData(getPlaces, [])
  const [selected, setSelected] = useState(null)

  return (
    <>
      <PageIntro eyebrow="Plan" title="Repérage visuel du domaine" description="Image immersive + fiches lieux pour se déplacer vite sans confusion." />
      <Card>
        <CardContent>
          <img src="/assets/plan-domaine.jpg" alt="Plan du domaine" className="w-full rounded-2xl border border-border object-cover" />
        </CardContent>
      </Card>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {places.map((place) => (
          <button key={place.id} onClick={() => setSelected(place)} className="text-left">
            <Card className="h-full hover:border-sage-300">
              <CardContent>
                <div className="flex items-center gap-2"><MapPin size={14} className="text-sage-700" /><p className="font-semibold">{place.title}</p></div>
                <p className="mt-1 text-sm text-stone-600 line-clamp-2">{place.description}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
      {selected && (
        <Card className="mt-4 border-sage-200">
          <CardContent>
            <p className="font-semibold">{selected.title}</p>
            <p className="mt-1 text-sm text-stone-700">{selected.description}</p>
          </CardContent>
        </Card>
      )}
    </>
  )
}
