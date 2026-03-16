import { useMemo, useState } from 'react'
import { PageIntro } from '../components/shared/PageIntro'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import { useAsyncData } from '../hooks/useAsyncData'
import { getRooms } from '../services/dataService'
import { normalizeName } from '../utils/text'

export function RoomsPage() {
  const { data: rooms = [] } = useAsyncData(getRooms, [])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  const matches = useMemo(() => {
    if (!query.trim()) return []
    const q = normalizeName(query)
    return rooms.filter((room) => normalizeName(room.full_name || room.display_name || '').includes(q)).slice(0, 8)
  }, [query, rooms])

  const roommates = useMemo(() => {
    if (!selected) return []
    return rooms.filter((room) => room.room_name === selected.room_name && room.building === selected.building)
  }, [selected, rooms])

  return (
    <>
      <PageIntro eyebrow="Hébergement" title="Trouver sa chambre rapidement" description="Recherche assistée par nom + détail chambre + colocataires dans un flux unique." />
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tape prénom + nom" />
      <div className="mt-3 space-y-2">
        {matches.map((room, idx) => (
          <button key={idx} onClick={() => setSelected(room)} className="w-full text-left">
            <Card><CardContent><p className="font-semibold">{room.full_name || room.display_name}</p><p className="text-sm text-stone-600">{room.building} • {room.room_name}</p></CardContent></Card>
          </button>
        ))}
      </div>
      {selected && (
        <Card className="mt-4 border-rose-200">
          <CardContent>
            <p className="text-lg font-semibold">{selected.full_name || selected.display_name}</p>
            <p className="mt-1 text-sm text-stone-600">{selected.building} — Chambre {selected.room_name}</p>
            <p className="mt-3 text-sm">Colocataires : {roommates.map((r) => r.full_name || r.display_name).join(', ')}</p>
          </CardContent>
        </Card>
      )}
    </>
  )
}
