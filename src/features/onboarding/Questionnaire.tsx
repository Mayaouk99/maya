import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { CATEGORY_BY_ID, QUESTIONS, isQuestionAnswered, type Answers } from '@/data/questions'
import { Button } from '@/components/ui'
import { tap } from '@/lib/haptics'
import './Questionnaire.css'

/**
 * Questionnaire de compatibilité, une question par écran.
 * Contrôlé par le parent (index), pour que le bouton retour de l'écran fonctionne question par question.
 */
export default function Questionnaire({
  index,
  answers,
  onAnswer,
  onIndexChange,
  onFinish,
}: {
  index: number
  answers: Answers
  onAnswer: (id: string, v: string | string[]) => void
  onIndexChange: (i: number) => void
  onFinish: () => void
}) {
  const q = QUESTIONS[index]
  const cat = CATEGORY_BY_ID[q.category]
  const value = answers[q.id]

  const next = () => (index < QUESTIONS.length - 1 ? onIndexChange(index + 1) : onFinish())

  const choose = (id: string) => {
    tap()
    if (q.kind === 'multi') {
      const cur = Array.isArray(value) ? value : []
      if (cur.includes(id)) onAnswer(q.id, cur.filter((x) => x !== id))
      else if (cur.length < (q.max ?? 3)) onAnswer(q.id, [...cur, id])
      return
    }
    onAnswer(q.id, id)
    window.setTimeout(next, 260)
  }

  return (
    <div className="quiz">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={q.id}
          className="quiz-card"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="quiz-meta">
            <span className="quiz-cat" style={{ color: cat.color, background: `${cat.color}1f` }}>
              {cat.short}
            </span>
            <span className="quiz-count">
              {index + 1} / {QUESTIONS.length}
            </span>
          </div>
          <h2 className="quiz-title">{q.title}</h2>
          {q.hint && <p className="quiz-hint">{q.hint}</p>}

          <ul className={`quiz-options ${q.kind === 'multi' ? 'is-multi' : ''}`}>
            {q.options.map((o) => {
              const selected = Array.isArray(value) ? value.includes(o.id) : value === o.id
              return (
                <li key={o.id}>
                  <button className={`quiz-option ${selected ? 'is-selected' : ''}`} onClick={() => choose(o.id)} aria-pressed={selected}>
                    <span className="quiz-emoji">{o.emoji}</span>
                    <span className="quiz-label">{o.label}</span>
                    <span className="quiz-check">{selected && <Check size={15} strokeWidth={3} />}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </motion.div>
      </AnimatePresence>

      {(q.kind === 'multi' || isQuestionAnswered(q, answers)) && (
        <div className="quiz-footer">
          <Button block onClick={next} disabled={!isQuestionAnswered(q, answers)}>
            {index < QUESTIONS.length - 1 ? 'Continuer' : 'Terminer'}
          </Button>
        </div>
      )}
    </div>
  )
}
