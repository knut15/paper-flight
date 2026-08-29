import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from './rng'
import { rt } from './state'
import { makeGlowTexture } from './textures'
import type { StageConfig } from './stages/types'

const PARTICLE = {
  snow: { color: '#ffffff', size: 0.34, opacity: 0.85, fall: 1 },
  ember: { color: '#ffb066', size: 0.24, opacity: 0.9, fall: -0.6 },
  dust: { color: '#d8b4ff', size: 0.2, opacity: 0.75, fall: 0.15 },
  bubble: { color: '#cfeeff', size: 0.26, opacity: 0.6, fall: -0.85 },
  mote: { color: '#ffe9c0', size: 0.16, opacity: 0.45, fall: 0.06 },
} as const

const COUNT = 700
const SPREAD_X = 46
const SPREAD_Y = 26
const DEPTH = 150

/**
 * 화면 전체에 흩날리는 입자. 눈은 천천히 떨어지고, 월드와 같이 뒤로 흘러간다.
 * 카메라를 따라다니므로 어느 고도에서도 눈이 보인다.
 */
export function Weather({ stage }: { stage: StageConfig }) {
  const kind = stage.weather
  const points = useRef<THREE.Points>(null!)
  const tex = useMemo(() => makeGlowTexture(), [])

  const { geometry, speeds } = useMemo(() => {
    const rand = mulberry32(stage.seed + 91)
    const pos = new Float32Array(COUNT * 3)
    const sp = new Float32Array(COUNT * 2)
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (rand() * 2 - 1) * SPREAD_X
      pos[i * 3 + 1] = rand() * SPREAD_Y
      pos[i * 3 + 2] = -rand() * DEPTH
      sp[i * 2] = 1.2 + rand() * 2.6 // 낙하 속도
      sp[i * 2 + 1] = (rand() * 2 - 1) * 1.4 // 좌우 흔들림
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { geometry: geo, speeds: sp }
  }, [stage])

  useFrame((state, delta) => {
    if (!kind) return
    const dt = Math.min(delta, 0.05)
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    const flow = rt.running ? rt.speed * dt * 0.55 : 0
    const camY = state.camera.position.y

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3
      arr[ix] += Math.sin(rt.time * 1.3 + i) * speeds[i * 2 + 1] * dt
      arr[ix + 1] -= speeds[i * 2] * PARTICLE[kind].fall * dt
      arr[ix + 2] += flow

      if (arr[ix + 1] < camY - SPREAD_Y * 0.5) arr[ix + 1] += SPREAD_Y
      else if (arr[ix + 1] > camY + SPREAD_Y * 0.6) arr[ix + 1] -= SPREAD_Y
      if (arr[ix + 2] > 12) arr[ix + 2] -= DEPTH
      if (arr[ix] > SPREAD_X) arr[ix] -= SPREAD_X * 2
      else if (arr[ix] < -SPREAD_X) arr[ix] += SPREAD_X * 2
    }
    attr.needsUpdate = true

    // 카메라를 따라다녀 항상 화면을 채운다
    points.current.position.x = state.camera.position.x
    points.current.position.y = camY - SPREAD_Y * 0.35
  })

  if (!kind) return null

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={tex}
        color={PARTICLE[kind].color}
        size={PARTICLE[kind].size}
        sizeAttenuation
        transparent
        opacity={PARTICLE[kind].opacity}
        depthWrite={false}
        blending={kind === 'snow' ? THREE.NormalBlending : THREE.AdditiveBlending}
      />
    </points>
  )
}
