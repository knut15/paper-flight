/** 키보드 + 포인터 입력을 한 곳에서 모은다. -1..1 로 정규화한 축만 게임 루프에 넘긴다. */
const pressed = new Set<string>()

export const pointer = { active: false, x: 0, y: 0 }

// 개발 중 진단용 — 지금 눌린 키를 콘솔에서 확인한다
if (import.meta.env.DEV) {
  ;(globalThis as unknown as { __pfKeys: () => string[] }).__pfKeys = () => [...pressed]
}

const KEY_LEFT = ['ArrowLeft', 'KeyA']
const KEY_RIGHT = ['ArrowRight', 'KeyD']
const KEY_UP = ['ArrowUp', 'KeyW']
const KEY_DOWN = ['ArrowDown', 'KeyS']

export type InputAction = 'start' | 'pause' | 'restart' | 'mute'

let actionHandler: ((a: InputAction) => void) | null = null

export function onAction(fn: (a: InputAction) => void) {
  actionHandler = fn
}

function keyDown(e: KeyboardEvent) {
  pressed.add(e.code)
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault()
    actionHandler?.('start')
  }
  if (e.code === 'Escape' || e.code === 'KeyP') actionHandler?.('pause')
  if (e.code === 'KeyR') actionHandler?.('restart')
  if (e.code === 'KeyM') actionHandler?.('mute')
  if (KEY_LEFT.includes(e.code) || KEY_RIGHT.includes(e.code) || KEY_UP.includes(e.code) || KEY_DOWN.includes(e.code)) {
    e.preventDefault()
  }
}

function keyUp(e: KeyboardEvent) {
  pressed.delete(e.code)
}

/**
 * 눌린 키를 모두 놓은 것으로 친다.
 * 키를 누른 채 창을 벗어나면 keyup 이 오지 않아 그 키가 영원히 눌린 상태로 남는다
 * (부스터가 저절로 걸리는 원인이었다). 포커스를 잃는 모든 경로에서 초기화한다.
 */
function releaseAll() {
  pressed.clear()
  pointer.active = false
}

function onVisibility() {
  if (document.hidden) releaseAll()
}

export function installInput() {
  window.addEventListener('keydown', keyDown)
  window.addEventListener('keyup', keyUp)
  window.addEventListener('blur', releaseAll)
  window.addEventListener('pagehide', releaseAll)
  document.addEventListener('visibilitychange', onVisibility)
  return () => {
    window.removeEventListener('keydown', keyDown)
    window.removeEventListener('keyup', keyUp)
    window.removeEventListener('blur', releaseAll)
    window.removeEventListener('pagehide', releaseAll)
    document.removeEventListener('visibilitychange', onVisibility)
    pressed.clear()
  }
}

/** 일시정지·재시작처럼 흐름이 끊길 때 눌린 키를 털어낸다 */
export function releaseKeys() {
  releaseAll()
}

function axis(neg: string[], pos: string[]) {
  let v = 0
  if (neg.some((k) => pressed.has(k))) v -= 1
  if (pos.some((k) => pressed.has(k))) v += 1
  return v
}

/** 좌우: -1(왼쪽) .. 1(오른쪽) */
export function readSteer() {
  const key = axis(KEY_LEFT, KEY_RIGHT)
  if (key !== 0) return key
  return pointer.active ? clamp(pointer.x * 1.6, -1, 1) : 0
}

/** 상하: -1(하강) .. 1(상승) */
export function readLift() {
  const key = axis(KEY_DOWN, KEY_UP)
  if (key !== 0) return key
  return pointer.active ? clamp(pointer.y * 1.6, -1, 1) : 0
}

/** Z — 부스터. 창이 포커스를 잃었다면 눌린 것으로 치지 않는다. */
export function isBoosting() {
  return pressed.has('KeyZ') && document.hasFocus()
}

/** X — 브레이크 */
export function isBraking() {
  return pressed.has('KeyX') && document.hasFocus()
}

function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v
}
