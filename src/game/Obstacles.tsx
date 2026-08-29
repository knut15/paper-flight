import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { hitObstacle } from './actions'
import { CAMERA_Z, FIELD_LENGTH } from './constants'
import { mulberry32, range } from './rng'
import { rt } from './state'
import { curveAt, DEFAULT_CURVE } from './track'
import type { StageConfig } from './stages/types'

/** 장애물은 한 종류 — 공중에 떠서 천천히 도는 돌덩이. */
type Obstacle = {
  id: number
  x: number
  y: number
  z: number
  /** 충돌 반경 */
  r: number
  rot: number
  /** 위아래 흔들림 위상 */
  bob: number
}

const HIT_Z = 1.7
const PLANE_RX = 0.7
const PLANE_RY = 0.5

/** 스테이지 앞부분은 비워 두고, 고도를 바꿔 가며 돌을 띄운다. */
function buildObstacles(seed: number): Obstacle[] {
  const rand = mulberry32(seed)
  const out: Obstacle[] = []
  let id = 0
  let z = -60
  while (z > -FIELD_LENGTH) {
    out.push({
      id: id++,
      x: range(rand, -6.4, 6.4),
      y: range(rand, 1.4, 6.4),
      z,
      r: range(rand, 0.75, 1.25),
      rot: rand() * Math.PI * 2,
      bob: rand() * Math.PI * 2,
    })
    z -= range(rand, 20, 34)
  }
  return out
}

function FloatingRock({ o, stage }: { o: Obstacle; stage: StageConfig }) {
  const glow = stage.obstacleGlow
  return (
    <group scale={o.r}>
      <mesh>
        <icosahedronGeometry args={[0.95, 0]} />
        <meshStandardMaterial
          color={stage.palette.rock[0]}
          emissive={glow ?? '#000000'}
          emissiveIntensity={glow ? 0.8 : 0}
          roughness={1}
          flatShading
        />
      </mesh>
      {/* 작은 돌 부스러기가 붙어 돌 느낌을 낸다 */}
      <mesh position={[0.62, 0.4, 0.25]} scale={0.4}>
        <icosahedronGeometry args={[0.95, 0]} />
        <meshStandardMaterial
          color={stage.palette.rock[1]}
          emissive={glow ?? '#000000'}
          emissiveIntensity={glow ? 0.6 : 0}
          roughness={1}
          flatShading
        />
      </mesh>
      <mesh position={[-0.5, -0.35, -0.2]} scale={0.3}>
        <icosahedronGeometry args={[0.95, 0]} />
        <meshStandardMaterial color={stage.palette.rock[3]} roughness={1} flatShading />
      </mesh>
      {glow && (
        <mesh scale={0.5}>
          <icosahedronGeometry args={[0.95, 0]} />
          <meshBasicMaterial color={glow} />
        </mesh>
      )}
      {/* 은은한 외곽 기운 — 어느 스테이지에서든 장애물임을 알린다 */}
      <mesh scale={1.35}>
        <icosahedronGeometry args={[0.95, 0]} />
        <meshBasicMaterial
          color={glow ?? stage.uiAccent}
          transparent
          opacity={glow ? 0.22 : 0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

export function Obstacles({ stage }: { stage: StageConfig }) {
  const items = useMemo(() => buildObstacles(stage.seed + 41), [stage])
  const group = useRef<THREE.Group>(null!)
  const curve = stage.curve ?? DEFAULT_CURVE

  useFrame((_, delta) => {
    if (!rt.running) return
    const dt = Math.min(delta, 0.05)
    const d = rt.speed * dt
    const kids = group.current.children

    for (let i = 0; i < kids.length; i++) {
      const c = kids[i]
      const o = items[i]
      c.position.z += d
      if (c.position.z > CAMERA_Z + 14) c.position.z -= FIELD_LENGTH
      c.position.x = o.x + curveAt(rt.distance, c.position.z, curve)
      c.position.y = o.y + Math.sin(rt.time * 1.6 + o.bob) * 0.4
      c.rotation.y += dt * 0.9
      c.rotation.x += dt * 0.5

      if (Math.abs(c.position.z) > HIT_Z) continue
      const dx = Math.abs(c.position.x - rt.x)
      const dy = Math.abs(c.position.y - rt.y)
      if (dx < o.r + PLANE_RX && dy < o.r + PLANE_RY) hitObstacle()
    }
  })

  return (
    <group ref={group}>
      {items.map((o) => (
        <group key={o.id} position={[o.x, o.y, o.z]} rotation={[0, o.rot, 0]}>
          <FloatingRock o={o} stage={stage} />
        </group>
      ))}
    </group>
  )
}
