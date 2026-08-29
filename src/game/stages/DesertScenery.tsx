import { useMemo } from 'react'
import * as THREE from 'three'
import { FIELD_LENGTH } from '../constants'
import { mulberry32, range } from '../rng'
import { ScrollField } from '../ScrollField'
import { DEFAULT_CURVE } from '../track'
import { makeFloatingItems, makeItems } from './sceneryUtils'
import type { StageConfig } from './types'

const FAR_LENGTH = 900

/** 사구 — 낮게 퍼진 모래 언덕 */
function Dune({ color }: { color: string }) {
  return (
    <mesh position={[0, -0.6, 0]} scale={[1, 0.42, 1.35]}>
      <sphereGeometry args={[1, 14, 9]} />
      <meshStandardMaterial color={color} roughness={1} flatShading />
    </mesh>
  )
}

/** 메사 — 층이 진 붉은 바위 기둥 */
function Mesa({ colors, variant }: { colors: string[]; variant: number }) {
  const top = variant % 2 === 0 ? 0.72 : 0.5
  return (
    <group>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[top, 1, 3, 7, 1]} />
        <meshStandardMaterial color={colors[variant % colors.length]} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 0.35, 0]} scale={[1.28, 1, 1.28]}>
        <cylinderGeometry args={[1, 1.18, 0.7, 7, 1]} />
        <meshStandardMaterial
          color={colors[(variant + 1) % colors.length]}
          roughness={0.95}
          flatShading
        />
      </mesh>
    </group>
  )
}

/** 바위 아치 — 길 양옆에 세우는 랜드마크 */
function Arch({ color }: { color: string }) {
  return (
    <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0]}>
      <torusGeometry args={[2.2, 0.55, 6, 14, Math.PI]} />
      <meshStandardMaterial color={color} roughness={0.95} flatShading />
    </mesh>
  )
}

/** 선인장 */
function Cactus({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 1.1, 0]}>
        <capsuleGeometry args={[0.28, 1.7, 4, 10]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0.45, 1.25, 0]} rotation={[0, 0, -0.9]}>
        <capsuleGeometry args={[0.17, 0.6, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[-0.42, 0.95, 0]} rotation={[0, 0, 0.95]}>
        <capsuleGeometry args={[0.15, 0.5, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    </group>
  )
}

/** 원경의 거대한 바위산 — 느리게 흘러 시차를 만든다 */
function FarMesa({ colors, variant }: { colors: string[]; variant: number }) {
  return (
    <mesh position={[0, 6, 0]}>
      <coneGeometry args={[9, 22, variant % 2 === 0 ? 5 : 6, 1]} />
      <meshStandardMaterial color={colors[variant % colors.length]} roughness={1} flatShading />
    </mesh>
  )
}

/** 공중에 뜬 결정 — 배경에 반짝임을 준다 */
function Crystal({ color }: { color: string }) {
  return (
    <mesh>
      <octahedronGeometry args={[0.9, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.55}
        roughness={0.25}
        metalness={0.1}
        transparent
        opacity={0.85}
        flatShading
      />
    </mesh>
  )
}

export function DesertScenery({ stage }: { stage: StageConfig }) {
  const data = useMemo(() => {
    const rand = mulberry32(stage.seed)
    const dunes = makeItems(rand, 34, FIELD_LENGTH, 11, 44, [3.2, 7.5], 1)
    const mesas = makeItems(rand, 18, FIELD_LENGTH, 15, 52, [1.1, 2.6], 4)
    const cacti = makeItems(rand, 22, FIELD_LENGTH, 12, 30, [0.8, 1.5], 1)
    const arches = makeItems(rand, 5, FIELD_LENGTH, 13, 22, [1, 1.6], 1)
    const far = makeItems(rand, 16, FAR_LENGTH, 60, 190, [1, 2.2], 2).map((it) => ({
      ...it,
      z: -range(rand, 240, FAR_LENGTH),
    }))
    const crystals = makeFloatingItems(rand, 16, FIELD_LENGTH, [3, 11], [0.5, 1.3])
    return { dunes, mesas, cacti, arches, far, crystals }
  }, [stage])

  const curve = stage.curve ?? DEFAULT_CURVE
  const rock = stage.palette.rock
  const sand = new THREE.Color(stage.ground.base).lerp(new THREE.Color(stage.ground.ripple), 0.35)

  return (
    <group>
      <ScrollField
        items={data.far}
        length={FAR_LENGTH}
        speedScale={0.22}
        render={(it) => <FarMesa colors={rock} variant={it.variant} />}
      />
      <ScrollField
        curve={curve}
        items={data.dunes}
        length={FIELD_LENGTH}
        render={() => <Dune color={`#${sand.getHexString()}`} />}
      />
      <ScrollField
        curve={curve}
        items={data.mesas}
        length={FIELD_LENGTH}
        render={(it) => <Mesa colors={rock} variant={it.variant} />}
      />
      <ScrollField
        curve={curve}
        items={data.cacti}
        length={FIELD_LENGTH}
        render={() => <Cactus color={stage.palette.accent[0]} />}
      />
      <ScrollField
        curve={curve}
        items={data.arches}
        length={FIELD_LENGTH}
        render={() => <Arch color={rock[1]} />}
      />
      <ScrollField
        curve={curve}
        items={data.crystals}
        length={FIELD_LENGTH}
        spin={0.6}
        render={() => <Crystal color={stage.palette.crystal} />}
      />
    </group>
  )
}
