import { useState } from 'react'
import { PageIntro } from '../components/shared/PageIntro'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAsyncData } from '../hooks/useAsyncData'
import { getQuiz, submitScore } from '../services/dataService'
import { LoadingState, ErrorState } from '../components/shared/LoadingState'

export function QuizPage() {
  const { data, loading, error } = useAsyncData(getQuiz, [])
  const questions = data?.questions || []

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [name, setName] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  if (loading) return <LoadingState message="Chargement du quiz…" />
  if (error) return <ErrorState message="Impossible de charger le quiz. Réessaie plus tard." />

  const q = questions[index]
  const score = answers.filter((a, i) => a === questions[i]?.answer_index).length

  const choose = (v) => {
    const next = [...answers]
    next[index] = v
    setAnswers(next)
    if (index < questions.length - 1) setIndex(index + 1)
    else setDone(true)
  }

  const handleSubmit = async () => {
    if (submitting || submitted) return
    setSubmitting(true)
    setSubmitError(null)

    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const entry = {
      player: name.trim() || 'Anonyme',
      score,
      total: questions.length,
      answered: answers.length,
      time,
      created_at: now.toISOString(),
    }

    try {
      await submitScore(entry)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err?.message || "Erreur lors de l'envoi.")
    } finally {
      setSubmitting(false)
    }
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
                <Button key={i} variant="secondary" className="w-full justify-start" onClick={() => choose(i)}>
                  {opt}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <p className="text-xl font-semibold">Score : {score}/{questions.length}</p>

            {submitted ? (
              <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-4 text-center">
                <p className="text-green-700 font-semibold">✅ Score envoyé !</p>
                <p className="mt-1 text-sm text-green-600">Tu apparaîtras bientôt sur le leaderboard.</p>
              </div>
            ) : (
              <>
                <Input
                  className="mt-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ton pseudo"
                  disabled={submitting}
                />
                <Button
                  className="mt-3 w-full"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Envoi en cours…' : 'Envoyer mon score'}
                </Button>
                {submitError && (
                  <p className="mt-2 text-sm text-red-600">{submitError}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
