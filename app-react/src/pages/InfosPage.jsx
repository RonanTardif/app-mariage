import { Info, Sparkles, ShowerHead, MessageCircleMore } from 'lucide-react'
import { PageIntro } from '../components/shared/PageIntro'
import { Card, CardContent } from '../components/ui/card'

const infos = [
  { title: 'Kit de survie', text: 'Un kit pratique vous attend directement dans votre chambre.', icon: Sparkles },
  { title: 'Essentiels sur place', text: 'Toilettes et salles de bain équipées pour tout le week-end.', icon: ShowerHead },
  { title: 'Besoin d’aide ?', text: 'La team orga reste joignable rapidement via WhatsApp.', icon: MessageCircleMore },
]

export function InfosPage() {
  return (
    <>
      <PageIntro eyebrow="Infos pratiques" title="Les essentiels sans charge mentale" description="Contenu synthétique, hiérarchisé, pensé pour les moments pressés." />
      <div className="space-y-3">
        {infos.map((item) => (
          <Card key={item.title}><CardContent><item.icon className="text-sage-700" size={18} /><p className="mt-2 font-semibold">{item.title}</p><p className="text-sm text-stone-600">{item.text}</p></CardContent></Card>
        ))}
      </div>
      <div className="mt-3 inline-flex items-center gap-2 text-sm text-stone-500"><Info size={14} /> Lisible même pendant l'événement.</div>
    </>
  )
}
