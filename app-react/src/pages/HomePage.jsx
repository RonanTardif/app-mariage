import { CalendarDays, Camera, CircleHelp, MapPinned, MessageCircle, Trophy, BedDouble, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageIntro } from '../components/shared/PageIntro'
import { Card, CardContent } from '../components/ui/card'

const links = [
  { to: '/programme', title: 'Programme', icon: CalendarDays, desc: 'Timeline dynamique du week-end' },
  { to: '/plan', title: 'Plan du domaine', icon: MapPinned, desc: 'Lieux, repères et descriptions' },
  { to: '/chambres', title: 'Chambres', icon: BedDouble, desc: 'Trouver son hébergement' },
  { to: '/photos', title: 'Photos groupe', icon: Camera, desc: 'Retrouver son créneau' },
  { to: '/quiz', title: 'Quiz', icon: CircleHelp, desc: 'Jeu mariés + score' },
  { to: '/leaderboard', title: 'Leaderboard', icon: Trophy, desc: 'Classement en direct' },
  { to: '/infos', title: 'Infos', icon: Info, desc: 'Kit de survie invités' },
  { to: '/whatsapp', title: 'WhatsApp', icon: MessageCircle, desc: 'Contacter la team orga' },
]

export function HomePage() {
  return (
    <>
      <PageIntro eyebrow="Accueil" title="Tout le mariage, dans une app claire" description="Navigation simple, mobile-first, et lisible en quelques secondes." />
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((item) => (
          <Link key={item.to} to={item.to}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-xl">
              <CardContent>
                <item.icon className="text-rose-600" size={18} />
                <p className="mt-2 font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-stone-600">{item.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  )
}
