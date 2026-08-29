import { useEffect, useRef } from 'react'
import { redeemStarBonus } from './actions'
import { STAGES } from './stages'
import { MAX_HP, useHud } from './state'
import type { StageConfig } from './stages/types'

function Hearts({ hp }: { hp: number }) {
  return (
    <div className="hearts">
      {Array.from({ length: MAX_HP }, (_, i) => (
        <span key={i} className={i < hp ? 'heart on' : 'heart'}>
          ♥
        </span>
      ))}
    </div>
  )
}

export function Hud({
  stage,
  nextStage,
  onStart,
  onResume,
  onRestart,
  onNext,
  onSelectStage,
  onTitle,
}: {
  stage: StageConfig
  nextStage: StageConfig | null
  onStart: () => void
  onResume: () => void
  onRestart: () => void
  onNext: () => void
  onSelectStage: (id: number) => void
  onTitle: () => void
}) {
  const hud = useHud()
  const progress = Math.min(1, hud.distance / hud.goal)

  // 클리어 화면에서 별을 하나씩 터뜨리며 100점씩 더한다
  const tallyActive = hud.status === 'clear'
  const tallyTimer = useRef<number | null>(null)
  useEffect(() => {
    if (!tallyActive) return
    tallyTimer.current = window.setInterval(() => {
      if (!redeemStarBonus()) {
        if (tallyTimer.current !== null) window.clearInterval(tallyTimer.current)
        tallyTimer.current = null
      }
    }, 130)
    return () => {
      if (tallyTimer.current !== null) window.clearInterval(tallyTimer.current)
      tallyTimer.current = null
    }
  }, [tallyActive])

  return (
    <div className="hud" style={{ ['--accent' as string]: stage.uiAccent }}>
      <div className={hud.power > 0 ? 'vignette boosting' : 'vignette'} />
      <div className="hud-top">
        <div className="hud-stage">
          <b>{stage.title}</b>
          <span>{stage.subtitle}</span>
        </div>
        <div className="hud-center">
          <Hearts hp={hud.hp} />
          <div className="score-digital">
            <span className="score-ghost">888888</span>
            <span className="score-value">{String(hud.score).padStart(6, '0')}</span>
          </div>
          {hud.power > 0 && (
            <>
              <div className="booster-banner">BOOSTER ON!!!</div>
              <div className="booster-countdown">{hud.power.toFixed(1)}</div>
            </>
          )}
          {hud.combo >= 2 && <span className="combo-tag">{hud.combo} COMBO</span>}
        </div>
        <div className="hud-spacer" />
      </div>

      <div className="hud-bottom">
        <div className="bar">
          <div className="bar-fill" style={{ width: `${progress * 100}%` }} />
          <div className="bar-plane" style={{ left: `${progress * 100}%` }}>
            ✈
          </div>
        </div>
        <div className="bar-meta">
          <span>
            {Math.floor(hud.distance)} / {hud.goal} m
          </span>
          <span>{hud.speed} km/h</span>
        </div>
      </div>

      {hud.status === 'ready' && (
        <div className="ready-hint">
          <b>준비 완료</b>
          <span>
            <kbd>Space</kbd> 로 출발
          </span>
        </div>
      )}

      {hud.status !== 'playing' && hud.status !== 'ready' && (
        <div className="overlay">
          <div className="panel">
            {hud.status === 'title' && (
              <>
                <h1>
                  종이비행기 <em>모험</em>
                </h1>
                <div className="stage-picker">
                  {STAGES.map((s) => (
                    <button
                      key={s.id}
                      className={s.id === stage.id ? 'chip on' : 'chip'}
                      style={{ ['--chip' as string]: s.uiAccent }}
                      onClick={() => onSelectStage(s.id)}
                    >
                      <b>{s.title}</b>
                      <span>{s.subtitle}</span>
                    </button>
                  ))}
                </div>
                <p className="lead">{stage.intro}</p>
                <ul className="keys">
                  <li>
                    <kbd>←</kbd> <kbd>→</kbd> 좌우
                  </li>
                  <li>
                    <kbd>↑</kbd> <kbd>↓</kbd> 고도
                  </li>
                  <li>
                    <kbd>Z</kbd> 부스터
                  </li>
                  <li>
                    <kbd>X</kbd> 감속
                  </li>
                  <li>
                    <kbd>Esc</kbd> 일시정지
                  </li>
                  <li>
                    <kbd>M</kbd> 소리
                  </li>
                  <li>드래그로도 조종</li>
                </ul>
                <button className="cta" onClick={onStart}>
                  Space 로 출발
                </button>
              </>
            )}

            {hud.status === 'paused' && (
              <>
                <h1>일시정지</h1>
                <button className="cta" onClick={onResume}>
                  이어서 날기
                </button>
                <button className="ghost" onClick={onRestart}>
                  처음부터 (R)
                </button>
                <button className="ghost" onClick={onTitle}>
                  타이틀로
                </button>
              </>
            )}

            {hud.status === 'clear' && (
              <>
                <h1>
                  {stage.title} <em>CLEAR</em>
                </h1>
                <div className="tally">
                  <div className="tally-row">
                    <span className="tally-star">★</span>
                    <b className="tally-count">{hud.stars}</b>
                    <span className="tally-unit">× 100</span>
                  </div>
                  <p className="tally-note">
                    터뜨린 별 {hud.starsTotal}개 · 보너스 +{(hud.starsTotal - hud.stars) * 100}
                  </p>
                </div>
                <p className="lead">
                  점수 <b>{hud.score.toLocaleString()}</b>
                </p>
                {nextStage ? (
                  <>
                    <button className="cta" onClick={onNext}>
                      다음 스테이지 — {nextStage.title} {nextStage.subtitle}
                    </button>
                    <button className="ghost" onClick={onRestart}>
                      이 스테이지 다시 (R)
                    </button>
                    <button className="ghost" onClick={onTitle}>
                      타이틀로
                    </button>
                  </>
                ) : (
                  <>
                    <p className="note">모든 스테이지를 정복했다. 대단하다!</p>
                    <button className="cta" onClick={onRestart}>
                      다시 도전 (R)
                    </button>
                    <button className="ghost" onClick={onTitle}>
                      타이틀로
                    </button>
                  </>
                )}
              </>
            )}

            {hud.status === 'over' && (
              <>
                <h1>추락</h1>
                <p className="lead">
                  {Math.floor(hud.distance)} m 지점 · 점수 <b>{hud.score.toLocaleString()}</b>
                </p>
                <button className="cta" onClick={onRestart}>
                  다시 도전 (R)
                </button>
                <button className="ghost" onClick={onTitle}>
                  타이틀로
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
