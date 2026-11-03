import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { TopBar } from '@/components/ui'
import Questionnaire from '@/features/onboarding/Questionnaire'
import { CATEGORY_BY_ID, QUESTIONS } from '@/data/questions'
import { useApp } from '@/store/useApp'
import { useToast } from '@/store/useToast'
import './Account.css'

export default function EditAnswers() {
  const answers = useApp((s) => s.me.answers)
  const setAnswer = useApp((s) => s.setAnswer)
  const toast = useToast((s) => s.show)
  const [editing, setEditing] = useState<number | null>(null)

  if (editing != null) {
    return (
      <div className="screen">
        <TopBar back onBack={() => (editing > 0 ? setEditing(editing - 1) : setEditing(null))} title="Modifier mes réponses" />
        <Questionnaire
          index={editing}
          answers={answers}
          onAnswer={setAnswer}
          onIndexChange={setEditing}
          onFinish={() => {
            setEditing(null)
            toast('Réponses enregistrées')
          }}
        />
      </div>
    )
  }

  return (
    <div className="screen">
      <TopBar back title="Mes réponses" />
      <div className="scroll sub-body">
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.5 }}>
          Tes réponses ne sont jamais montrées telles quelles : elles servent à calculer ta compatibilité. Touche une question pour la modifier.
        </p>
        <ul className="answer-list">
          {QUESTIONS.map((q, i) => {
            const v = answers[q.id]
            const label = Array.isArray(v)
              ? v.map((id) => q.options.find((o) => o.id === id)?.label).filter(Boolean).join(', ')
              : q.options.find((o) => o.id === v)?.label
            const cat = CATEGORY_BY_ID[q.category]
            return (
              <li key={q.id}>
                <button className="answer-item" onClick={() => setEditing(i)}>
                  <span>
                    <small style={{ color: cat.color }}>{cat.short}</small>
                    <b>{q.title}</b>
                    <em>{label || 'Pas encore répondu'}</em>
                  </span>
                  <ChevronRight size={18} className="row-chevron" />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
