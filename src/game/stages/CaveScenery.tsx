import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { hitObstacle } from '../actions'
import { CAMERA_Z, FIELD_LENGTH } from '../constants'
import { mulberry32, range, type Rand } from '../rng'
import { rt } from '../state'
import { ScrollField, type FieldItem } from '../ScrollField'
import { curveAt, DEFAULT_CURVE } from '../track'
import { makeItems, makeWallGeometry } from './sceneryUtils'
import type { StageConfig } from './types'

const FAR_LENGTH = 900
const CEILING_Y = 17
const WALL_COUNT = 26
const WALL_GAP = FIELD_LENGTH / WALL_COUNT

/** 절벽 겹 — 협곡과 같은 방식. 뒤로 갈수록 높고 어두워져 동굴을 완전히 감싼다. */
const WALL_LAYERS = [
  { off: 0, sy: 1, y: 0, color: '#6a6280' },
  { off: 4.2, sy: 1.4, y: 1.2, color: '#4d4660' },
  { off: 9, sy: 1.9, y: 3.2, color: '#363044' },
]

/** 동굴 벽 — 굽이치는 어두운 암벽이 양옆을 막는다 */
function CaveWalls({ stage }: { stage: StageConfig }) {
  const group = useRef<THREE.Group>(null!)
  const curve = stage.curve ?? DEFAULT_CURVE
  const { walls, variants } = useMemo(() => {
    const rand = mulberry32(stage.seed + 51)
    const variants = Array.from({ length: 6 }, () =>
      makeWallGeometry(WALL_GAP * 1.25, 11 + rand() * 7, rand),
    )
    const walls: { x: number; z: number; h: number; side: 1 | -1; v: number }[] = []
    for (let i = 0; i < WALL_COUNT; i++) {
      for (const side of [1, -1] as const) {
        walls.push({
          side,
          x: side * range(rand, 17, 21),
          z: -i * WALL_GAP - range(rand, 0, WALL_GAP * 0.3),
          h: range(rand, 0.9, 1.3),
          v: Math.floor(rand() * 6),
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
              geometry={variants[(w.v + li * 2) % 6]}
              position={[w.side * layer.off, layer.y, 0]}
              rotation={[0, (w.side > 0 ? -1 : 1) * (Math.PI / 2), 0]}
              scale={[1, w.h * layer.sy, 1]}
            >
              <meshStandardMaterial color={layer.color} roughness={1} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/** 석순 — 바닥에서 뭉툭하게 솟는다 */
function Stalagmite({ colors, variant }: { colors: string[]; variant: number }) {
  return (
    <group>
      <mesh position={[0, 1.6, 0]}>
        <coneGeometry args={[1.1, 3.4, 7, 2]} />
        <meshStandardMaterial color={colors[variant % colors.length]} roughness={1} flatShading />
      </mesh>
      <mesh position={[0.9, 0.8, 0.4]} scale={0.55}>
        <coneGeometry args={[1.1, 3.4, 6, 1]} />
        <meshStandardMaterial
          color={colors[(variant + 1) % colors.length]}
          roughness={1}
          flatShading
        />
      </mesh>
      <mesh position={[0, 0.25, 0]} scale={[1.7, 0.4, 1.7]}>
        <sphereGeometry args={[1.1, 8, 6]} />
        <meshStandardMaterial color={colors[2]} roughness={1} flatShading />
      </mesh>
    </group>
  )
}

/** 종유석 — 천장에 거꾸로 매달린다 */
function Stalactite({ colors, variant }: { colors: string[]; variant: number }) {
  return (
    <group>
      <mesh position={[0, -2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1.0, 4.4, 6, 2]} />
        <meshStandardMaterial color={colors[variant % colors.length]} roughness={1} flatShading />
      </mesh>
      <mesh position={[0.8, -1.2, 0.3]} rotation={[Math.PI, 0, 0.1]} scale={0.5}>
        <coneGeometry args={[1.0, 4, 5, 1]} />
        <meshStandardMaterial
          color={colors[(variant + 1) % colors.length]}
          roughness={1}
          flatShading
        />
      </mesh>
    </group>
  )
}

/** 바닥과 천장을 잇는 돌기둥 */
function CavePillar({ colors }: { colors: string[] }) {
  return (
    <group>
      <mesh position={[0, CEILING_Y / 4, 0]}>
        <coneGeometry args={[1.6, CEILING_Y / 2, 7, 2]} />
        <meshStandardMaterial color={colors[0]} roughness={1} flatShading />
      </mesh>
      <mesh position={[0, (CEILING_Y * 3) / 4, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1.6, CEILING_Y / 2, 7, 2]} />
        <meshStandardMaterial color={colors[1]} roughness={1} flatShading />
      </mesh>
    </group>
  )
}

/** 빛나는 수정 다발 */
function GlowCrystals({ color }: { color: string }) {
  const shards = [
    { x: 0, tilt: 0, h: 2.6, r: 0.5 },
    { x: 0.7, tilt: -0.45, h: 1.8, r: 0.36 },
    { x: -0.6, tilt: 0.5, h: 1.5, r: 0.3 },
    { x: 0.2, tilt: 0.2, h: 1.1, r: 0.24 },
  ]
  return (
    <group>
      {shards.map((c, i) => (
        <mesh key={i} position={[c.x, c.h / 2, 0]} rotation={[0, i, c.tilt]}>
          <coneGeometry args={[c.r, c.h, 5, 1]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.1}
            roughness={0.25}
            transparent
            opacity={0.9}
            flatShading
          />
        </mesh>
      ))}
      {/* 바닥에 번지는 빛 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <circleGeometry args={[1.8, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.28}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

/** 빛나는 버섯 무리 */
function GlowMushrooms({ cap }: { cap: string }) {
  const shrooms = [
    { x: 0, s: 1 },
    { x: 0.65, s: 0.7 },
    { x: -0.55, s: 0.55 },
  ]
  return (
    <group>
      {shrooms.map((m, i) => (
        <group key={i} position={[m.x, 0, i * 0.2 - 0.2]} scale={m.s}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.16, 0.24, 1, 7]} />
            <meshStandardMaterial color="#cfc8b8" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.05, 0]} scale={[1, 0.62, 1]}>
            <sphereGeometry args={[0.55, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial
              color={cap}
              emissive={cap}
              emissiveIntensity={0.9}
              roughness={0.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** 길가의 빛나는 지하 웅덩이 */
function GlowPool({ color }: { color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <circleGeometry args={[1.7, 18]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

/** 박쥐 — 파닥이는 날개 */
function Bat() {
  return (
    <group>
      <mesh scale={[0.3, 0.2, 0.24]}>
        <sphereGeometry args={[0.5, 6, 5]} />
        <meshBasicMaterial color="#14101a" />
      </mesh>
      <mesh position={[0.26, 0.06, 0]} rotation={[0, 0, 0.4]} scale={[0.55, 0.05, 0.3]}>
        <sphereGeometry args={[0.5, 6, 5]} />
        <meshBasicMaterial color="#14101a" />
      </mesh>
      <mesh position={[-0.26, 0.06, 0]} rotation={[0, 0, -0.4]} scale={[0.55, 0.05, 0.3]}>
        <sphereGeometry args={[0.5, 6, 5]} />
        <meshBasicMaterial color="#14101a" />
      </mesh>
    </group>
  )
}

const CHARGE_COUNT = 12

/**
 * 돌진하는 박쥐 떼. 이따금 저 멀리서 한 무리가 이쪽으로 쏟아져 나와
 * 가까워질수록 부채꼴로 흩어지며 비행기를 스쳐 지나간다.
 * 놀래키기용 연출일 뿐 부딪혀도 생명은 떨어지지 않는다.
 */
function ChargingBats({ stage, initialDelay }: { stage: StageConfig; initialDelay: number }) {
  const group = useRef<THREE.Group>(null!)
  const curve = stage.curve ?? DEFAULT_CURVE
  const state = useRef({ mode: 0 as 0 | 1, timer: initialDelay, z: -240 })

  const bats = useMemo(() => {
    const rand = mulberry32(stage.seed + 123 + Math.floor(initialDelay * 7))
    return Array.from({ length: CHARGE_COUNT }, (_, i) => ({
      i,
      ox: range(rand, -2.6, 2.6),
      oy: range(rand, 1.2, 5.2),
      dz: -range(rand, 0, 9),
      vy: range(rand, -2.2, 2.6),
      phase: rand() * Math.PI * 2,
    }))
  }, [stage, initialDelay])

  useFrame((_, delta) => {
    if (!rt.running) return
    const dt = Math.min(delta, 0.05)
    const st = state.current

    if (st.mode === 0) {
      group.current.visible = false
      st.timer -= dt
      if (st.timer <= 0) {
        st.mode = 1
        st.z = -240
        group.current.visible = true
      }
      return
    }

    // 월드 스크롤에 자체 속력을 더해 빠르게 다가온다
    st.z += (rt.speed + 34) * dt
    const t = Math.min(1, Math.max(0, (st.z + 240) / 240))
    const kids = group.current.children

    for (let i = 0; i < kids.length; i++) {
      const b = kids[i]
      const cfg = bats[i]
      const z = st.z + cfg.dz
      // 셋 중 하나는 흩어지지 않고 카메라 정면으로 파고든다
      const daring = cfg.i % 3 === 0
      const spread = daring ? 0.55 + t * 0.6 : 1 + t * t * 3.4
      const y = daring
        ? cfg.oy + (rt.y + 1.1 - cfg.oy) * t * t + Math.sin(rt.time * 5 + cfg.phase) * 0.3
        : cfg.oy + t * t * cfg.vy + Math.sin(rt.time * 5 + cfg.phase) * 0.35
      b.position.set(
        curveAt(rt.distance, z, curve) + cfg.ox * spread + Math.sin(rt.time * 3.2 + cfg.phase) * 0.4,
        y,
        z,
      )
      // 다가올수록 몸집이 커져 시각적으로 확 들이닥친다
      b.scale.setScalar(1.25 * (1 + t * 1.9))
      b.rotation.z = Math.sin(rt.time * 13 + cfg.phase) * 0.7
      b.rotation.x = 0.2
    }

    if (st.z > 26) {
      st.mode = 0
      st.timer = 8 + ((rt.time * 7919) % 9) // 다음 돌진까지 8~17초
      group.current.visible = false
    }
  })

  return (
    <group ref={group} visible={false}>
      {bats.map((b) => (
        <group key={b.i} scale={1.25}>
          <Bat />
        </group>
      ))}
    </group>
  )
}

/** 박쥐 떼 — 천장 근처를 불규칙하게 맴돈다 */
function BatSwarm({ phase, radius, height, speed }: { phase: number; radius: number; height: number; speed: number }) {
  const group = useRef<THREE.Group>(null!)

  useFrame(() => {
    const a = rt.time * speed + phase
    for (let i = 0; i < group.current.children.length; i++) {
      const b = group.current.children[i]
      const oa = a - i * 0.35
      b.position.set(
        Math.cos(oa + Math.sin(rt.time * 0.7 + i) * 0.4) * radius,
        height + Math.sin(rt.time * 2.2 + i * 1.7) * 1.4,
        -150 + Math.sin(oa) * radius * 0.5,
      )
      b.rotation.y = -oa + Math.PI / 2
      b.rotation.z = Math.sin(rt.time * 11 + i * 2.1) * 0.65
    }
  })

  return (
    <group ref={group}>
      {Array.from({ length: 8 }, (_, i) => (
        <Bat key={i} />
      ))}
    </group>
  )
}

const FALLER_COUNT = 9

/**
 * 떨어지는 종유석. 비행기가 가까워지면 잠깐 부르르 떨다가(경고) 낙하한다.
 * 떨어지는 중에 맞으면 피격, 바닥에 박히면 먼지 링이 퍼진다.
 */
function FallingStalactites({ stage }: { stage: StageConfig }) {
  const group = useRef<THREE.Group>(null!)
  const curve = stage.curve ?? DEFAULT_CURVE

  const items = useMemo(() => {
    const rand = mulberry32(stage.seed + 99)
    return Array.from({ length: FALLER_COUNT }, (_, id) => ({
      id,
      x: range(rand, -6, 6),
      z: -range(rand, 40, FIELD_LENGTH),
      scale: range(rand, 1.0, 1.7),
      /** 이만큼 앞까지 왔을 때 떨어지기 시작한다 */
      trigger: range(rand, 30, 58),
    }))
  }, [stage])

  // 0 매달림 · 1 경고(떨림) · 2 낙하 · 3 바닥에 박힘
  const states = useRef(items.map(() => ({ mode: 0, vy: 0, timer: 0 })))

  useFrame((_, delta) => {
    if (!rt.running) return
    const dt = Math.min(delta, 0.05)
    const d = rt.speed * dt
    const kids = group.current.children

    for (let i = 0; i < kids.length; i++) {
      const g = kids[i]
      const it = items[i]
      const st = states.current[i]
      const body = g.children[0]
      const ring = g.children[1] as THREE.Mesh

      g.position.z += d
      if (g.position.z > CAMERA_Z + 14) {
        g.position.z -= FIELD_LENGTH
        st.mode = 0
        st.vy = 0
        st.timer = 0
        g.position.y = CEILING_Y
        body.position.x = 0
        ring.visible = false
      }
      g.position.x = it.x + curveAt(rt.distance, g.position.z, curve)

      if (st.mode === 0) {
        if (g.position.z > -it.trigger && g.position.z < -6) {
          st.mode = 1
          st.timer = 0.55
        }
      } else if (st.mode === 1) {
        st.timer -= dt
        body.position.x = Math.sin(rt.time * 58) * 0.1
        if (st.timer <= 0) {
          st.mode = 2
          body.position.x = 0
        }
      } else if (st.mode === 2) {
        st.vy += 55 * dt
        g.position.y -= st.vy * dt

        // 낙하 중 충돌 — 원뿔 중심 부근을 기준으로 판정
        if (Math.abs(g.position.z) < 1.7 && rt.invuln <= 0) {
          const dx = Math.abs(g.position.x - rt.x)
          const cy = g.position.y - 1.7 * it.scale
          if (dx < 0.85 * it.scale + 0.7 && Math.abs(cy - rt.y) < 1.7 * it.scale + 0.5) {
            hitObstacle()
          }
        }

        // 끝이 바닥에 닿으면 박힌다
        if (g.position.y <= 3.4 * it.scale) {
          g.position.y = 3.4 * it.scale
          st.mode = 3
          st.timer = 0
          ring.visible = true
        }
      } else {
        st.timer += dt
        const k = Math.min(st.timer, 0.9)
        ring.scale.setScalar(0.3 + k * 3.2)
        ;(ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.5 - k * 0.6)
      }
    }
  })

  return (
    <group ref={group}>
      {items.map((it) => (
        <group key={it.id} position={[it.x, CEILING_Y, it.z]} scale={it.scale}>
          <group>
            <mesh position={[0, -1.7, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.85, 3.4, 6, 2]} />
              <meshStandardMaterial
                color={stage.palette.rock[3]}
                emissive="#5cf2e8"
                emissiveIntensity={0.14}
                roughness={1}
                flatShading
              />
            </mesh>
            <mesh position={[0.55, -1.0, 0.2]} rotation={[Math.PI, 0, 0.1]} scale={0.45}>
              <coneGeometry args={[0.85, 3, 5, 1]} />
              <meshStandardMaterial color={stage.palette.rock[1]} roughness={1} flatShading />
            </mesh>
          </group>
          {/* 착지 먼지 링 */}
          <mesh
            visible={false}
            position={[0, -3.35, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.6, 1.05, 20, 1]} />
            <meshBasicMaterial
              color="#9aa4b8"
              transparent
              opacity={0.5}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** 길 위까지 덮는 천장 종유석 밭 */
function buildCeiling(rand: Rand): FieldItem[] {
  return Array.from({ length: 46 }, (_, id) => ({
    id,
    x: range(rand, -1, 1) * 34,
    y: CEILING_Y + range(rand, -1.5, 2.5),
    z: -range(rand, 10, FIELD_LENGTH),
    scale: range(rand, 0.8, 2.4),
    rot: rand() * Math.PI * 2,
    variant: Math.floor(rand() * 3),
  }))
}

export function CaveScenery({ stage }: { stage: StageConfig }) {
  const built = useMemo(() => {
    const rand = mulberry32(stage.seed)
    return {
      stalagmites: makeItems(rand, 30, FIELD_LENGTH, 11, 40, [0.9, 2.4], 3),
      pillars: makeItems(rand, 10, FIELD_LENGTH, 16, 34, [0.9, 1.6], 1),
      crystals: makeItems(rand, 20, FIELD_LENGTH, 10.5, 30, [0.8, 1.8], 3),
      mushrooms: makeItems(rand, 24, FIELD_LENGTH, 10.5, 26, [0.8, 1.8], 2),
      pools: makeItems(rand, 12, FIELD_LENGTH, 11, 24, [0.8, 1.6], 1),
      ceiling: buildCeiling(rand),
      farWalls: makeItems(rand, 16, FAR_LENGTH, 45, 130, [2.2, 4.5], 3).map((it) => ({
        ...it,
        z: -range(rand, 200, FAR_LENGTH),
      })),
    }
  }, [stage])

  const curve = stage.curve ?? DEFAULT_CURVE
  const rock = stage.palette.rock
  const accent = stage.palette.accent

  return (
    <group>
      <ScrollField
        items={built.farWalls}
        length={FAR_LENGTH}
        speedScale={0.2}
        render={(it) => <Stalagmite colors={rock} variant={it.variant} />}
      />
      <CaveWalls stage={stage} />
      <ScrollField
        curve={curve}
        items={built.stalagmites}
        length={FIELD_LENGTH}
        render={(it) => <Stalagmite colors={rock} variant={it.variant} />}
      />
      <ScrollField
        curve={curve}
        items={built.pillars}
        length={FIELD_LENGTH}
        render={() => <CavePillar colors={rock} />}
      />
      <ScrollField
        curve={curve}
        items={built.ceiling}
        length={FIELD_LENGTH}
        render={(it) => <Stalactite colors={rock} variant={it.variant} />}
      />
      <ScrollField
        curve={curve}
        items={built.crystals}
        length={FIELD_LENGTH}
        render={(it) => <GlowCrystals color={accent[it.variant % accent.length]} />}
      />
      <ScrollField
        curve={curve}
        items={built.mushrooms}
        length={FIELD_LENGTH}
        render={(it) => <GlowMushrooms cap={accent[(it.variant + 1) % accent.length]} />}
      />
      <ScrollField
        curve={curve}
        items={built.pools}
        length={FIELD_LENGTH}
        render={() => <GlowPool color={stage.ground.roadGlow} />}
      />

      <FallingStalactites stage={stage} />
      <ChargingBats stage={stage} initialDelay={4} />
      <ChargingBats stage={stage} initialDelay={13} />
      <BatSwarm phase={0} radius={22} height={11} speed={0.5} />
      <BatSwarm phase={3.4} radius={34} height={13.5} speed={0.34} />
    </group>
  )
}
