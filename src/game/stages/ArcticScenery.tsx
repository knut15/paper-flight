import { useMemo } from 'react'
import * as THREE from 'three'
import { FIELD_LENGTH } from '../constants'
import { mulberry32, range } from '../rng'
import { ScrollField } from '../ScrollField'
import { DEFAULT_CURVE } from '../track'
import { makeFloatingItems, makeItems } from './sceneryUtils'
import type { StageConfig } from './types'

const FAR_LENGTH = 900

/** 눈 언덕 — 낮게 퍼진 설구 */
function Drift({ color }: { color: string }) {
  return (
    <mesh position={[0, -0.55, 0]} scale={[1, 0.38, 1.4]}>
      <sphereGeometry args={[1, 14, 9]} />
      <meshStandardMaterial color={color} roughness={0.95} flatShading />
    </mesh>
  )
}

/** 빙산 — 각진 얼음 덩어리를 두 겹으로 쌓는다 */
function Iceberg({ colors, variant }: { colors: string[]; variant: number }) {
  return (
    <group>
      <mesh position={[0, 1.7, 0]} rotation={[0, variant * 0.7, 0.08]}>
        <coneGeometry args={[1.15, 3.6, variant % 2 === 0 ? 5 : 6, 1]} />
        <meshStandardMaterial
          color={colors[variant % colors.length]}
          roughness={0.35}
          metalness={0.05}
          flatShading
          transparent
          opacity={0.95}
        />
      </mesh>
      <mesh position={[0.5, 0.7, 0.35]} rotation={[0, 0.9, -0.14]} scale={0.55}>
        <coneGeometry args={[1, 2.6, 5, 1]} />
        <meshStandardMaterial
          color={colors[(variant + 2) % colors.length]}
          roughness={0.35}
          flatShading
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh position={[0, 0.18, 0]} scale={[1.5, 0.3, 1.5]}>
        <sphereGeometry args={[1, 10, 7]} />
        <meshStandardMaterial color={colors[2]} roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}

/** 얼음 첨탑 — 가늘고 높게 솟는다 */
function IceSpire({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 2.2, 0]}>
        <coneGeometry args={[0.4, 4.4, 4, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.25}
          metalness={0.1}
          flatShading
          transparent
          opacity={0.88}
        />
      </mesh>
      <mesh position={[0.34, 1.2, 0.1]} rotation={[0, 0, -0.22]}>
        <coneGeometry args={[0.22, 2.4, 4, 1]} />
        <meshStandardMaterial color={color} roughness={0.25} flatShading transparent opacity={0.85} />
      </mesh>
    </group>
  )
}

/** 눈 덮인 전나무 */
function SnowPine({ trunk, needle, snow }: { trunk: string; needle: string; snow: string }) {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.7, 6]} />
        <meshStandardMaterial color={trunk} roughness={0.9} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0.85 + i * 0.62, 0]}>
          <mesh>
            <coneGeometry args={[0.72 - i * 0.18, 0.95, 7, 1]} />
            <meshStandardMaterial color={needle} roughness={0.85} flatShading />
          </mesh>
          <mesh position={[0, 0.16, 0]} scale={[1, 0.5, 1]}>
            <coneGeometry args={[0.62 - i * 0.16, 0.95, 7, 1]} />
            <meshStandardMaterial color={snow} roughness={0.95} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** 얼음 아치 — 길가에 세우는 랜드마크 */
function IceArch({ color }: { color: string }) {
  return (
    <mesh position={[0, 0.2, 0]}>
      <torusGeometry args={[2.3, 0.5, 6, 14, Math.PI]} />
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.08}
        flatShading
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}

/** 원경 빙하 산맥 */
function FarGlacier({ colors, variant }: { colors: string[]; variant: number }) {
  return (
    <mesh position={[0, 6, 0]}>
      <coneGeometry args={[10, 24, variant % 2 === 0 ? 4 : 5, 1]} />
      <meshStandardMaterial color={colors[variant % colors.length]} roughness={0.95} flatShading />
    </mesh>
  )
}

/** 공중에 뜬 얼음 조각 */
function IceShard({ color }: { color: string }) {
  return (
    <mesh>
      <octahedronGeometry args={[0.85, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.35}
        roughness={0.15}
        metalness={0.15}
        transparent
        opacity={0.75}
        flatShading
      />
    </mesh>
  )
}

export function ArcticScenery({ stage }: { stage: StageConfig }) {
  const built = useMemo(() => {
    const rand = mulberry32(stage.seed)
    return {
      drifts: makeItems(rand, 32, FIELD_LENGTH, 11, 44, [3.4, 8], 1),
      bergs: makeItems(rand, 16, FIELD_LENGTH, 15, 50, [1.1, 2.4], 4),
      spires: makeItems(rand, 20, FIELD_LENGTH, 12, 34, [0.9, 1.8], 1),
      pines: makeItems(rand, 24, FIELD_LENGTH, 12, 32, [0.9, 1.7], 1),
      arches: makeItems(rand, 5, FIELD_LENGTH, 13, 22, [1, 1.5], 1),
      far: makeItems(rand, 16, FAR_LENGTH, 60, 190, [1, 2.2], 2).map((it) => ({
        ...it,
        z: -range(rand, 240, FAR_LENGTH),
      })),
      shards: makeFloatingItems(rand, 18, FIELD_LENGTH, [3, 12], [0.4, 1.1]),
    }
  }, [stage])

  const curve = stage.curve ?? DEFAULT_CURVE
  const rock = stage.palette.rock
  const snow = new THREE.Color(stage.ground.base)
    .lerp(new THREE.Color(stage.ground.ripple), 0.32)
    .getHexString()

  return (
    <group>
      <ScrollField
        items={built.far}
        length={FAR_LENGTH}
        speedScale={0.22}
        render={(it) => <FarGlacier colors={rock} variant={it.variant} />}
      />
      <ScrollField
        curve={curve}
        items={built.drifts}
        length={FIELD_LENGTH}
        render={() => <Drift color={`#${snow}`} />}
      />
      <ScrollField
        curve={curve}
        items={built.bergs}
        length={FIELD_LENGTH}
        render={(it) => <Iceberg colors={rock} variant={it.variant} />}
      />
      <ScrollField
        curve={curve}
        items={built.spires}
        length={FIELD_LENGTH}
        render={() => <IceSpire color={rock[0]} />}
      />
      <ScrollField
        curve={curve}
        items={built.pines}
        length={FIELD_LENGTH}
        render={() => (
          <SnowPine trunk="#5c4636" needle={stage.palette.accent[0]} snow={stage.ground.base} />
        )}
      />
      <ScrollField
        curve={curve}
        items={built.arches}
        length={FIELD_LENGTH}
        render={() => <IceArch color={rock[1]} />}
      />
      <ScrollField
        curve={curve}
        items={built.shards}
        length={FIELD_LENGTH}
        spin={0.5}
        render={() => <IceShard color={stage.palette.crystal} />}
      />
    </group>
  )
}
