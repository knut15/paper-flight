/**
 * 코스 중심선. 주행 거리 s(m) 에서 길이 좌우로 얼마나 휘었는지를 돌려준다.
 * 길·소품·별·장애물·게이트가 모두 이 값을 더해 배치되므로,
 * 여기만 바꾸면 코스 모양 전체가 바뀐다.
 */
export type CurveConfig = {
  /** 큰 굽이의 폭(월드 단위) */
  amp1: number
  /** 큰 굽이의 주기(m) */
  len1: number
  /** 잔 굽이의 폭 */
  amp2: number
  /** 잔 굽이의 주기(m) */
  len2: number
}

export const DEFAULT_CURVE: CurveConfig = { amp1: 7, len1: 240, amp2: 3, len2: 91 }

export function curveX(s: number, c: CurveConfig = DEFAULT_CURVE) {
  return Math.sin(s / c.len1) * c.amp1 + Math.sin(s / c.len2 + 1.7) * c.amp2
}

/**
 * 월드 z 에 놓인 물체의 코스 상 거리.
 * 플레이어는 z=0 에 있고 앞쪽(z 음수) 일수록 더 먼 거리다.
 */
export function trackDistanceAt(distance: number, worldZ: number) {
  return distance - worldZ
}

/** 월드 z 에 놓인 물체가 받아야 할 좌우 오프셋 */
export function curveAt(distance: number, worldZ: number, c: CurveConfig = DEFAULT_CURVE) {
  return curveX(distance - worldZ, c)
}

/** 코스 중심선의 기울기(도함수). 절댓값이 클수록 급한 커브다. */
export function curveSlope(s: number, c: CurveConfig = DEFAULT_CURVE) {
  return (Math.cos(s / c.len1) * c.amp1) / c.len1 + (Math.cos(s / c.len2 + 1.7) * c.amp2) / c.len2
}

/**
 * 지금 구간이 얼마나 곧은가. 1 이면 직선, 0 이면 그 코스에서 가장 급한 커브.
 * 커브가 없는 스테이지(amp 0)는 항상 1 이다.
 */
export function straightness(s: number, c: CurveConfig = DEFAULT_CURVE) {
  const maxSlope = c.amp1 / c.len1 + c.amp2 / c.len2
  if (maxSlope < 1e-6) return 1
  return 1 - Math.min(1, Math.abs(curveSlope(s, c)) / maxSlope)
}
