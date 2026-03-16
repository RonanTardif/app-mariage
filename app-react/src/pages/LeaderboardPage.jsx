import { PageIntro } from '../components/shared/PageIntro'
import { Card, CardContent } from '../components/ui/card'
import { useAsyncData } from '../hooks/useAsyncData'
import { getLeaderboard } from '../services/dataService'

export function LeaderboardPage() {
  const { data = [] } = useAsyncData(getLeaderboard, [])
  const rows = [...data].sort((a, b) => b.score - a.score).slice(0, 10)

  return (
    <>
      <PageIntro eyebrow="Leaderboard" title="Top 10 live" description="Vue projection lisible et adaptée au mobile comme à un écran partagé." />
      <Card>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-stone-500"><th>#</th><th>Joueur</th><th>Score</th></tr></thead>
            <tbody>
              {rows.map((r, i) => <tr key={i} className="border-t border-border"><td className="py-2">{i + 1}</td><td>{r.player}</td><td>{r.score}</td></tr>)}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  )
}
