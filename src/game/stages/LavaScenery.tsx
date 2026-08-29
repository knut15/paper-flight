import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FIELD_LENGTH } from '../constants'
import { mulberry32, range } from '../rng'
import { rt } from '../state'
import { ScrollField } from '../ScrollField'
import { DEFAULT_CURVE } from '../track'
import { makeGlowTexture } from '../textures'
import { makeItems } from './sceneryUtils'
import type { StageConfig } from './types'

const FAR_LENGTH = 900

/** 검게 굳은 용암 언덕 */
function BasaltMound({ color }: { color: string }) {
  return (
    <mesh position={[0, -0.5, 0]} scale={[1, 0.45, 1.3]}>
      <sphereGeometry args={[1, 12, 8]} />
      <meshStandardMaterial color={color} roughness={1} flatShading />
    </mesh>
  )
}

/** 화산암 첨탑 — 끝이 발갛게 달아 있다 */
function VolcanicSpike({ colors, glow }: { colors: string[]; glow: string }) {
  return (
    <group>
      <mesh position={[0, 1.9, 0]}>
        <coneGeometry args={[0.75, 3.8, 5, 1]} />
        <meshStandardMaterial color={colors[0]} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 3.55, 0]}>
        <coneGeometry args={[0.16, 0.5, 5, 1]} />
        <meshStandardMaterial
          color={glow}
          emissive={glow}
          emissiveIntensity={1.6}
          roughness={0.4}
          flatShading
        />
      </mesh>
    </group>
  )
}

/** 용암 웅덩이 — 바닥에서 붉게 빛난다 */
function LavaPool({ glow }: { glow: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
      <circleGeometry args={[1.6, 18]} />
      <meshBasicMaterial
        color={glow}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

/** 무너진 검은 바위 무더기 */
function SlagPile({ colors, variant }: { colors: string[]; variant: number }) {
  return (
    <group>
      <mesh rotation={[variant, variant * 1.7, 0]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={colors[variant % colors.length]} roughness={1} flatShading />
      </mesh>
      <mesh position={[0.7, -0.2, 0.3]} scale={0.55} rotation={[0, variant, 0.4]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={colors[(variant + 1) % colors.length]} roughness={1} flatShading />
      </mesh>
    </group>
  )
}

/** 원경 화산 — 분화구가 빛나고 연기가 오른다 */
function FarVolcano({ colors, glow, variant }: { colors: string[]; glow: string; variant: number }) {
  return (
    <group position={[0, 5, 0]}>
      <mesh>
        <coneGeometry args={[11, 21, variant % 2 === 0 ? 6 : 7, 1]} />
        <meshStandardMaterial color={colors[variant % colors.length]} roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 10.8, 0]}>
        <cylinderGeometry args={[2.4, 3.4, 1.4, 7]} />
        <meshBasicMaterial color={glow} />
      </mesh>
      <mesh position={[0, 12, 0]} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[3.4, 10, 7]} />
        <meshStandardMaterial color="#241312" roughness={1} flatShading transparent opacity={0.85} />
      </mesh>
    </group>
  )
}

const BURST_COUNT = 5

/** 길가에서 이따금 솟는 불기둥. 배경 연출용이라 충돌은 없다. */
function FireBursts({ stage }: { stage: StageConfig }) {
  const group = useRef<THREE.Group>(null!)
  const glow = useMemo(() => makeGlowTexture('rgba(255,170,80,0.95)', 'rgba(255,60,20,0)'), [])
  const seeds = useMemo(() => {
    const rand = mulberry32(stage.seed + 77)
    return Array.from({ length: BURST_COUNT }, (_, i) => ({
      i,
      x: (rand() > 0.5 ? 1 : -1) * range(rand, 11, 20),
      z: -range(rand, 30, FIELD_LENGTH * 0.9),
      period: range(rand, 3.2, 5.6),
      offset: rand() * 6,
    }))
  }, [stage])

  useFrame((_, delta) => {
    if (!group.current) return
    const dt = Math.min(delta, 0.05)
    const d = rt.running ? rt.speed * dt : 0
    for (let i = 0; i < group.current.children.length; i++) {
      const g = group.current.children[i] as THREE.Group
      const cfg = seeds[i]
      g.position.z += d
      if (g.position.z > 20) g.position.z -= FIELD_LENGTH
      const t = ((rt.time + cfg.offset) % cfg.period) / cfg.period
      // 짧게 솟았다가 사그라든다
      const life = t < 0.3 ? Math.sin((t / 0.3) * Math.PI) : 0
      g.visible = life > 0.02
      g.scale.set(0.8 + life * 0.5, 0.2 + life * 2.6, 1)
      const m = (g.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial
      m.opacity = life * 0.9
    }
  })

  return (
    <group ref={group}>
      {seeds.map((s) => (
        <group key={s.i} position={[s.x, 2.2, s.z]}>
          <mesh>
            <planeGeometry args={[2.4, 5.2]} />
            <meshBasicMaterial
              map={glow}
              color={stage.palette.accent[0]}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function LavaScenery({ stage }: { stage: StageConfig }) {
  const built = useMemo(() => {
    const rand = mulberry32(stage.seed)
    return {
      mounds: makeItems(rand, 30, FIELD_LENGTH, 11, 42, [2.8, 6.5], 1),
      spikes: makeItems(rand, 22, FIELD_LENGTH, 12, 36, [0.9, 2.0], 1),
      pools: makeItems(rand, 16, FIELD_LENGTH, 12, 30, [0.8, 1.8], 1),
      slag: makeItems(rand, 20, FIELD_LENGTH, 13, 38, [0.7, 1.9], 3),
      far: makeItems(rand, 12, FAR_LENGTH, 60, 190, [0.9, 2.0], 2).map((it) => ({
        ...it,
        z: -range(rand, 260, FAR_LENGTH),
      })),
    }
  }, [stage])

  const curve = stage.curve ?? DEFAULT_CURVE
  const rock = stage.palette.rock

  return (
    <group>
      <ScrollField
        items={built.far}
        length={FAR_LENGTH}
        speedScale={0.22}
        render={(it) => (
          <FarVolcano colors={rock} glow={stage.palette.accent[0]} variant={it.variant} />
        )}
      />
      <ScrollField
        curve={curve}
        items={built.mounds}
        length={FIELD_LENGTH}
        render={() => <BasaltMound color={rock[1]} />}
      />
      <ScrollField
        curve={curve}
        items={built.spikes}
        length={FIELD_LENGTH}
        render={() => <VolcanicSpike colors={rock} glow={stage.palette.accent[0]} />}
      />
      <ScrollField
        curve={curve}
        items={built.pools}
        length={FIELD_LENGTH}
        render={() => <LavaPool glow={stage.palette.accent[0]} />}
      />
      <ScrollField
        curve={curve}
        items={built.slag}
        length={FIELD_LENGTH}
        render={(it) => <SlagPile colors={rock} variant={it.variant} />}
      />
      <FireBursts stage={stage} />
    </group>
  )
}
