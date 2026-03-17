import { useMemo, useState } from 'react'
import { PageIntro } from '../components/shared/PageIntro'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import { useAsyncData } from '../hooks/useAsyncData'
import { getRooms } from '../services/dataService'
import { normalizeName } from '../utils/text'
import { LoadingState, ErrorState } from '../components/shared/LoadingState'

function personLabel(room) {
  return room.display_name || room.full_name || room.person_id || '—'
}

function isNonEmpty(v) {
  return String(v || '').trim() !== ''
}

function KvRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 rounded-xl border border-dashed border-stone-200 bg-sage-50/40 px-3 py-3">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="text-sm font-bold text-right">{value}</span>
    </div>
  )
}

export function RoomsPage() {
  const { data: rooms = [], loading, error } = useAsyncData(getRooms, [])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [roommatesVisible, setRoommatesVisible] = useState(false)

  const matches = useMemo(() => {
    if (!showDropdown || !query.trim()) return []
    const q = normalizeName(query)
    return rooms
      .filter((room) =>
        normalizeName(room.display_name || '').includes(q) ||
        normalizeName(room.full_name || '').includes(q) ||
        normalizeName(room.person_id || '').includes(q)
      )
      .slice(0, 8)
  }, [query, rooms, showDropdown])

  const roommates = useMemo(() => {
    if (!selected) return []
    return rooms.filter(
      (room) =>
        normalizeName(room.room_name || '') === normalizeName(selected.room_name || '') &&
        normalizeName(room.building || '') === normalizeName(selected.building || '')
    )
  }, [selected, rooms])

  if (loading) return <LoadingState message="Chargement des chambres…" />
  if (error) return <ErrorState message="Impossible de charger les chambres. Réessaie plus tard." />

  function selectRoom(room) {
    setSelected(room)
    setQuery(personLabel(room))
    setShowDropdown(false)
    setRoommatesVisible(false)
  }

  return (
    <>
      <PageIntro eyebrow="Hébergement" title="Trouver sa chambre" description="Tape ton prénom + nom pour retrouver ta chambre et tes colocataires." />

      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setSelected(null)
          setRoommatesVisible(false)
          setShowDropdown(true)
        }}
        onFocus={() => { if (query.length >= 1) setShowDropdown(true) }}
        placeholder="Tape prénom + nom"
      />

      {matches.length > 0 && (
        <div className="mt-2 space-y-1">
          {matches.map((room, idx) => (
            <button key={idx} onClick={() => selectRoom(room)} className="w-full text-left">
              <Card>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👤</span>
                    <div>
                      <p className="font-semibold">{personLabel(room)}</p>
                      <p className="text-sm text-stone-500">Voir ma chambre</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <Card className="mt-4">
          <CardContent>
            <p className="text-lg font-bold">{personLabel(selected)}</p>

            <div className="my-3 border-t border-border" />

            <div className="space-y-2">
              {isNonEmpty(selected.building) && <KvRow label="Bâtiment" value={selected.building} />}
              {isNonEmpty(selected.room_name) && <KvRow label="Chambre" value={selected.room_name} />}
              {isNonEmpty(selected.notes) && <KvRow label="Infos" value={selected.notes} />}
              {isNonEmpty(selected.bed_type) && <KvRow label="Lit" value={selected.bed_type} />}
              {isNonEmpty(selected.capacity) && <KvRow label="Capacité" value={selected.capacity} />}
              {isNonEmpty(selected.bathroom) && <KvRow label="Salle de bain" value={selected.bathroom} />}
              {isNonEmpty(selected.extra) && <KvRow label="Extra" value={selected.extra} />}
            </div>

            {!roommatesVisible && (
              <button
                onClick={() => setRoommatesVisible(true)}
                className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:bg-stone-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-xl">👥</span>
                <div>
                  <p className="font-semibold text-sm">Afficher ma chambre</p>
                  <p className="text-xs text-stone-500">Voir les personnes dans la même chambre</p>
                </div>
              </button>
            )}

            {roommatesVisible && (
              <>
                <div className="my-3 border-t border-border" />
                <p className="text-xs font-bold text-stone-500">👥 Colocataires</p>
                <div className="mt-2 space-y-1">
                  {roommates.map((mate, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-white/90 p-3">
                      <p className="font-bold text-sm">{personLabel(mate)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <p className="mt-4 text-xs text-stone-400">
        Tu ne trouves pas ton nom ? Viens nous voir sur place.
      </p>
    </>
  )
}
