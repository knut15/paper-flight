import { useSyncExternalStore } from 'react'
import { BASE_SPEED, MIN_Y } from './constants'
import { getStage } from './stages'
import type { StageConfig } from './stages/types'
import { curveX, DEFAULT_CURVE } from './track'

export type GameStatus = 'title' | 'ready' | 'playing' | 'paused' | 'clear' | 'over'

export type HudState = {
  status: GameStatus
  stageId: number
  score: number
  hp: number
  distance: number
  goal: number
  speed: number
  combo: number
  /** 이번 스테이지에서 모은 별 (클리어 정산에서 거꾸로 줄어든다) */
  stars: number
  /** 무적 남은 시간(초). 0 이면 평소 */
  power: number
  /** 값이 바뀌면 BOOSTER ON 배너가 다시 튀어나온다 */
  banner: number
  /** 클리어 시점에 모아 둔 별 총 개수 */
  starsTotal: number
}

const MAX_HP = 3

let hud: HudState = {
  status: 'title',
  stageId: 1,
  score: 0,
  hp: MAX_HP,
  distance: 0,
  goal: getStage(1).goal,
  speed: BASE_SPEED,
  combo: 0,
  stars: 0,
  starsTotal: 0,
  power: 0,
  banner: 0,
}

const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function getHud() {
  return hud
}

export function patchHud(next: Partial<HudState>) {
  let changed = false
  for (const k of Object.keys(next) as (keyof HudState)[]) {
    if (hud[k] !== next[k]) {
      changed = true
      break
    }
  }
  if (!changed) return
  hud = { ...hud, ...next }
  emit()
}

export function useHud() {
  return useSyncExternalStore(subscribe, getHud, getHud)
}

/** 매 프레임 바뀌는 값. React 상태로 두지 않고 직접 읽고 쓴다. */
export const rt = {
  x: 0,
  y: 2.6,
  vx: 0,
  vy: 0,
  roll: 0,
  pitch: 0,
  distance: 0,
  speed: BASE_SPEED,
  invuln: 0,
  /** 부스터 강도 0~1 (불꽃·FOV 연출에 쓴다) */
  boost: 0,
  /** 지금 구간의 직선도 0~1 */
  straight: 1,
  /** 반짝이 스타 무적 남은 시간(초) */
  power: 0,
  /** 배너를 다시 띄우기 위한 카운터 */
  banner: 0,
  bannerAt: 0,
  hp: MAX_HP,
  score: 0,
  combo: 0,
  comboTimer: 0,
  stars: 0,
  shake: 0,
  /** HUD 갱신 주기 조절용 */
  hudClock: 0,
  time: 0,
  /** 월드 스크롤을 돌릴지 여부 (일시정지/타이틀에서는 false) */
  running: false,
}

// 개발 중 진단용 — 콘솔에서 rt 를 들여다본다
if (import.meta.env.DEV) {
  ;(globalThis as unknown as { __pfRt: typeof rt }).__pfRt = rt
}

export function resetRuntime(stage: StageConfig, options?: { keepScore?: boolean }) {
  const keptScore = options?.keepScore ? rt.score : 0
  // 코스 중심선 위에서 스폰한다. curveX(0) 은 0 이 아니라서(잔 굽이 위상 1.7)
  // x=0 에 두면 카메라가 코스 중심을 보는 탓에 캐릭터가 화면 왼쪽으로 밀려 보인다.
  rt.x = curveX(0, stage.curve ?? DEFAULT_CURVE)
  rt.y = 2.6
  rt.vx = 0
  rt.vy = 0
  rt.roll = 0
  rt.pitch = 0
  rt.distance = 0
  rt.speed = BASE_SPEED
  rt.invuln = 0
  rt.boost = 0
  rt.straight = 1
  rt.power = 0
  rt.banner = 0
  rt.bannerAt = 0
  rt.hp = MAX_HP
  rt.score = keptScore
  rt.combo = 0
  rt.comboTimer = 0
  rt.stars = 0
  rt.shake = 0
  rt.hudClock = 0
  rt.time = 0
  rt.running = false
  patchHud({
    stageId: stage.id,
    score: keptScore,
    hp: MAX_HP,
    distance: 0,
    goal: stage.goal,
    speed: BASE_SPEED,
    combo: 0,
    stars: 0,
    starsTotal: 0,
    power: 0,
    banner: 0,
  })
}

export { MAX_HP, MIN_Y }
