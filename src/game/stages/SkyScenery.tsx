import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FIELD_LENGTH } from '../constants'
import { mulberry32, range, type Rand } from '../rng'
import { rt } from '../state'
import { ScrollField, type FieldItem } from '../ScrollField'
import { DEFAULT_CURVE } from '../track'
import { makeGlowTexture } from '../textures'
import { makeItems } from './sceneryUtils'
import type { StageConfig } from './types'

const FAR_LENGTH = 900

/** 뭉게구름 한 덩이 — 아래가 평평한 흰 구 무더기 (사실적인 흰색) */
function CloudPuff({
  opacity = 0.94,
  flat = 0.62,
}: {
  opacity?: number
  flat?: number
}) {
  const lobes = [
    { x: 0, y: 0.3, z: 0, s: 1 },
    { x: 0.9, y: 0.1, z: 0.2, s: 0.74 },
    { x: -0.85, y: 0.08, z: -0.15, s: 0.66 },
    { x: 0.3, y: 0.6, z: -0.3, s: 0.58 },
    { x: -0.4, y: 0.5, z: 0.3, s: 0.52 },
    { x: 1.55, y: -0.08, z: -0.1, s: 0.44 },
  ]
  const translucent = opacity < 0.8
  return (
    <group>
      {lobes.map((l, i) => (
        <mesh key={i} position={[l.x, l.y, l.z]} scale={[l.s, l.s * flat, l.s]}>
          {/* 반투명 구름은 코앞에서 보이므로 더 매끈하게 */}
          <sphereGeometry args={translucent ? [1, 20, 14] : [1, 10, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={translucent ? 0.35 : 0.05}
            roughness={1}
            transparent
            opacity={opacity}
            depthWrite={!translucent}
          />
        </mesh>
      ))}
    </group>
  )
}

/** 지평선의 적란운 기둥 */
function CloudTower({ variant }: { variant: number }) {
  const tiers = 2 + (variant % 2)
  return (
    <group>
      {Array.from({ length: tiers }, (_, i) => (
        <group
          key={i}
          position={[(i % 2 === 0 ? 0.4 : -0.5) * i, i * 1.3, (i % 2) * 0.4]}
          scale={1.15 - i * 0.2}
        >
          <CloudPuff flat={0.72} />
        </group>
      ))}
    </group>
  )
}

/** 저 멀리 비행운을 그리며 지나가는 여객기 */
function ContrailPlane({
  height,
  z,
  speed,
  dir,
  phase,
}: {
  height: number
  z: number
  speed: number
  dir: 1 | -1
  phase: number
}) {
  const root = useRef<THREE.Group>(null!)
  const glow = useMemo(() => makeGlowTexture(), [])

  useFrame(() => {
    const span = 560
    const t = ((rt.time * speed + phase) % 1 + 1) % 1
    const x = dir * (-span / 2 + t * span)
    root.current.position.set(x, height, z)
  })

  return (
    <group ref={root} rotation={[0, dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
      {/* 기체 — 멀리서 반짝이는 작은 은색 십자 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.5, 3.6, 4, 8]} />
        <meshStandardMaterial color="#e8eef4" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh>
        <boxGeometry args={[7, 0.16, 1.1]} />
        <meshStandardMaterial color="#dce4ec" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.7, 2.0]}>
        <boxGeometry args={[0.14, 1.4, 0.9]} />
        <meshStandardMaterial color="#dce4ec" roughness={0.4} />
      </mesh>
      {/* 비행운 — 뒤로 길게 남는 흰 줄 */}
      <mesh position={[0, 0, 52]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 100]} />
        <meshBasicMaterial
          map={glow}
          color="#ffffff"
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          fog={false}
        />
      </mesh>
    </group>
  )
}

/** 비행 경로 위에 놓여 실제로 뚫고 지나가게 되는 구름 — 가끔만 나온다 */
function buildPassClouds(rand: Rand): FieldItem[] {
  const COUNT = 4
  return Array.from({ length: COUNT }, (_, id) => ({
    id,
    x: range(rand, -4, 4),
    y: range(rand, 2.2, 5.2),
    // 코스 전체에 띄엄띄엄 — 한 바퀴에 네 번 정도만 마주친다
    z: -((id + 0.5) * (FIELD_LENGTH / COUNT)) - range(rand, 0, 20),
    scale: range(rand, 2.2, 3.6),
    rot: rand() * Math.PI * 2,
    variant: 0,
  }))
}

/** 화면 전체에 골고루 떠 있는 반투명 구름 안개 — 경로는 비켜나 있다 */
function buildWisps(rand: Rand): FieldItem[] {
  return Array.from({ length: 30 }, (_, id) => {
    // 좌우 어느 쪽이든, 단 비행 회랑(±6)은 피한다
    const side = rand() > 0.5 ? 1 : -1
    return {
      id,
      x: side * range(rand, 6.5, 44),
      y: range(rand, 0.5, 16),
      z: -range(rand, 15, FIELD_LENGTH),
      scale: range(rand, 1.6, 3.4),
      rot: rand() * Math.PI * 2,
      variant: 0,
    }
  })
}

export function SkyScenery({ stage }: { stage: StageConfig }) {
  const built = useMemo(() => {
    const rand = mulberry32(stage.seed)
    return {
      // 발밑 저 아래에 떠 있는 구름 — 지면(구름층)과 비행 고도 사이의 시차 층
      deckLow: makeItems(rand, 36, FIELD_LENGTH, 8, 64, [5, 10], 1).map((it) => ({
        ...it,
        y: range(rand, -48, -30),
      })),
      deckMid: makeItems(rand, 30, FIELD_LENGTH, 8, 56, [3.2, 6.5], 1).map((it) => ({
        ...it,
        y: range(rand, -26, -10),
      })),
      // 비행 고도 부근을 떠가는 구름
      midClouds: makeItems(rand, 16, FIELD_LENGTH, 12, 46, [1.6, 3.2], 1).map((it) => ({
        ...it,
        y: range(rand, 5, 12),
      })),
      // 통과하는 구름 (가끔) + 화면 전체의 반투명 구름 안개
      passClouds: buildPassClouds(rand),
      wisps: buildWisps(rand),
      // 머리 위를 지나가는 구름 — 화면 위쪽까지 입체감을 채운다
      canopy: Array.from({ length: 18 }, (_, id) => ({
        id,
        x: range(rand, -44, 44),
        y: range(rand, 9, 20),
        z: -range(rand, 20, FIELD_LENGTH),
        scale: range(rand, 2.2, 4.6),
        rot: rand() * Math.PI * 2,
        variant: 0,
      })),
      // 지평선의 적란운 벽
      farWall: makeItems(rand, 16, FAR_LENGTH, 60, 210, [5, 11], 2).map((it) => ({
        ...it,
        y: range(rand, -20, 2),
        z: -range(rand, 260, FAR_LENGTH),
      })),
    }
  }, [stage])

  const curve = stage.curve ?? DEFAULT_CURVE

  return (
    <group>
      <ScrollField
        items={built.farWall}
        length={FAR_LENGTH}
        speedScale={0.18}
        render={(it) => <CloudTower variant={it.variant} />}
      />
      <ScrollField
        curve={curve}
        items={built.deckLow}
        length={FIELD_LENGTH}
        render={() => <CloudPuff flat={0.8} />}
      />
      <ScrollField
        curve={curve}
        items={built.deckMid}
        length={FIELD_LENGTH}
        render={() => <CloudPuff flat={0.78} />}
      />
      <ScrollField
        curve={curve}
        items={built.midClouds}
        length={FIELD_LENGTH}
        render={() => <CloudPuff />}
      />
      <ScrollField
        curve={curve}
        items={built.canopy}
        length={FIELD_LENGTH}
        render={() => <CloudPuff flat={0.55} />}
      />
      <ScrollField
        curve={curve}
        items={built.wisps}
        length={FIELD_LENGTH}
        render={() => <CloudPuff opacity={0.5} />}
      />
      <ScrollField
        curve={curve}
        items={built.passClouds}
        length={FIELD_LENGTH}
        render={() => <CloudPuff opacity={0.55} />}
      />

      <ContrailPlane height={34} z={-300} speed={0.011} dir={1} phase={0.2} />
      <ContrailPlane height={44} z={-380} speed={0.007} dir={-1} phase={0.65} />
    </group>
  )
}
