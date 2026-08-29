/** 시드 고정 난수. 같은 시드면 항상 같은 스테이지 배치가 나온다. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rand = ReturnType<typeof mulberry32>

/** min 이상 max 미만 */
export function range(rand: Rand, min: number, max: number) {
  return min + rand() * (max - min)
}

export function pick<T>(rand: Rand, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length) % arr.length]
}
