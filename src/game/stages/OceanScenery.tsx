import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FIELD_LENGTH } from '../constants'
import { mulberry32 } from '../rng'
import { rt } from '../state'
import { ScrollField, type FieldItem } from '../ScrollField'
import { DEFAULT_CURVE } from '../track'
import { makeGlowTexture } from '../textures'
import { makeItems } from './sceneryUtils'
import type { StageConfig } from './types'

/** 가지산호 — 위로 펼쳐지는 가지 여러 개 */
function BranchCoral({ colors, variant }: { colors: string[]; variant: number }) {
  const color = colors[variant % colors.length]
  const branches = [
    { x: 0, z: 0, tilt: 0, h: 2.2 },
    { x: 0.42, z: 0.15, tilt: -0.5, h: 1.6 },
    { x: -0.4, z: -0.1, tilt: 0.55, h: 1.7 },
    { x: 0.14, z: -0.36, tilt: 0.3, h: 1.3 },
    { x: -0.18, z: 0.34, tilt: -0.28, h: 1.2 },
  ]
  return (
    <group>
      {branches.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} rotation={[b.tilt * 0.4, 0, b.tilt]}>
          <coneGeometry args={[0.16 + b.h * 0.06, b.h, 5, 2]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.25}
            roughness={0.7}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

/** 뇌산호 — 둥글넓적한 덩어리 */
function BrainCoral({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.45, 0]} scale={[1, 0.72, 1]}>
        <sphereGeometry args={[0.9, 12, 9]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.7, 0.28, 0.3]} scale={[1, 0.66, 1]}>
        <sphereGeometry args={[0.5, 10, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}

/** 말미잘 — 돔 위에 촉수 고리 */
function Anemone({ base, tip }: { base: string; tip: string }) {
  const tentacles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2
        return { a, x: Math.cos(a) * 0.32, z: Math.sin(a) * 0.32 }
      }),
    [],
  )
  return (
    <group>
      <mesh position={[0, 0.25, 0]} scale={[1, 0.6, 1]}>
        <sphereGeometry args={[0.5, 10, 8]} />
        <meshStandardMaterial color={base} roughness={0.8} />
      </mesh>
      {tentacles.map((t, i) => (
        <mesh key={i} position={[t.x, 0.62, t.z]} rotation={[Math.cos(t.a) * 0.5, 0, -Math.sin(t.a) * 0.5]}>
          <capsuleGeometry args={[0.05, 0.4, 4, 6]} />
          <meshStandardMaterial color={tip} emissive={tip} emissiveIntensity={0.35} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

/** 불가사리 */
function Starfish({ color }: { color: string }) {
  return (
    <group rotation={[0, 0.4, 0]}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.28, 0.07, Math.sin(a) * 0.28]}
            rotation={[0, -a, 0]}
            scale={[1.6, 0.35, 0.55]}
          >
            <sphereGeometry args={[0.22, 8, 6]} />
            <meshStandardMaterial color={color} roughness={0.85} flatShading />
          </mesh>
        )
      })}
    </group>
  )
}

/** 흔들리는 해초 줄기 — 마디마다 위상이 달라 물결처럼 눕는다 */
function KelpStrand({ color, phase }: { color: string; phase: number }) {
  const group = useRef<THREE.Group>(null!)
  const SEGS = 6

  useFrame(() => {
    const t = rt.time * 1.1 + phase
    for (let i = 0; i < group.current.children.length; i++) {
      group.current.children[i].rotation.z = Math.sin(t + i * 0.65) * 0.16
      group.current.children[i].rotation.x = Math.cos(t * 0.8 + i * 0.5) * 0.08
    }
  })

  // 사슬 중첩 대신 평면 배열로 두고 useFrame 에서 관절을 흔든다
  return (
    <group ref={group}>
      {Array.from({ length: SEGS }, (_, i) => (
        <group key={i} position={[0, i * 0.78, 0]}>
          <mesh position={[0, 0.42, 0]}>
            <capsuleGeometry args={[0.09 - i * 0.008, 0.68, 4, 6]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          {i % 2 === 0 && (
            <mesh position={[0.2, 0.5, 0]} rotation={[0, 0, -0.9]} scale={[1, 0.5, 0.3]}>
              <sphereGeometry args={[0.22, 6, 5]} />
              <meshStandardMaterial color={color} roughness={0.8} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

/** 조개 — 살짝 벌어진 두 장의 껍데기 */
function Clam({ shell, pearl }: { shell: string; pearl: string }) {
  return (
    <group>
      <mesh position={[0, 0.1, 0]} rotation={[0.15, 0, 0]} scale={[1, 0.35, 0.9]}>
        <sphereGeometry args={[0.4, 10, 8]} />
        <meshStandardMaterial color={shell} roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 0.26, -0.05]} rotation={[-0.7, 0, 0]} scale={[1, 0.35, 0.9]}>
        <sphereGeometry args={[0.4, 10, 8]} />
        <meshStandardMaterial color={shell} roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 0.2, 0.08]}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial color={pearl} emissive={pearl} emissiveIntensity={0.5} roughness={0.2} />
      </mesh>
    </group>
  )
}

/** 물고기 한 마리 — 몸통 + 꼬리 */
function Fish({ color, scale = 1 }: { color: string; scale?: number }) {
  return (
    <group scale={scale}>
      <mesh scale={[1.5, 0.75, 0.5]}>
        <sphereGeometry args={[0.3, 8, 6]} />
        <meshStandardMaterial color={color} roughness={0.5} flatShading />
      </mesh>
      <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.18, 0.32, 4, 1]} />
        <meshStandardMaterial color={color} roughness={0.5} flatShading />
      </mesh>
    </group>
  )
}

type SchoolConfig = {
  color: string
  count: number
  radius: number
  height: number
  speed: number
  phase: number
  z: number
}

/** 물고기 떼 — 타원 궤도를 무리지어 돈다 */
function FishSchool({ cfg }: { cfg: SchoolConfig }) {
  const group = useRef<THREE.Group>(null!)

  useFrame(() => {
    const t = rt.time * cfg.speed + cfg.phase
    for (let i = 0; i < group.current.children.length; i++) {
      const f = group.current.children[i]
      const a = t - i * 0.22
      f.position.set(
        Math.cos(a) * cfg.radius,
        cfg.height + Math.sin(a * 2 + i) * 0.8 + Math.sin(rt.time * 3 + i * 1.3) * 0.15,
        cfg.z + Math.sin(a) * cfg.radius * 0.45,
      )
      // 진행 방향을 바라본다
      f.rotation.y = -a + Math.PI / 2
      f.rotation.z = Math.sin(rt.time * 6 + i) * 0.12
    }
  })

  return (
    <group ref={group}>
      {Array.from({ length: cfg.count }, (_, i) => (
        <Fish key={i} color={cfg.color} scale={0.8 + (i % 3) * 0.2} />
      ))}
    </group>
  )
}

/** 원경의 큰 바위 무더기 — 둥글둥글한 덩어리를 쌓아 봉우리를 만든다 */
function FarBoulders({ colors, variant }: { colors: string[]; variant: number }) {
  return (
    <group>
      <mesh position={[0, 2.5, 0]} rotation={[variant * 0.8, variant * 1.4, 0.1]} scale={[1.25, 1, 1.1]}>
        <icosahedronGeometry args={[3.4, 0]} />
        <meshStandardMaterial color={colors[variant % colors.length]} roughness={1} flatShading />
      </mesh>
      <mesh position={[2.6, 5.2, 0.6]} rotation={[0.5, variant, 0.3]} scale={0.72}>
        <icosahedronGeometry args={[3.4, 0]} />
        <meshStandardMaterial color={colors[(variant + 1) % colors.length]} roughness={1} flatShading />
      </mesh>
      <mesh position={[-2.4, 4, -0.8]} rotation={[1.1, 0.3, variant]} scale={0.55}>
        <icosahedronGeometry args={[3.4, 0]} />
        <meshStandardMaterial color={colors[(variant + 2) % colors.length]} roughness={1} flatShading />
      </mesh>
      <mesh position={[0.4, 7, -0.2]} rotation={[0.2, 1.7, 0.6]} scale={0.4}>
        <icosahedronGeometry args={[3.4, 0]} />
        <meshStandardMaterial color={colors[variant % colors.length]} roughness={1} flatShading />
      </mesh>
    </group>
  )
}

/** 난파선 — 옆으로 기운 선체, 부러진 돛대, 찢어진 돛, 드러난 늑골 */
function Shipwreck({ hull, mast }: { hull: string; mast: string }) {
  return (
    <group rotation={[0, 0, -0.09]}>
      {/* 모래에 박힌 선체 */}
      <mesh position={[0, 1.9, 0]} scale={[6.4, 2.2, 2.4]} rotation={[0, 0, 0.14]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color={hull} roughness={1} flatShading />
      </mesh>
      {/* 부러진 뱃머리 쪽 — 드러난 늑골 */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[4.6 + i * 0.9, 1.7, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={1 - i * 0.16}
        >
          <torusGeometry args={[1.7, 0.13, 6, 10, Math.PI]} />
          <meshStandardMaterial color={mast} roughness={1} flatShading />
        </mesh>
      ))}
      {/* 돛대 — 하나는 서 있고 하나는 부러져 걸쳐 있다 */}
      <mesh position={[-1.2, 5.6, 0]} rotation={[0, 0, 0.12]}>
        <cylinderGeometry args={[0.16, 0.26, 7.4, 6]} />
        <meshStandardMaterial color={mast} roughness={1} />
      </mesh>
      <mesh position={[-1.2, 8.6, 0.1]} rotation={[0, 0, Math.PI / 2 - 0.15]}>
        <cylinderGeometry args={[0.09, 0.09, 4.4, 6]} />
        <meshStandardMaterial color={mast} roughness={1} />
      </mesh>
      <mesh position={[2.2, 4.2, 0]} rotation={[0, 0, 1.15]}>
        <cylinderGeometry args={[0.11, 0.17, 4.6, 6]} />
        <meshStandardMaterial color={mast} roughness={1} />
      </mesh>
      {/* 찢어진 돛 */}
      <mesh position={[-1.1, 7.1, 0.16]} rotation={[0.06, 0, -0.08]}>
        <planeGeometry args={[3.1, 2.5, 4, 3]} />
        <meshStandardMaterial
          color="#8fa3ab"
          roughness={0.9}
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

const FAR_LENGTH = 900

/** 수면에서 내리꽂히는 빛기둥 */
function GodRays({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null!)
  const glow = useMemo(() => makeGlowTexture(), [])
  const rays = useMemo(
    () =>
      [0, 1, 2, 3, 4].map((i) => ({
        i,
        x: -90 + i * 45 + (i % 2) * 14,
        tilt: 0.28 + (i % 3) * 0.07,
        w: 14 + (i % 3) * 8,
      })),
    [],
  )

  useFrame(() => {
    for (let i = 0; i < group.current.children.length; i++) {
      const m = group.current.children[i] as THREE.Mesh
      const mat = m.material as THREE.MeshBasicMaterial
      mat.opacity = 0.1 + Math.sin(rt.time * 0.5 + i * 1.7) * 0.05
    }
  })

  return (
    <group ref={group}>
      {rays.map((r) => (
        <mesh key={r.i} position={[r.x, 46, -210]} rotation={[0, 0, r.tilt]}>
          <planeGeometry args={[r.w, 110]} />
          <meshBasicMaterial
            map={glow}
            color={color}
            transparent
            opacity={0.12}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

export function OceanScenery({ stage }: { stage: StageConfig }) {
  const built = useMemo(() => {
    const rand = mulberry32(stage.seed)
    return {
      corals: makeItems(rand, 34, FIELD_LENGTH, 11, 38, [0.9, 2.0], 3),
      brains: makeItems(rand, 22, FIELD_LENGTH, 11, 30, [0.8, 1.8], 3),
      anemones: makeItems(rand, 42, FIELD_LENGTH, 10.5, 30, [0.7, 1.7], 3),
      kelps: makeItems(rand, 110, FIELD_LENGTH, 10, 44, [0.9, 2.6], 3),
      stars: makeItems(rand, 30, FIELD_LENGTH, 10.5, 26, [0.7, 1.5], 3),
      clams: makeItems(rand, 28, FIELD_LENGTH, 10.5, 26, [0.8, 1.6], 2),
      rocks: makeItems(rand, 18, FIELD_LENGTH, 13, 40, [0.9, 2.2], 3),
      farRocks: makeItems(rand, 18, FAR_LENGTH, 48, 150, [0.9, 2.2], 3),
      wrecks: [
        { id: 0, x: -74, y: 0, z: -220, scale: 3.4, rot: 0.5, variant: 0 },
        { id: 1, x: 98, y: 0, z: -560, scale: 4.4, rot: -2.4, variant: 1 },
      ] satisfies FieldItem[],
    }
  }, [stage])

  const schools = useMemo<SchoolConfig[]>(
    () => [
      { color: '#ffd166', count: 9, radius: 26, height: 8, speed: 0.35, phase: 0, z: -120 },
      { color: '#7fd8ff', count: 12, radius: 38, height: 13, speed: 0.26, phase: 2.4, z: -180 },
      { color: '#ff9ab8', count: 7, radius: 20, height: 5.5, speed: 0.45, phase: 4.2, z: -90 },
      // 원거리 무리 — 안개 속에서 크고 느리게 돈다
      { color: '#9fe8c8', count: 14, radius: 52, height: 16, speed: 0.2, phase: 1.1, z: -210 },
      { color: '#c9d8ff', count: 16, radius: 62, height: 11, speed: 0.17, phase: 3.3, z: -235 },
      { color: '#ffc9a0', count: 10, radius: 44, height: 19, speed: 0.23, phase: 5.1, z: -195 },
      { color: '#8fb8d0', count: 18, radius: 70, height: 14, speed: 0.14, phase: 0.7, z: -230 },
    ],
    [],
  )

  const curve = stage.curve ?? DEFAULT_CURVE
  const rock = stage.palette.rock
  const accent = stage.palette.accent

  return (
    <group>
      <ScrollField
        curve={curve}
        items={built.rocks}
        length={FIELD_LENGTH}
        render={(it) => (
          <mesh rotation={[it.variant, it.variant * 1.7, 0]} position={[0, 0.3, 0]}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={rock[it.variant % rock.length]} roughness={1} flatShading />
          </mesh>
        )}
      />
      <ScrollField
        curve={curve}
        items={built.corals}
        length={FIELD_LENGTH}
        render={(it) => <BranchCoral colors={accent} variant={it.variant} />}
      />
      <ScrollField
        curve={curve}
        items={built.brains}
        length={FIELD_LENGTH}
        render={(it) => <BrainCoral color={accent[(it.variant + 1) % accent.length]} />}
      />
      <ScrollField
        curve={curve}
        items={built.anemones}
        length={FIELD_LENGTH}
        render={(it) => (
          <Anemone base={rock[3]} tip={accent[it.variant % accent.length]} />
        )}
      />
      <ScrollField
        curve={curve}
        items={built.kelps}
        length={FIELD_LENGTH}
        render={(it) => (
          <group>
            <KelpStrand color="#3f8a5c" phase={it.id * 1.3} />
            {it.variant >= 1 && (
              <group position={[0.7, 0, 0.4]} scale={0.8}>
                <KelpStrand color="#4a9c62" phase={it.id * 1.3 + 2.1} />
              </group>
            )}
            {it.variant >= 2 && (
              <group position={[-0.6, 0, -0.3]} scale={0.65}>
                <KelpStrand color="#356f4e" phase={it.id * 1.3 + 4.4} />
              </group>
            )}
          </group>
        )}
      />
      <ScrollField
        curve={curve}
        items={built.stars}
        length={FIELD_LENGTH}
        render={(it) => <Starfish color={accent[it.variant % accent.length]} />}
      />
      <ScrollField
        curve={curve}
        items={built.clams}
        length={FIELD_LENGTH}
        render={() => <Clam shell={rock[1]} pearl="#e8fbff" />}
      />

      <ScrollField
        items={built.farRocks}
        length={FAR_LENGTH}
        speedScale={0.2}
        render={(it) => <FarBoulders colors={rock} variant={it.variant} />}
      />
      <ScrollField
        items={built.wrecks}
        length={FAR_LENGTH}
        speedScale={0.15}
        render={() => <Shipwreck hull="#1c333d" mast="#2e2b25" />}
      />

      {schools.map((cfg, i) => (
        <FishSchool key={i} cfg={cfg} />
      ))}
      <GodRays color="#bfeeff" />
    </group>
  )
}
