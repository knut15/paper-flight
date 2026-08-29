import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FIELD_LENGTH } from '../constants'
import { mulberry32, range } from '../rng'
import { rt } from '../state'
import { ScrollField } from '../ScrollField'
import { curveAt, DEFAULT_CURVE } from '../track'
import { makeStrataTexture } from '../textures'
import { makeWallGeometry } from './sceneryUtils'
import { makeItems } from './sceneryUtils'
import type { StageConfig } from './types'

const FAR_LENGTH = 900
const WALL_COUNT = 26
const WALL_GAP = FIELD_LENGTH / WALL_COUNT

const WALL_VARIANTS = 6

/**
 * 절벽 겹. 뒤로 갈수록 밖으로 밀리고(off) 높아지고(sy) 어두워져서
 * 겹겹이 쌓인 두꺼운 협곡이 되고, 그 뒤 하늘은 완전히 가려진다.
 */
const WALL_LAYERS = [
  { off: 0, sy: 1, y: 0, color: '#ffffff' },
  { off: 3.2, sy: 1.14, y: 0.7, color: '#8a6248' },
  { off: 7.2, sy: 1.62, y: 2.2, color: '#6f4c36' },
  { off: 12, sy: 2.35, y: 4.6, color: '#553827' },
]

function CanyonWalls({ stage }: { stage: StageConfig }) {
  const group = useRef<THREE.Group>(null!)
  const curve = stage.curve ?? DEFAULT_CURVE
  const strata = useMemo(
    () => makeStrataTexture(stage.palette.rock, stage.seed + 5),
    [stage],
  )
  useEffect(() => () => strata.dispose(), [strata])

  const { walls, variants } = useMemo(() => {
    const rand = mulberry32(stage.seed + 31)
    const variants = Array.from({ length: WALL_VARIANTS }, () =>
      makeWallGeometry(WALL_GAP * 1.25, 10 + rand() * 8, rand),
    )
    const walls: { x: number; z: number; h: number; side: 1 | -1; v: number }[] = []
    for (let i = 0; i < WALL_COUNT; i++) {
      for (const side of [1, -1] as const) {
        walls.push({
          side,
          x: side * range(rand, 17, 21),
          z: -i * WALL_GAP - range(rand, 0, WALL_GAP * 0.3),
          h: range(rand, 0.85, 1.25),
          v: Math.floor(rand() * WALL_VARIANTS),
        })
      }
    }
    return { walls, variants }
  }, [stage])

  useFrame((_, delta) => {
    const kids = group.current.children
    const d = rt.running ? rt.speed * Math.min(delta, 0.05) : 0
    for (let i = 0; i < kids.length; i++) {
      const c = kids[i]
      c.position.z += d
      if (c.position.z > 30) c.position.z -= FIELD_LENGTH
      c.position.x = walls[i].x + curveAt(rt.distance, c.position.z, curve)
    }
  })

  return (
    <group ref={group}>
      {walls.map((w, i) => (
        <group key={i} position={[w.x, 4.6 * w.h, w.z]}>
          {WALL_LAYERS.map((layer, li) => (
            <mesh
              key={li}
              geometry={variants[(w.v + li * 2) % WALL_VARIANTS]}
              position={[w.side * layer.off, layer.y, 0]}
              rotation={[0, (w.side > 0 ? -1 : 1) * (Math.PI / 2), 0]}
              scale={[1, w.h * layer.sy, 1]}
            >
              <meshStandardMaterial
                map={strata}
                color={layer.color}
                roughness={li === 0 ? 0.95 : 1}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/** 붉은 첨탑 바위(후두) */
function Hoodoo({ colors, variant }: { colors: string[]; variant: number }) {
  return (
    <group>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.5, 0.9, 2.8, 6]} />
        <meshStandardMaterial color={colors[variant % colors.length]} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 3.0, 0]} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[0.95, 8, 6]} />
        <meshStandardMaterial
          color={colors[(variant + 1) % colors.length]}
          roughness={0.95}
          flatShading
        />
      </mesh>
    </group>
  )
}

/** 마른 덤불 */
function Scrub({ color }: { color: string }) {
  return (
    <mesh position={[0, 0.35, 0]} scale={[1, 0.7, 1]}>
      <icosahedronGeometry args={[0.55, 0]} />
      <meshStandardMaterial color={color} roughness={1} flatShading />
    </mesh>
  )
}

/** 원경의 층진 대지(메사) */
function FarMesa({ colors, variant }: { colors: string[]; variant: number }) {
  return (
    <group position={[0, 5.5, 0]}>
      <mesh>
        <cylinderGeometry args={[8, 10.5, 11, 7, 1]} />
        <meshStandardMaterial color={colors[variant % colors.length]} roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 6.2, 0]}>
        <cylinderGeometry args={[8.4, 8.4, 1.4, 7, 1]} />
        <meshStandardMaterial color={colors[(variant + 2) % colors.length]} roughness={1} flatShading />
      </mesh>
    </group>
  )
}

/** 하늘을 도는 새 실루엣 */
function Birds() {
  const group = useRef<THREE.Group>(null!)
  const seeds = useMemo(() => [0, 1, 2, 3].map((i) => ({ i, r: 26 + i * 8, h: 22 + (i % 2) * 6, sp: 0.14 + (i % 3) * 0.04 })), [])

  useFrame(() => {
    for (let i = 0; i < group.current.children.length; i++) {
      const b = group.current.children[i]
      const cfg = seeds[i]
      const a = rt.time * cfg.sp + cfg.i * 1.7
      b.position.set(Math.cos(a) * cfg.r, cfg.h + Math.sin(a * 2) * 1.4, -170 + Math.sin(a) * cfg.r * 0.5)
      b.rotation.z = Math.sin(rt.time * 7 + cfg.i) * 0.45
    }
  })

  return (
    <group ref={group}>
      {seeds.map((s) => (
        <mesh key={s.i} scale={[1.4, 0.22, 0.5]}>
          <sphereGeometry args={[0.5, 6, 4]} />
          <meshBasicMaterial color="#2a1c14" />
        </mesh>
      ))}
    </group>
  )
}

export function CanyonScenery({ stage }: { stage: StageConfig }) {
  const built = useMemo(() => {
    const rand = mulberry32(stage.seed)
    return {
      hoodoos: makeItems(rand, 20, FIELD_LENGTH, 11, 15, [0.8, 1.8], 3),
      scrub: makeItems(rand, 26, FIELD_LENGTH, 10.5, 14, [0.7, 1.5], 1),
      far: makeItems(rand, 12, FAR_LENGTH, 70, 200, [1, 2.2], 3).map((it) => ({
        ...it,
        z: -range(rand, 280, FAR_LENGTH),
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
        render={(it) => <FarMesa colors={rock} variant={it.variant} />}
      />
      <CanyonWalls stage={stage} />
      <ScrollField
        curve={curve}
        items={built.hoodoos}
        length={FIELD_LENGTH}
        render={(it) => <Hoodoo colors={rock} variant={it.variant} />}
      />
      <ScrollField
        curve={curve}
        items={built.scrub}
        length={FIELD_LENGTH}
        render={() => <Scrub color={stage.palette.accent[0]} />}
      />
      <Birds />
    </group>
  )
}
