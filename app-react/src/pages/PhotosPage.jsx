import { useMemo, useState } from 'react'
import { PageIntro } from '../components/shared/PageIntro'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import { useAsyncData } from '../hooks/useAsyncData'
import { getPhotoSlots } from '../services/dataService'
import { normalizeName } from '../utils/text'
import { LoadingState, ErrorState } from '../components/shared/LoadingState'

function badgeClass(status) {
  const s = (status || '').toUpperCase()
  if (s === 'DONE') return 'bg-green-100 text-green-700'
  if (s === 'NOW') return 'bg-amber-100 text-amber-700'
  if (s === 'SKIP') return 'bg-red-100 text-red-700'
  if (s === 'REPLAN') return 'bg-amber-100 text-amber-700'
  return 'bg-stone-100 text-stone-600'
}

function statusLabel(status) {
  const s = (status || '').toUpperCase()
  if (s === 'DONE') return 'Fait'
  if (s === 'NOW') return 'En cours'
  if (s === 'SKIP') return 'Sauté'
  if (s === 'REPLAN') return 'Replanifié'
  return 'À venir'
}

export function PhotosPage() {
  const { data, loading, error } = useAsyncData(getPhotoSlots, [])
  const people = data?.people || []
  const slots = data?.slots || []
  const groups = data?.groups || []

  const [query, setQuery] = useState('')
  const [person, setPerson] = useState(null)
  // true = dropdown ouvert, false = caché (personne sélectionnée ou pas encore tapé)
  const [showDropdown, setShowDropdown] = useState(false)

  const matches = useMemo(() => {
    if (!showDropdown || query.length < 2) return []
    const q = normalizeName(query)
    return people
      .filter((p) => normalizeName(p.search_text || p.display_name || '').includes(q))
      .slice(0, 12)
  }, [query, people, showDropdown])

  // group_ids vient de l'API comme une string "1;2" ou "1,2"
  // Les slots sont indexés par slot_id (pas group_id)
  const personSlots = useMemo(() => {
    if (!person) return []
    const ids = String(person.group_ids || '')
      .split(/[;,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)

    return ids
      .map((id) => {
        const group = groups.find((g) => String(g.group_id) === id)
        if (!group) return null
        const slot = slots.find((s) => String(s.slot_id) === String(group.slot_id))
        return {
          groupName: group.group_name,
          eta: slot?.eta || '',
          location: slot?.location || '',
          status: slot?.status || '',
          notes: slot?.notes || '',
        }
      })
      .filter(Boolean)
      .sort((a, b) => (a.eta || '99:99').localeCompare(b.eta || '99:99'))
  }, [person, groups, slots])

  if (loading) return <LoadingState message="Chargement des créneaux photos…" />
  if (error) return <ErrorState message="Impossible de charger les photos. Réessaie plus tard." />

  function selectPerson(item) {
    setPerson(item)
    setQuery(item.display_name)
    setShowDropdown(false)
  }

  return (
    <>
      <PageIntro eyebrow="Photos" title="Ton créneau photo, sans friction" description="Auto-complétion nom + carte de créneaux claire, utilisable en situation réelle." />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setPerson(null)
          setShowDropdown(true)
        }}
        onFocus={() => { if (query.length >= 2) setShowDropdown(true) }}
        placeholder="Tape prénom + nom"
      />
      {matches.length > 0 && (
        <div className="mt-2 space-y-1">
          {matches.map((item) => (
            <button key={item.person_id} onClick={() => selectPerson(item)} className="w-full text-left">
              <Card><CardContent>
                <p className="font-semibold">{item.display_name}</p>
              </CardContent></Card>
            </button>
          ))}
        </div>
      )}
      {person && (
        <Card className="mt-4">
          <CardContent>
            <p className="font-semibold text-lg">{person.display_name}</p>
            {personSlots.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">Aucun créneau trouvé.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {personSlots.map((slot, idx) => {
                  const eta = slot.eta ? String(slot.eta).match(/(\d{1,2}:\d{2})/)?.[1] ?? slot.eta : '--:--'
                  return (
                    <div key={idx} className="rounded-xl border border-border p-3 text-sm">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-bold">{slot.groupName}</p>
                        <p className="font-bold">{eta}</p>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(slot.status)}`}>
                          {statusLabel(slot.status)}
                        </span>
                        <span className="text-stone-500">📍 {slot.location || 'Lieu à confirmer'}</span>
                      </div>
                      <p className="mt-2 text-stone-400">⏱️ Sois là 5 min avant.</p>
                      {slot.notes && <p className="mt-1 text-stone-500">📝 {slot.notes}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
