import { useMemo } from 'react'
import { FIELD_LENGTH } from '../constants'
import { mulberry32, range } from '../rng'
import { ScrollField } from '../ScrollField'
import { DEFAULT_CURVE } from '../track'
import { BlackHole } from './BlackHole'
import { Eclipse } from './Eclipse'
import { makeFloatingItems, makeItems } from './sceneryUtils'
import type { StageConfig } from './types'

const FAR_LENGTH = 900

/** 성운 원반에서 솟은 결정 기둥 */
function CrystalPillar({ colors, variant }: { colors: string[]; variant: number }) {
  const glow = colors[(variant + 2) % colors.length]
  return (
    <group>
      <mesh position={[0, 2, 0]} rotation={[0, variant * 0.6, 0.05]}>
        <coneGeometry args={[0.6, 4, 5, 1]} />
        <meshStandardMaterial
          color={colors[variant % colors.length]}
          emissive={glow}
          emissiveIntensity={0.35}
          roughness={0.3}
          metalness={0.2}
          flatShading
        />
      </mesh>
      <mesh position={[0.55, 1, 0.2]} rotation={[0, 0.8, -0.2]} scale={0.6}>
        <coneGeometry args={[0.5, 3, 5, 1]} />
        <meshStandardMaterial
          color={colors[(variant + 1) % colors.length]}
          emissive={glow}
          emissiveIntensity={0.3}
          roughness={0.3}
          flatShading
        />
      </mesh>
    </group>
  )
}

/** 떠 있는 소행성 */
function Asteroid({ color, variant }: { color: string; variant: number }) {
  return (
    <group>
      <mesh rotation={[variant * 0.7, variant * 1.3, 0]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={color} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0.6, 0.5, -0.4]} scale={0.45}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={color} roughness={0.95} flatShading />
      </mesh>
    </group>
  )
}

/** 버려진 궤도 고리 구조물 */
function OrbitRing({ color, glow }: { color: string; glow: string }) {
  return (
    <group rotation={[0.5, 0, 0.3]}>
      <mesh>
        <torusGeometry args={[2.4, 0.16, 6, 24]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} flatShading />
      </mesh>
      <mesh scale={0.62} rotation={[0.9, 0.4, 0]}>
        <torusGeometry args={[2.4, 0.1, 6, 20]} />
        <meshStandardMaterial
          color={glow}
          emissive={glow}
          emissiveIntensity={0.9}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}

/** 원경 행성. 고리를 두른 개체가 섞인다. */
function FarPlanet({
  colors,
  ringColor,
  variant,
}: {
  colors: string[]
  ringColor: string
  variant: number
}) {
  const body = colors[variant % colors.length]
  return (
    <group position={[0, 14, 0]}>
      <mesh>
        <sphereGeometry args={[7.5, 24, 18]} />
        <meshStandardMaterial
          color={body}
          roughness={0.8}
          emissive={body}
          emissiveIntensity={0.1}
          fog={false}
        />
      </mesh>
      {variant % 2 === 0 && (
        <mesh rotation={[Math.PI / 2.3, 0, 0.35]}>
          <torusGeometry args={[12, 0.7, 2, 48]} />
          <meshStandardMaterial
            color={ringColor}
            emissive={ringColor}
            emissiveIntensity={0.5}
            roughness={0.5}
            transparent
            opacity={0.85}
            fog={false}
          />
        </mesh>
      )}
    </group>
  )
}

export function SpaceScenery({ stage }: { stage: StageConfig }) {
  const built = useMemo(() => {
    const rand = mulberry32(stage.seed)
    return {
      pillars: makeItems(rand, 26, FIELD_LENGTH, 11, 40, [0.9, 2.2], 4),
      asteroidsLow: makeItems(rand, 18, FIELD_LENGTH, 13, 38, [0.8, 2.2], 3),
      rings: makeItems(rand, 6, FIELD_LENGTH, 14, 26, [0.9, 1.6], 1),
      far: makeItems(rand, 5, FAR_LENGTH, 110, 250, [0.5, 1.0], 3).map((it) => ({
        ...it,
        z: -range(rand, 420, FAR_LENGTH),
      })),
      floatRocks: makeFloatingItems(rand, 16, FIELD_LENGTH, [4, 14], [0.5, 1.4]),
    }
  }, [stage])

  const curve = stage.curve ?? DEFAULT_CURVE
  const rock = stage.palette.rock

  return (
    <group>
      <ScrollField
        items={built.far}
        length={FAR_LENGTH}
        speedScale={0.1}
        render={(it) => (
          <FarPlanet colors={rock} ringColor={stage.palette.rock[3]} variant={it.variant} />
        )}
      />
      {/* 하늘에 걸린 블랙홀. 스테이지 내내 같은 자리에서 항로를 내려다본다. */}
      <group position={[-214, 96, -560]} scale={14}>
        <BlackHole />
      </group>
      <group position={[286, 58, -760]} scale={3.4}>
        <BlackHole />
      </group>

      {/* 반대편 하늘의 개기일식 — 큰 것 하나와 멀리 두 개 */}
      <group position={[112, 84, -470]} scale={15}>
        <Eclipse seed={0.7} />
      </group>
      <group position={[214, 132, -560]} scale={6.5}>
        <Eclipse seed={2.9} />
      </group>
      <group position={[18, 26, -600]} scale={4.6}>
        <Eclipse seed={5.1} />
      </group>
      <ScrollField
        curve={curve}
        items={built.pillars}
        length={FIELD_LENGTH}
        render={(it) => <CrystalPillar colors={rock} variant={it.variant} />}
      />
      <ScrollField
        curve={curve}
        items={built.asteroidsLow}
        length={FIELD_LENGTH}
        spin={0.25}
        render={(it) => <Asteroid color={rock[(it.variant + 1) % rock.length]} variant={it.variant} />}
      />
      <ScrollField
        curve={curve}
        items={built.floatRocks}
        length={FIELD_LENGTH}
        spin={0.4}
        render={(it) => <Asteroid color={rock[it.variant % rock.length]} variant={it.variant} />}
      />
      <ScrollField
        curve={curve}
        items={built.rings}
        length={FIELD_LENGTH}
        render={() => <OrbitRing color={rock[1]} glow={stage.palette.accent[1]} />}
      />
    </group>
  )
}
