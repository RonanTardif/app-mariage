import { useState } from 'react'
import { PageIntro } from '../components/shared/PageIntro'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAsyncData } from '../hooks/useAsyncData'
import { getQuiz, submitScore } from '../services/dataService'

export function QuizPage() {
  const { data } = useAsyncData(getQuiz, [])
  const questions = data?.questions || []
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [name, setName] = useState('')
  const [done, setDone] = useState(false)

  if (!questions.length) return <p>Chargement du quiz…</p>

  const q = questions[index]
  const score = answers.filter((a, i) => a === questions[i].answer_index).length

  const choose = (v) => {
    const next = [...answers]
    next[index] = v
    setAnswers(next)
    if (index < questions.length - 1) setIndex(index + 1)
    else setDone(true)
  }

  return (
    <>
      <PageIntro eyebrow="Quiz" title="Gameplay rapide, score immédiat" description="Parcours question par question, feedback clair, et publication facile au leaderboard." />
      {!done ? (
        <Card>
          <CardContent>
            <p className="text-xs text-stone-500">Question {index + 1}/{questions.length}</p>
            <p className="mt-2 font-semibold">{q.question}</p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, i) => (
                <Button key={i} variant="secondary" className="w-full justify-start" onClick={() => choose(i)}>{opt}</Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <p className="text-xl font-semibold">Score : {score}/{questions.length}</p>
            <Input className="mt-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ton pseudo" />
            <Button className="mt-3 w-full" onClick={() => submitScore({ player: name || 'Anonyme', score, total: questions.length, created_at: new Date().toISOString() })}>Envoyer mon score</Button>
          </CardContent>
        </Card>
      )}
    </>
  )
}
