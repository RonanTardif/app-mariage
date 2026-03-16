import { useMemo, useState } from 'react'
import { PageIntro } from '../components/shared/PageIntro'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import { useAsyncData } from '../hooks/useAsyncData'
import { getPhotoSlots } from '../services/dataService'
import { normalizeName } from '../utils/text'

export function PhotosPage() {
  const { data } = useAsyncData(getPhotoSlots, [])
  const people = data?.people || []
  const slots = data?.slots || []
  const groups = data?.groups || []

  const [query, setQuery] = useState('')
  const [person, setPerson] = useState(null)

  const matches = useMemo(() => {
    if (query.length < 2) return []
    return people.filter((p) => normalizeName(p.display_name).includes(normalizeName(query))).slice(0, 8)
  }, [query, people])

  const personSlots = useMemo(() => {
    if (!person) return []
    return (person.group_ids || []).map((id) => {
      const group = groups.find((g) => String(g.group_id) === String(id))
      const slot = slots.find((s) => String(s.group_id) === String(id))
      return { groupName: group?.group_name, eta: slot?.eta, location: slot?.location, status: slot?.status }
    })
  }, [person, groups, slots])

  return (
    <>
      <PageIntro eyebrow="Photos" title="Ton créneau photo, sans friction" description="Auto-complétion nom + carte de créneaux claire, utilisable en situation réelle." />
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Recherche invité" />
      <div className="mt-3 space-y-2">
        {matches.map((item) => (
          <button key={item.person_id} onClick={() => setPerson(item)} className="w-full text-left">
            <Card><CardContent><p className="font-semibold">{item.display_name}</p></CardContent></Card>
          </button>
        ))}
      </div>
      {person && (
        <Card className="mt-4 border-sage-200">
          <CardContent>
            <p className="font-semibold">{person.display_name}</p>
            <div className="mt-3 space-y-2">
              {personSlots.map((slot, idx) => (
                <div key={idx} className="rounded-xl border border-border p-3 text-sm">
                  <p className="font-medium">{slot.groupName}</p>
                  <p className="text-stone-600">{slot.eta || '--:--'} • {slot.location || 'Lieu à confirmer'} • {slot.status || 'pending'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
