import { useEffect, useMemo, useRef, useState } from 'react'
import { BIRTHDAY_GATE, QUESTS } from './data/quests'

const STAGE = {
  WELCOME: 'welcome',
  ACCESS: 'access',
  QUESTS: 'quests',
  FINISH: 'finish'
}

const QUEST_PHASE = {
  PRIMARY: 'primary',
  FOLLOW_UP: 'follow_up'
}

const SESSION_STORAGE_KEY = 'birthday-quest-session-v1'
const TIME_FORMAT = /^\d{2}-\d{2}$/
const DATE_FORMAT = /^\d{2}-\d{2}-\d{4}$/

const normalizeText = (value) => value.trim().toLowerCase()
const isValidStage = (value) => Object.values(STAGE).includes(value)
const resolveAssetPath = (path) => {
  if (!path) return ''
  if (/^(https?:)?\/\//.test(path)) return path
  const normalizedPath = path.replace(/^\/+/, '')
  return `${import.meta.env.BASE_URL}${normalizedPath}`
}

const getQuestAnswerOptions = (quest) => {
  if (Array.isArray(quest?.answers) && quest.answers.length > 0) {
    return quest.answers.map((answer) => normalizeText(String(answer)))
  }

  if (typeof quest?.answer === 'string' && quest.answer.trim().length > 0) {
    return [normalizeText(quest.answer)]
  }

  return []
}

const getFollowUpAnswerOptions = (quest) => {
  if (Array.isArray(quest?.followUp?.answers) && quest.followUp.answers.length > 0) {
    return quest.followUp.answers.map((answer) => normalizeText(String(answer)))
  }

  return []
}

const getInitialSession = () => {
  if (typeof window === 'undefined') {
    return { stage: STAGE.WELCOME, currentQuestIndex: 0, selectedQuestIndex: 0, questPhase: QUEST_PHASE.PRIMARY }
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) {
      return { stage: STAGE.WELCOME, currentQuestIndex: 0, selectedQuestIndex: 0, questPhase: QUEST_PHASE.PRIMARY }
    }

    const parsed = JSON.parse(raw)
    const safeStage = isValidStage(parsed.stage) ? parsed.stage : STAGE.WELCOME
    const maxQuestIndex = Math.max(QUESTS.length - 1, 0)

    const safeQuestIndex = Number.isInteger(parsed.currentQuestIndex)
      ? Math.min(Math.max(parsed.currentQuestIndex, 0), maxQuestIndex)
      : 0

    const rawSelectedQuestIndex = Number.isInteger(parsed.selectedQuestIndex) ? parsed.selectedQuestIndex : 0
    const safeSelectedQuestIndex = Math.min(Math.max(rawSelectedQuestIndex, 0), safeQuestIndex)
    const safeQuestPhase = Object.values(QUEST_PHASE).includes(parsed.questPhase)
      ? parsed.questPhase
      : QUEST_PHASE.PRIMARY

    if (!QUESTS.length && safeStage === STAGE.QUESTS) {
      return { stage: STAGE.FINISH, currentQuestIndex: 0, selectedQuestIndex: 0, questPhase: QUEST_PHASE.PRIMARY }
    }

    return {
      stage: safeStage,
      currentQuestIndex: safeQuestIndex,
      selectedQuestIndex: safeSelectedQuestIndex,
      questPhase: safeQuestPhase
    }
  } catch {
    return { stage: STAGE.WELCOME, currentQuestIndex: 0, selectedQuestIndex: 0, questPhase: QUEST_PHASE.PRIMARY }
  }
}

function App() {
  const initialSession = getInitialSession()
  const feedbackTimerRef = useRef(null)

  const [stage, setStage] = useState(initialSession.stage)

  const [birthTime, setBirthTime] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [dollarPrice, setDollarPrice] = useState('')
  const [gateError, setGateError] = useState('')

  const [currentQuestIndex, setCurrentQuestIndex] = useState(initialSession.currentQuestIndex)
  const [selectedQuestIndex, setSelectedQuestIndex] = useState(initialSession.selectedQuestIndex)
  const [questPhase, setQuestPhase] = useState(initialSession.questPhase || QUEST_PHASE.PRIMARY)

  const [questAnswer, setQuestAnswer] = useState('')
  const [followUpAnswer, setFollowUpAnswer] = useState('')
  const [questError, setQuestError] = useState('')
  const [followUpError, setFollowUpError] = useState('')
  const [detailFx, setDetailFx] = useState('')

  const selectedQuest = QUESTS[selectedQuestIndex]
  const currentQuest = QUESTS[currentQuestIndex]
  const currentQuestHasFollowUp = Boolean(currentQuest?.followUp)

  const completedCount = Math.min(currentQuestIndex, QUESTS.length)
  const progressPercent = useMemo(() => {
    if (QUESTS.length === 0) return 100
    return Math.round((completedCount / QUESTS.length) * 100)
  }, [completedCount])

  useEffect(() => {
    if (selectedQuestIndex > currentQuestIndex) {
      setSelectedQuestIndex(currentQuestIndex)
    }
  }, [currentQuestIndex, selectedQuestIndex])

  useEffect(() => {
    if (!currentQuestHasFollowUp && questPhase === QUEST_PHASE.FOLLOW_UP) {
      setQuestPhase(QUEST_PHASE.PRIMARY)
    }
  }, [currentQuestHasFollowUp, questPhase])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        stage,
        currentQuestIndex,
        selectedQuestIndex,
        questPhase
      })
    )
  }, [stage, currentQuestIndex, selectedQuestIndex, questPhase])

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  const triggerDetailFx = (type) => {
    setDetailFx(type)
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current)
    }
    feedbackTimerRef.current = setTimeout(() => {
      setDetailFx('')
    }, 520)
  }

  const gotoNextQuest = (options = {}) => {
    const { keepSelectedOnCurrent = false } = options
    const nextQuest = currentQuestIndex + 1
    if (nextQuest >= QUESTS.length) {
      setStage(STAGE.FINISH)
      return
    }

    const completedQuestIndex = currentQuestIndex
    setCurrentQuestIndex(nextQuest)
    setSelectedQuestIndex(keepSelectedOnCurrent ? completedQuestIndex : nextQuest)
    setQuestPhase(QUEST_PHASE.PRIMARY)
  }

  const handleGateSubmit = (event) => {
    event.preventDefault()

    const timeValue = birthTime.trim()
    const dateValue = birthDate.trim()
    const formatValid = TIME_FORMAT.test(timeValue) && DATE_FORMAT.test(dateValue)

    if (!formatValid) {
      setGateError('Неверный формат. Используй HH-MM и DD-MM-YYYY.')
      return
    }

    const validTime = normalizeText(birthTime) === normalizeText(BIRTHDAY_GATE.time)
    const validDate = normalizeText(birthDate) === normalizeText(BIRTHDAY_GATE.date)
    const validDollarRate = BIRTHDAY_GATE.dollarRates.includes(normalizeText(dollarPrice))

    if (!validTime || !validDate || !validDollarRate) {
      setGateError('Неверно. Проверь формат и попробуй еще раз.')
      return
    }

    setGateError('')
    setBirthDate('')
    setBirthTime('')
    setDollarPrice('')
    setSelectedQuestIndex(currentQuestIndex)
    setQuestPhase(QUEST_PHASE.PRIMARY)
    setStage(QUESTS.length ? STAGE.QUESTS : STAGE.FINISH)
  }

  const handleQuestSubmit = (event) => {
    event.preventDefault()

    if (!currentQuest) {
      setStage(STAGE.FINISH)
      return
    }

    const userAnswer = normalizeText(questAnswer)
    const validAnswers = getQuestAnswerOptions(currentQuest)
    const isCorrect = validAnswers.includes(userAnswer)
    if (!isCorrect) {
      setQuestError('Ответ неверный. Подумай еще.')
      triggerDetailFx('error')
      return
    }

    setQuestError('')
    setQuestAnswer('')
    triggerDetailFx('success')

    if (currentQuestHasFollowUp) {
      setFollowUpAnswer('')
      setFollowUpError('')
      setQuestPhase(QUEST_PHASE.FOLLOW_UP)
      return
    }

    gotoNextQuest({ keepSelectedOnCurrent: true })
  }

  const handleFollowUpSubmit = (event) => {
    event.preventDefault()

    if (!currentQuestHasFollowUp) {
      return
    }

    const userAnswer = normalizeText(followUpAnswer)
    const validAnswers = getFollowUpAnswerOptions(currentQuest)
    const isCorrect = validAnswers.includes(userAnswer)
    if (!isCorrect) {
      setFollowUpError('Второй ответ неверный. Проверь место и попробуй снова.')
      triggerDetailFx('error')
      return
    }

    setFollowUpError('')
    setFollowUpAnswer('')
    triggerDetailFx('success')
    gotoNextQuest({ keepSelectedOnCurrent: true })
  }

  const handleTimelineClick = (index) => {
    if (index > currentQuestIndex) return
    setQuestError('')
    setFollowUpError('')
    setSelectedQuestIndex(index)
  }

  const downloadCertificate = () => {
    if (typeof window === 'undefined') return

    const canvas = document.createElement('canvas')
    canvas.width = 1600
    canvas.height = 900
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#1a0407')
    gradient.addColorStop(0.55, '#54080f')
    gradient.addColorStop(1, '#120305')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const glow = ctx.createRadialGradient(280, 180, 10, 280, 180, 380)
    glow.addColorStop(0, 'rgba(255, 78, 78, 0.45)')
    glow.addColorStop(1, 'rgba(255, 78, 78, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = 'rgba(255, 170, 170, 0.55)'
    ctx.lineWidth = 3
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120)

    ctx.fillStyle = '#ffd8d8'
    ctx.font = '700 46px Manrope'
    ctx.fillText('СЕРТИФИКАТ ПРОХОЖДЕНИЯ', 120, 190)

    ctx.fillStyle = '#ffffff'
    ctx.font = '900 92px Manrope'
    ctx.fillText('ИЛЬЯ', 120, 330)

    ctx.fillStyle = '#ffe8e8'
    ctx.font = '600 44px Manrope'
    ctx.fillText('Прошел Неебический Квест', 120, 420)

    ctx.fillStyle = '#ffbcbc'
    ctx.font = '500 36px Manrope'
    ctx.fillText(`Квестов закрыто: ${QUESTS.length}`, 120, 500)
    ctx.fillText(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 120, 560)

    ctx.fillStyle = '#ffd8d8'
    ctx.font = '500 28px Manrope'
    ctx.fillText('Birthday Quest', 120, 760)

    const link = document.createElement('a')
    link.download = 'birthday-quest-certificate.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const isSelectedCurrent = selectedQuestIndex === currentQuestIndex
  const isSelectedDone = selectedQuestIndex < currentQuestIndex

  return (
    <main className="page-wrap">
      <div className="bg-glow bg-glow--one" aria-hidden="true" />
      <div className="bg-glow bg-glow--two" aria-hidden="true" />

      {stage === STAGE.WELCOME && (
        <section className="card hero-card">
          <p className="eyebrow">Birthday Quest</p>
          <h1>С днем рождения, Илья</h1>
          <p className="lead-text">
            Если ты Илья и у тебя день рождения, нажми кнопку, чтобы получить доступ к контенту на сайте.
          </p>
          <button className="btn btn-primary" onClick={() => setStage(STAGE.ACCESS)}>
            Войти
          </button>
        </section>
      )}

      {stage === STAGE.ACCESS && (
        <section className="card form-card">
          <h2>Проверка Ильинности</h2>
          <p className="muted">Заполни поля в формате HH-MM и DD-MM-YYYY, затем укажи цену доллара в момент твоего рождения.</p>

          <form onSubmit={handleGateSubmit} className="form-stack">
            <label className="field">
              <span>Время рождения</span>
              <input
                type="text"
                placeholder="12-30"
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
                placeholder="15-09-2001"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                autoComplete="off"
                required
              />
            </label>

            <label className="field">
              <span>Цена доллара</span>
              <input
                type="text"
                placeholder="Например: 30"
                value={dollarPrice}
                onChange={(event) => setDollarPrice(event.target.value)}
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
          <h2>Неебический Квест</h2>
          <p className="muted">Привет, Илья! Этот Неебический Квест создан специально в честь дня твоего рождения. Пройди все задания и в конце тебя ждет маленький бонус.</p>

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

          <div className="timeline" role="list" aria-label="Квест-таймлайн">
            <div className="timeline-line" aria-hidden="true" />
            {QUESTS.map((quest, index) => {
              const isDone = index < currentQuestIndex
              const isCurrent = index === currentQuestIndex
              const isLocked = index > currentQuestIndex
              const isSelected = index === selectedQuestIndex

              return (
                <article
                  key={quest.id}
                  className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'} ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''} ${isSelected ? 'selected' : ''}`}
                  role="listitem"
                >
                  <button
                    type="button"
                    className="timeline-node"
                    onClick={() => handleTimelineClick(index)}
                    disabled={isLocked}
                    aria-label={`${quest.title}. ${isCurrent ? 'Текущий квест' : isDone ? 'Выполнен' : 'Закрыт'}`}
                  />

                  <button
                    type="button"
                    className="timeline-card"
                    onClick={() => handleTimelineClick(index)}
                    disabled={isLocked}
                  >
                    <p className="timeline-title">{quest.title}</p>
                    <p className="timeline-status">
                      {isDone && 'Выполнен'}
                      {isCurrent && 'Текущий'}
                      {isLocked && 'Закрыт'}
                    </p>
                  </button>
                </article>
              )
            })}
          </div>

          {selectedQuest && (
            <div className={`quest-detail ${detailFx === 'success' ? 'quest-detail--success' : ''} ${detailFx === 'error' ? 'quest-detail--error' : ''}`}>
              <p className="quest-detail-title">{selectedQuest.title}</p>
              {isSelectedCurrent && <p className="quest-detail-question">{selectedQuest.question}</p>}

              {isSelectedCurrent ? (
                <>
                  {questPhase === QUEST_PHASE.PRIMARY && (
                    <form onSubmit={handleQuestSubmit} className="form-stack quest-form">
                      <label className="field">
                        <span>Ответ</span>
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

                  {questPhase === QUEST_PHASE.FOLLOW_UP && currentQuestHasFollowUp && (
                    <div className="followup-wrap">
                      <div className="quest-photo-card">
                        <img
                          src={resolveAssetPath(currentQuest.followUp.imagePath)}
                          alt={`Подсказка для ${currentQuest.title}`}
                          className="quest-photo"
                        />
                        <p className="quest-photo-caption">Локация подсказки</p>
                      </div>
                      <p className="followup-coordinates">
                        Координаты: <strong>{currentQuest.followUp.coordinates}</strong>
                      </p>

                      <form onSubmit={handleFollowUpSubmit} className="form-stack quest-form">
                        <label className="field">
                          <span>{currentQuest.followUp.prompt || 'Напиши здесь то, что там найдешь'}</span>
                          <input
                            type="text"
                            placeholder="Второй ответ"
                            value={followUpAnswer}
                            onChange={(event) => setFollowUpAnswer(event.target.value)}
                            autoComplete="off"
                            required
                          />
                        </label>
                        {followUpError && <p className="error-text">{followUpError}</p>}
                        <button type="submit" className="btn btn-primary">
                          Подтвердить
                        </button>
                      </form>
                    </div>
                  )}
                </>
              ) : isSelectedDone && selectedQuest.completionCard?.imagePath ? (
                <div className="followup-wrap">
                  <div className="quest-photo-card">
                    <img
                      src={resolveAssetPath(selectedQuest.completionCard.imagePath)}
                      alt={`Фото друзей после ${selectedQuest.title}`}
                      className="quest-photo"
                    />
                    <p className="quest-photo-caption">
                      {selectedQuest.completionCard.caption || 'Квест выполнен'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="muted">Этот квест уже выполнен. Выбери светящийся узел текущего квеста для ответа.</p>
              )}
            </div>
          )}
        </section>
      )}

      {stage === STAGE.FINISH && (
        <section className="card finish-card certificate-card">
          <p className="eyebrow">Mission Complete</p>
          <h2>Квест завершен</h2>
          <p className="lead-text">С днем рождения, Илья! Пусть этот год будет ярким и сильным.</p>
          
          <div className="certificate-preview">
            <p className="certificate-label">Сертификат</p>
            <p className="certificate-name">Илья</p>
            <p className="certificate-meta">Пройдено заданий: {QUESTS.length}</p>
            <p className="certificate-meta">Дата: {new Date().toLocaleDateString('ru-RU')}</p>
          </div>
          <br></br>
          <div className="action-row action-row--center">
            <button className="btn btn-ghost" onClick={downloadCertificate}>
              Скачать сертификат
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem(SESSION_STORAGE_KEY)
                }
                setCurrentQuestIndex(0)
                setSelectedQuestIndex(0)
                setQuestPhase(QUEST_PHASE.PRIMARY)
                setQuestAnswer('')
                setFollowUpAnswer('')
                setQuestError('')
                setFollowUpError('')
                setDetailFx('')
                setStage(STAGE.WELCOME)
              }}
            >
              Пройти снова
            </button>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
