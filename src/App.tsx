import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { redeemStarBonus } from './game/actions'
import { initAudio, toggleMute } from './game/audio'
import { Hud } from './game/Hud'
import { installInput, onAction, pointer, releaseKeys } from './game/input'
import { Scene } from './game/Scene'
import { getNextStage, getStage } from './game/stages'
import { getHud, patchHud, resetRuntime, rt } from './game/state'

export default function App() {
  const [stageId, setStageId] = useState(1)
  const stage = useMemo(() => getStage(stageId), [stageId])
  const nextStage = useMemo(() => getNextStage(stageId), [stageId])
  const wrap = useRef<HTMLDivElement>(null)

  /** 해당 스테이지를 처음부터 시작한다. */
  /** 스테이지를 준비 상태로 올린다. 비행기는 제자리에 떠 있고, 가속(Shift)이나 클릭으로 출발한다. */
  const start = useCallback((id?: number, keepScore = false) => {
    initAudio()
    releaseKeys()
    while (redeemStarBonus(true)) {
      // 정산 애니메이션 도중 넘어가도 남은 별 보너스는 전부 반영한다
    }
    const target = getStage(id ?? getHud().stageId)
    setStageId(target.id)
    resetRuntime(target, { keepScore })
    patchHud({ status: 'ready' })
  }, [])

  /** 대기 상태에서 실제 주행을 시작한다. */
  const beginRun = useCallback(() => {
    if (getHud().status !== 'ready') return
    rt.running = true
    patchHud({ status: 'playing' })
  }, [])

  const restart = useCallback(() => {
    start(getHud().stageId)
  }, [start])

  const goNext = useCallback(() => {
    const next = getNextStage(getHud().stageId)
    if (!next) return
    start(next.id, true)
  }, [start])

  const resume = useCallback(() => {
    initAudio()
    rt.running = true
    patchHud({ status: 'playing' })
  }, [])

  const pause = useCallback(() => {
    releaseKeys()
    rt.running = false
    patchHud({ status: 'paused' })
  }, [])

  /** 타이틀 화면으로 돌아간다. 여기서 스테이지를 다시 고를 수 있다. */
  const toTitle = useCallback(() => {
    rt.running = false
    resetRuntime(getStage(getHud().stageId))
    patchHud({ status: 'title' })
  }, [])

  /** 타이틀에서 스테이지를 고른다. 시작은 따로 누른다. */
  const selectStage = useCallback((id: number) => {
    if (getHud().status !== 'title') return
    const target = getStage(id)
    setStageId(id)
    resetRuntime(target)
    patchHud({ status: 'title' })
  }, [])

  useEffect(() => {
    const uninstall = installInput()
    onAction((action) => {
      const status = getHud().status
      if (action === 'restart') {
        restart()
        return
      }
      if (action === 'mute') {
        toggleMute()
        return
      }
      if (action === 'pause') {
        if (status === 'playing') pause()
        else if (status === 'paused') resume()
        return
      }
      // start (Space / Enter)
      if (status === 'playing') return
      if (status === 'ready') beginRun()
      else if (status === 'paused') resume()
      else if (status === 'clear' && getNextStage(getHud().stageId)) goNext()
      else restart()
    })
    return uninstall
  }, [restart, resume, pause, goNext, beginRun])

  // 포인터/터치로도 조종할 수 있게 한다
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const track = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1
      pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1)
    }
    const down = (e: PointerEvent) => {
      beginRun() // 대기 상태에서는 화면 클릭으로도 출발
      pointer.active = true
      track(e)
    }
    const move = (e: PointerEvent) => {
      if (pointer.active) track(e)
    }
    const up = () => {
      pointer.active = false
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', up)
    // 캔버스 밖에서 손을 떼도 조종이 풀리도록 window 에서도 받는다
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    window.addEventListener('blur', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', up)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('blur', up)
    }
  }, [beginRun])

  return (
    <div className="app" ref={wrap}>
      <Scene stage={stage} />
      <Hud
        stage={stage}
        nextStage={nextStage}
        onStart={restart}
        onResume={resume}
        onRestart={restart}
        onNext={goNext}
        onSelectStage={selectStage}
        onTitle={toTitle}
      />
    </div>
  )
}
