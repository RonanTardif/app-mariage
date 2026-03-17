import { Heart } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'

const navItems = [
  { to: '/', label: 'Accueil' },
  { to: '/programme', label: 'Programme' },
  { to: '/plan', label: 'Plan' },
  { to: '/chambres', label: 'Chambres' },
  { to: '/album', label: 'Album' },
]

export function AppShell({ children }) {
  return (
    <div className="mx-auto min-h-screen max-w-5xl pb-24">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-rose-100 p-2 text-rose-700">
              <Heart size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold">Ronan & Lorie</p>
              <p className="text-xs text-stone-500">Nouvelle expérience mariage</p>
            </div>
          </div>
        </div>
      </header>
      <main className="px-4 py-5">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white/95 px-2 py-2 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-xl py-2 text-center text-xs font-medium transition',
                  isActive ? 'bg-sage-100 text-sage-700' : 'text-stone-500 hover:bg-stone-100',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
