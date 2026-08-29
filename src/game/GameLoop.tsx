import { useFrame } from '@react-three/fiber'
import { clearStage } from './actions'
import {
  BASE_SPEED,
  BOOST_BONUS,
  BRAKE_EASE,
  CURVE_PENALTY,
  DAMPING,
  HALF_WIDTH,
  LATERAL_ACCEL,
  MAX_SPEED,
  MAX_Y,
  MIN_Y,
  POWER_MAX_SPEED,
  SPEED_EASE,
  SPEED_EASE_BOOST,
  VERTICAL_ACCEL,
} from './constants'
import { updateAudio } from './audio'
import { isBoosting, isBraking, readLift, readSteer } from './input'
import { patchHud, rt } from './state'
import { curveX, DEFAULT_CURVE, straightness } from './track'
import type { StageConfig } from './stages/types'

function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v
}

/** 물리·진행도·HUD 갱신을 한 곳에서 돌린다. 씬 최상단에 두어 다른 컴포넌트보다 먼저 실행되게 한다. */
export function GameLoop({ stage }: { stage: StageConfig }) {
  const curve = stage.curve ?? DEFAULT_CURVE

  useFrame((state, delta) => {
    if (import.meta.env.DEV) (globalThis as unknown as { __pfScene: unknown }).__pfScene = state.scene
    const dt = Math.min(delta, 0.05)
    rt.time += dt
    updateAudio(dt)

    if (rt.shake > 0) rt.shake = Math.max(0, rt.shake - dt * 2.6)
    if (rt.invuln > 0) rt.invuln = Math.max(0, rt.invuln - dt)
    if (rt.power > 0) {
      rt.power = Math.max(0, rt.power - dt)
      // 카운트다운이 매끄럽게 흐르도록 자주 갱신한다
      patchHud({ power: Math.round(rt.power * 10) / 10 })
      // 부스터가 끝나도 1초는 무적을 유지 — 고속 상태로 장애물에 처박히지 않게
      if (rt.power === 0) rt.invuln = Math.max(rt.invuln, 1)
    }

    if (!rt.running) return

    const steer = readSteer()
    const lift = readLift()

    rt.vx += steer * LATERAL_ACCEL * dt
    rt.vy += lift * VERTICAL_ACCEL * dt

    const damp = Math.pow(DAMPING, dt * 60)
    rt.vx *= damp
    rt.vy *= damp

    // 좌우 한계는 코스 중심을 따라 움직인다. 커브 밖으로는 나갈 수 없다.
    const center = curveX(rt.distance, curve)
    const minX = center - HALF_WIDTH
    const maxX = center + HALF_WIDTH
    rt.x = clamp(rt.x + rt.vx * dt, minX, maxX)
    rt.y = clamp(rt.y + rt.vy * dt, MIN_Y, MAX_Y)
    if (rt.x === minX || rt.x === maxX) rt.vx = 0
    if (rt.y === MIN_Y || rt.y === MAX_Y) rt.vy = 0

    // 기울기 — 좌우 속도에 따라 눕고, 상하 입력에 따라 코가 들린다
    const targetRoll = clamp(-rt.vx * 0.08, -0.95, 0.95)
    rt.roll += (targetRoll - rt.roll) * Math.min(1, dt * 10)
    // 상승이면 코가 확실히 들리고 하강이면 확실히 숙여진다
    const targetPitch = clamp(rt.vy * 0.09, -0.6, 0.6)
    rt.pitch += (targetPitch - rt.pitch) * Math.min(1, dt * 9)

    // 굽이에서는 밀려 느려진다. 속도를 더 내려면 부스터를 쓴다.
    const straight = straightness(rt.distance, curve)
    rt.straight += (straight - rt.straight) * Math.min(1, dt * 5)

    // 무적 스타를 먹으면 Z 를 누르지 않아도 자동으로 부스터가 걸린다
    const boosting = isBoosting() || rt.power > 0
    const braking = isBraking()
    rt.boost += ((boosting ? 1 : 0) - rt.boost) * Math.min(1, dt * (boosting ? 12 : 5))

    const bonus = boosting ? BOOST_BONUS : 0
    const powered = rt.power > 0
    const cap = powered ? POWER_MAX_SPEED : MAX_SPEED + bonus
    // 브레이크를 잡으면 점점 느려지다 멈춘다
    const target = braking
      ? 0
      : Math.min(cap, BASE_SPEED - (1 - rt.straight) * CURVE_PENALTY + (powered ? 90 : bonus))
    const ease = braking ? BRAKE_EASE : boosting ? SPEED_EASE_BOOST : SPEED_EASE
    rt.speed += (target - rt.speed) * (1 - Math.pow(ease, dt))
    if (rt.speed < 0.4) rt.speed = braking ? 0 : rt.speed
    rt.distance += rt.speed * dt

    // 코스가 휜 만큼 기체도 같이 이동시켜, 커브에서 바깥으로 밀리는 느낌(원심력)을 없앤다
    rt.x += curveX(rt.distance, curve) - center

    if (rt.distance >= stage.goal) {
      rt.distance = stage.goal
      clearStage()
      return
    }

    rt.hudClock += dt
    if (rt.hudClock > 0.1) {
      rt.hudClock = 0
      patchHud({
        distance: Math.floor(rt.distance),
        speed: Math.round(rt.speed),
        combo: rt.combo,
        power: rt.power,
      })
    }
  })

  return null
}
