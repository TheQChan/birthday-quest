import { useEffect, useMemo, useState } from 'react'
import { BIRTHDAY_GATE, QUESTS } from './data/quests'

const STAGE = {
  WELCOME: 'welcome',
  ACCESS: 'access',
  QUESTS: 'quests',
  FINISH: 'finish'
}

const SESSION_STORAGE_KEY = 'birthday-quest-session-v1'

const normalizeText = (value) => value.trim().toLowerCase()
const isValidStage = (value) => Object.values(STAGE).includes(value)

const getInitialSession = () => {
  if (typeof window === 'undefined') {
    return { stage: STAGE.WELCOME, currentQuestIndex: 0 }
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) {
      return { stage: STAGE.WELCOME, currentQuestIndex: 0 }
    }

    const parsed = JSON.parse(raw)
    const safeStage = isValidStage(parsed.stage) ? parsed.stage : STAGE.WELCOME
    const maxQuestIndex = Math.max(QUESTS.length - 1, 0)
    const safeQuestIndex = Number.isInteger(parsed.currentQuestIndex)
      ? Math.min(Math.max(parsed.currentQuestIndex, 0), maxQuestIndex)
      : 0

    if (!QUESTS.length && safeStage === STAGE.QUESTS) {
      return { stage: STAGE.FINISH, currentQuestIndex: 0 }
    }

    return { stage: safeStage, currentQuestIndex: safeQuestIndex }
  } catch {
    return { stage: STAGE.WELCOME, currentQuestIndex: 0 }
  }
}

function App() {
  const initialSession = getInitialSession()
  const [stage, setStage] = useState(initialSession.stage)

  const [birthTime, setBirthTime] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gateError, setGateError] = useState('')

  const [currentQuestIndex, setCurrentQuestIndex] = useState(initialSession.currentQuestIndex)
  const [questAnswer, setQuestAnswer] = useState('')
  const [questError, setQuestError] = useState('')

  const currentQuest = QUESTS[currentQuestIndex]
  const completedCount = currentQuestIndex
  const progressPercent = useMemo(() => {
    if (QUESTS.length === 0) return 100
    return Math.round((completedCount / QUESTS.length) * 100)
  }, [completedCount])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        stage,
        currentQuestIndex
      })
    )
  }, [stage, currentQuestIndex])

  const handleGateSubmit = (event) => {
    event.preventDefault()

    const validTime = normalizeText(birthTime) === normalizeText(BIRTHDAY_GATE.time)
    const validDate = normalizeText(birthDate) === normalizeText(BIRTHDAY_GATE.date)

    if (!validTime || !validDate) {
      setGateError('Неверно. Попробуй еще раз: формат 00:00 и 8-4-2005.')
      return
    }

    setGateError('')
    setBirthDate('')
    setBirthTime('')
    setStage(QUESTS.length ? STAGE.QUESTS : STAGE.FINISH)
  }

  const handleQuestSubmit = (event) => {
    event.preventDefault()

    if (!currentQuest) {
      setStage(STAGE.FINISH)
      return
    }

    const isCorrect = normalizeText(questAnswer) === normalizeText(currentQuest.answer)
    if (!isCorrect) {
      setQuestError('Ответ неверный. Подумай еще.')
      return
    }

    setQuestError('')
    setQuestAnswer('')

    const nextQuest = currentQuestIndex + 1
    if (nextQuest >= QUESTS.length) {
      setStage(STAGE.FINISH)
      return
    }

    setCurrentQuestIndex(nextQuest)
  }

  return (
    <main className="page-wrap">
      <div className="bg-glow bg-glow--one" aria-hidden="true" />
      <div className="bg-glow bg-glow--two" aria-hidden="true" />

      {stage === STAGE.WELCOME && (
        <section className="card hero-card">
          <p className="eyebrow">Birthday Quest</p>
          <h1>С днем рождения, Илья</h1>
          <p className="lead-text">
            Если ты Илья и у тебя день рождения, нажми кнопку, чтобы войти в квест.
          </p>
          <button className="btn btn-primary" onClick={() => setStage(STAGE.ACCESS)}>
            Войти
          </button>
        </section>
      )}

      {stage === STAGE.ACCESS && (
        <section className="card form-card">
          <h2>Проверка доступа</h2>
          <p className="muted">Во сколько ты родился? Формат: часы:минуты и день-месяц-год</p>

          <form onSubmit={handleGateSubmit} className="form-stack">
            <label className="field">
              <span>Время рождения</span>
              <input
                type="text"
                placeholder="00:00"
                value={birthTime}
                onChange={(event) => setBirthTime(event.target.value)}
                autoComplete="off"
                required
              />
            </label>

            <label className="field">
              <span>Дата рождения</span>
              <input
                type="text"
                placeholder="8-4-2005"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                autoComplete="off"
                required
              />
            </label>

            {gateError && <p className="error-text">{gateError}</p>}

            <div className="action-row">
              <button type="button" className="btn btn-ghost" onClick={() => setStage(STAGE.WELCOME)}>
                Назад
              </button>
              <button type="submit" className="btn btn-primary">
                Проверить
              </button>
            </div>
          </form>
        </section>
      )}

      {stage === STAGE.QUESTS && (
        <section className="card roadmap-card">
          <h2>Роадмап квеста</h2>

          <div className="progress-shell">
            <div className="progress-meta">
              <span>
                Пройдено: {completedCount} / {QUESTS.length}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <ul className="quest-list">
            {QUESTS.map((quest, index) => {
              const isDone = index < currentQuestIndex
              const isActive = index === currentQuestIndex
              const isLocked = index > currentQuestIndex

              return (
                <li
                  key={quest.id}
                  className={`quest-item ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                >
                  <p className="quest-title">{quest.title}</p>
                  <p className="quest-state">
                    {isDone && 'Выполнен'}
                    {isActive && 'Текущий'}
                    {isLocked && 'Закрыт'}
                  </p>
                </li>
              )
            })}
          </ul>

          {currentQuest && (
            <form onSubmit={handleQuestSubmit} className="form-stack quest-form">
              <label className="field">
                <span>{currentQuest.question}</span>
                <input
                  type="text"
                  placeholder="Твой ответ"
                  value={questAnswer}
                  onChange={(event) => setQuestAnswer(event.target.value)}
                  autoComplete="off"
                  required
                />
              </label>
              {questError && <p className="error-text">{questError}</p>}
              <button type="submit" className="btn btn-primary">
                Ответить
              </button>
            </form>
          )}
        </section>
      )}

      {stage === STAGE.FINISH && (
        <section className="card finish-card">
          <p className="eyebrow">Mission Complete</p>
          <h2>Квест завершен</h2>
          <p className="lead-text">С днем рождения, Илья! Пусть этот год будет ярким и сильным.</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem(SESSION_STORAGE_KEY)
              }
              setCurrentQuestIndex(0)
              setQuestAnswer('')
              setQuestError('')
              setStage(STAGE.WELCOME)
            }}
          >
            Пройти снова
          </button>
        </section>
      )}
    </main>
  )
}

export default App
