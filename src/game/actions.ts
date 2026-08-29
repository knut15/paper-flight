import { playPickup, playThunder } from './audio'
import { INVULN_TIME, POWER_TIME } from './constants'
import { patchHud, rt } from './state'

/** 장애물에 부딪혔을 때. 무적 중이면 무시한다. */
export function hitObstacle() {
  // 반짝이 스타 무적 중에는 아무리 부딪혀도 생명이 줄지 않는다
  if (rt.power > 0 || rt.invuln > 0 || !rt.running) return
  rt.hp -= 1
  rt.invuln = INVULN_TIME
  rt.shake = 1
  rt.combo = 0
  rt.comboTimer = 0
  patchHud({ hp: rt.hp, combo: 0 })
  if (rt.hp <= 0) {
    rt.running = false
    patchHud({ status: 'over' })
  }
}

/** 별을 먹었을 때. 연속으로 먹으면 배수가 붙는다. */
export function collectStar(points = 10) {
  if (!rt.running) return
  rt.combo += 1
  rt.comboTimer = 2.4
  rt.stars += 1
  playPickup(rt.combo)
  const mult = 1 + Math.floor(rt.combo / 5)
  rt.score += points * mult
  patchHud({ score: rt.score, combo: rt.combo, stars: rt.stars })
}

/** 반짝이 스타 — 잠시 무적이 된다 */
export function collectPowerStar() {
  if (!rt.running) return
  rt.power = POWER_TIME
  rt.score += 300
  rt.bannerAt = rt.time
  playThunder()
  playPickup(12)
  patchHud({ score: rt.score, power: POWER_TIME, banner: rt.banner + 1 })
}

export function clearStage() {
  rt.running = false
  rt.score += rt.hp * 150
  patchHud({ status: 'clear', score: rt.score, stars: rt.stars, starsTotal: rt.stars })
}

/**
 * 클리어 정산 — 모은 별을 하나씩 터뜨려 100점씩 더한다.
 * 더 터뜨릴 별이 없으면 false. silent 면 소리 없이(잔여분 일괄 정산용).
 */
export function redeemStarBonus(silent = false) {
  if (rt.stars <= 0) return false
  rt.stars -= 1
  rt.score += 100
  if (!silent) playPickup(8)
  patchHud({ score: rt.score, stars: rt.stars })
  return true
}
