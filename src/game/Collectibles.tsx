import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { collectStar } from './actions'
import { CAMERA_Z, FIELD_LENGTH } from './constants'
import { mulberry32, range } from './rng'
import { rt } from './state'
import { curveAt, DEFAULT_CURVE } from './track'
import type { StageConfig } from './stages/types'

type Star = { id: number; x: number; y: number; z: number }

const HIT_X = 1.15
const HIT_Y = 1.15
const HIT_Z = 1.9

/** 별 무리. 활 모양으로 늘어놓아 따라가며 먹는 재미를 만든다. */
function buildStars(seed: number): Star[] {
  const rand = mulberry32(seed)
  const out: Star[] = []
  let id = 0
  let z = -24
  while (z > -FIELD_LENGTH) {
    const count = 4 + Math.floor(rand() * 4)
    const baseX = range(rand, -5.5, 5.5)
    const baseY = range(rand, 1.2, 5.8)
    const curve = range(rand, -1.4, 1.4)
    for (let i = 0; i < count; i++) {
      out.push({
        id: id++,
        x: baseX + curve * i,
        y: baseY + Math.sin(i * 0.9) * 1.1,
        z: z - i * 3.4,
      })
    }
    z -= count * 3.4 + range(rand, 14, 30)
  }
  return out
}

/** 5각 별 지오메트리 (한 번 만들어 모든 별이 공유한다) */
export function makeStarGeometry() {
  const shape = new THREE.Shape()
  const outer = 0.38
  const inner = 0.17
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.3,
    bevelEnabled: true,
    bevelSize: 0.1,
    bevelThickness: 0.1,
    bevelSegments: 2,
  })
  geo.center()
  geo.computeVertexNormals()
  return geo
}

export function Collectibles({ stage }: { stage: StageConfig }) {
  const stars = useMemo(() => buildStars(stage.seed + 17), [stage])
  const starGeo = useMemo(makeStarGeometry, [])
  const group = useRef<THREE.Group>(null!)
  const taken = useRef<Float32Array>(new Float32Array(stars.length))
  const curve = stage.curve ?? DEFAULT_CURVE

  useFrame((_, delta) => {
    if (!rt.running) return
    const dt = Math.min(delta, 0.05)
    const d = rt.speed * dt
    const kids = group.current.children

    for (let i = 0; i < kids.length; i++) {
      const c = kids[i]
      c.position.z += d
      c.position.x = stars[i].x + curveAt(rt.distance, c.position.z, curve)
      c.rotation.y = Math.sin(rt.time * 1.7 + i) * 0.55
      c.rotation.z = Math.sin(rt.time * 2.4 + i) * 0.35

      if (c.position.z > CAMERA_Z + 12) {
        c.position.z -= FIELD_LENGTH
        c.position.y = stars[i].y
        taken.current[i] = 0
        c.visible = true
        c.scale.setScalar(1)
      }

      if (taken.current[i] > 0) {
        // 먹은 직후 위로 푱 튀어오르며 커졌다가 사라진다
        taken.current[i] += dt * 5
        const k = taken.current[i]
        c.position.y += dt * 7 * Math.max(0, 1 - k / 1.1)
        c.rotation.y += dt * 16
        const pop = k < 0.32 ? 1 + k * 2.6 : Math.max(0, 1.83 - (k - 0.32) * 1.65)
        c.scale.setScalar(Math.max(pop, 0.001))
        if (k > 1.42) c.visible = false
        continue
      }

      if (
        Math.abs(c.position.z) < HIT_Z &&
        Math.abs(c.position.x - rt.x) < HIT_X &&
        Math.abs(c.position.y - rt.y) < HIT_Y
      ) {
        taken.current[i] = 0.001
        collectStar(10)
      }
    }

    // 콤보 유지 시간
    if (rt.comboTimer > 0) {
      rt.comboTimer -= dt
      if (rt.comboTimer <= 0) rt.combo = 0
    }
  })

  return (
    <group ref={group}>
      {stars.map((s) => (
        <group key={s.id} position={[s.x, s.y, s.z]}>
          <mesh geometry={starGeo}>
            <meshStandardMaterial
              color="#ffe066"
              emissive="#ffb703"
              emissiveIntensity={1.1}
              roughness={0.35}
              metalness={0.15}
              flatShading
            />
          </mesh>
          <mesh scale={1.15}>
            <sphereGeometry args={[0.42, 10, 8]} />
            <meshBasicMaterial
              color={stage.uiAccent}
              transparent
              opacity={0.1}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
