import * as THREE from 'three'
import { range, type Rand } from '../rng'
import type { FieldItem } from '../ScrollField'

/** 길(가운데) 을 피해 좌우 어느 한쪽에 x 를 잡는다. */
export function sideX(rand: Rand, min: number, max: number) {
  const side = rand() > 0.5 ? 1 : -1
  return side * range(rand, min, max)
}

/** 배경 소품을 길 양옆에 흩뿌린다. 모든 biome 의 Scenery 가 공유한다. */
export function makeItems(
  rand: Rand,
  count: number,
  length: number,
  xMin: number,
  xMax: number,
  scale: [number, number],
  variants: number,
): FieldItem[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    x: sideX(rand, xMin, xMax),
    y: 0,
    z: -range(rand, 10, length),
    scale: range(rand, scale[0], scale[1]),
    rot: rand() * Math.PI * 2,
    variant: Math.floor(rand() * variants),
  }))
}

/** 공중에 떠 있는 소품(결정, 얼음 조각 등) */
export function makeFloatingItems(
  rand: Rand,
  count: number,
  length: number,
  yRange: [number, number],
  scale: [number, number],
): FieldItem[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    x: sideX(rand, 9, 30),
    y: range(rand, yRange[0], yRange[1]),
    z: -range(rand, 10, length),
    scale: range(rand, scale[0], scale[1]),
    rot: rand() * Math.PI,
    variant: 0,
  }))
}

/**
 * 물결치는 사암 벽 지오메트리. 세로로 굽이치고 위로 갈수록
 * 길 쪽으로 배흘림처럼 넘어와 슬롯캐니언의 곡면을 만든다.
 * 만들어지는 면의 법선은 +z(길 쪽) — 왼쪽 벽은 +90°, 오른쪽 벽은 -90° 로 돌려 세운다.
 */
export function makeWallGeometry(depth: number, height: number, rand: () => number) {
  const geo = new THREE.PlaneGeometry(depth, height, 26, 12)
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute
  const s1 = rand() * Math.PI * 2
  const s2 = rand() * Math.PI * 2
  const s3 = rand() * Math.PI * 2
  const a1 = 1.1 + rand() * 0.9
  const a2 = 0.5 + rand() * 0.6
  const lean = 2.0 + rand() * 1.6

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const t = y / height + 0.5 // 0(바닥) ~ 1(꼭대기)
    let z =
      a1 * Math.sin(x * 0.24 + s1) * (0.35 + 0.65 * t) +
      a2 * Math.sin(x * 0.61 + y * 0.5 + s2) +
      0.7 * Math.sin(y * 0.72 + s3)
    // 위로 갈수록 길 쪽으로 넘어온다 (오버행)
    z += lean * t * t
    // 바닥은 살짝 벌어져 바닥과 자연스럽게 만난다
    z -= 0.8 * (1 - t) * (1 - t)
    pos.setZ(i, z)
    // 지층 무늬가 길이 방향으로 반복되게 uv 를 늘린다
    uv.setX(i, (x / depth + 0.5) * (depth / 9))
    uv.setY(i, t * (height / 11))
  }
  geo.computeVertexNormals()
  return geo
}


