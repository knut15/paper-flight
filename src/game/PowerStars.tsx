import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { collectPowerStar } from './actions'
import { makeStarGeometry } from './Collectibles'
import { rt } from './state'
import { makeGlowTexture } from './textures'
import { curveX, DEFAULT_CURVE } from './track'
import type { StageConfig } from './stages/types'

/** 코스 전체에서 두 번만 나온다. 목표 거리의 이 비율 지점에 놓인다. */
const SPOTS = [0.3, 0.68]
const HIT = 1.8

/**
 * 반짝이 스타. 무지개빛으로 색이 돌고 크게 맥동한다.
 * 먹으면 잠시 무적이 되어 부딪혀도 생명이 줄지 않는다.
 */
/** 무지개 일곱 빛깔 — 위에서 아래로 이 순서의 띠가 별을 가로지른다 */
const RAINBOW = [
  '#ff2d2d',
  '#ff8a1f',
  '#ffd60a',
  '#3fd15a',
  '#2d8bff',
  '#4b3bd6',
  '#9b3bd6',
]

/**
 * 별 지오메트리에 무지개 스트라이프를 구워 넣는다.
 * 색이 시간에 따라 바뀌는 게 아니라, 별 한 몸에 일곱 색 띠가 모두 들어 있다.
 */
function makeRainbowStar() {
  const geo = makeStarGeometry()
  const pos = geo.getAttribute('position')
  const colors = new Float32Array(pos.count * 3)
  const bands = RAINBOW.map((hex) => new THREE.Color(hex))
  // 별의 세로 범위를 일곱 칸으로 나눠 띠를 만든다
  let minY = Infinity
  let maxY = -Infinity
  for (let i = 0; i < pos.count; i++) {
    minY = Math.min(minY, pos.getY(i))
    maxY = Math.max(maxY, pos.getY(i))
  }
  const span = Math.max(maxY - minY, 1e-6)
  for (let i = 0; i < pos.count; i++) {
    const t = 1 - (pos.getY(i) - minY) / span // 위 → 빨강
    const idx = Math.min(bands.length - 1, Math.floor(t * bands.length))
    const c = bands[idx]
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

export function PowerStars({ stage }: { stage: StageConfig }) {
  const geo = useMemo(makeRainbowStar, [])
  const glow = useMemo(() => makeGlowTexture(), [])
  const group = useRef<THREE.Group>(null!)
  const taken = useRef(SPOTS.map(() => false))
  const lastDistance = useRef(0)
  const curve = stage.curve ?? DEFAULT_CURVE

  const marks = useMemo(() => SPOTS.map((r) => stage.goal * r), [stage])

  // 스테이지가 바뀌면 다시 처음부터 나온다
  useEffect(() => {
    taken.current = SPOTS.map(() => false)
    lastDistance.current = 0
  }, [stage])

  useFrame(() => {
    if (!rt.running) return

    // 거리가 되감겼다면 새 판이다 — 먹은 표시를 지운다
    if (rt.distance < lastDistance.current - 1) {
      taken.current = SPOTS.map(() => false)
    }
    lastDistance.current = rt.distance

    const kids = group.current.children

    for (let i = 0; i < kids.length; i++) {
      const g = kids[i] as THREE.Group
      if (taken.current[i]) {
        g.visible = false
        continue
      }
      const remain = marks[i] - rt.distance
      g.visible = remain < 220 && remain > -12
      if (!g.visible) continue

      g.position.set(
        curveX(marks[i], curve),
        3.2 + Math.sin(rt.time * 1.6) * 0.5,
        -remain,
      )
      g.rotation.y = rt.time * 2.4
      g.rotation.x = Math.sin(rt.time * 1.3) * 0.35
      const pulse = 1 + Math.sin(rt.time * 6) * 0.12
      g.scale.setScalar(pulse)

      // 색은 별에 박혀 있고, 밝기만 반짝인다
      const star = g.children[0] as THREE.Mesh
      const halo = g.children[1] as THREE.Mesh
      const ring = g.children[2] as THREE.Mesh
      const twinkle = 0.75 + Math.sin(rt.time * 11) * 0.25 + Math.sin(rt.time * 4.3) * 0.12
      const mat = star.material as THREE.MeshBasicMaterial
      // 정점색 × 이 배율 — 색상은 유지한 채 밝기만 반짝인다
      const k = 0.8 + twinkle * 0.45
      mat.color.setRGB(k, k, k)
      const haloMat = halo.material as THREE.MeshBasicMaterial
      haloMat.opacity = 0.22 + twinkle * 0.2
      const ringMat = ring.material as THREE.MeshBasicMaterial
      ringMat.opacity = 0.5 + twinkle * 0.4
      ring.rotation.z = rt.time * 1.8
      ring.rotation.x = Math.sin(rt.time * 0.9) * 0.5
      ring.scale.setScalar(2.1 + Math.sin(rt.time * 4) * 0.2)

      if (
        Math.abs(g.position.z) < HIT &&
        Math.abs(g.position.x - rt.x) < HIT &&
        Math.abs(g.position.y - rt.y) < HIT
      ) {
        taken.current[i] = true
        g.visible = false
        collectPowerStar()
      }
    }
  })

  return (
    <group ref={group}>
      {marks.map((_, i) => (
        <group key={i} visible={false} scale={1.6}>
          <mesh geometry={geo}>
            {/* 조명·톤매핑의 영향 없이 무지개 띠가 그대로 보이는 무광 재질 */}
            <meshBasicMaterial vertexColors toneMapped={false} />
          </mesh>
          <mesh scale={3.4}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={glow}
              color="#ffffff"
              transparent
              opacity={0.5}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* 둘레를 도는 무지개 고리 */}
          <mesh>
            <torusGeometry args={[0.6, 0.05, 8, 30]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.9}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
