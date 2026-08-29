import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Minimi } from './Minimi'
import { PaperPlane } from './PaperPlane'
import { rt } from './state'
import { makeGlowTexture } from './textures'
import type { StageConfig } from './stages/types'

const TRAIL_COUNT = 14
const SPARK_COUNT = 10
/** 평소(Z) 부스터 불꽃 색 (안쪽 → 바깥) */
const FLAME_COLORS = ['#ffffff', '#ffd98a', '#ff8a3d'] as const
const SHOCK_COUNT = 3

/**
 * 소닉붐. 무적 부스터가 최고속에 가까워지면 기체 앞으로
 * 원뿔형 충격파가 연달아 터져 나와 뒤로 흘러간다.
 */
function SonicBoom() {
  const group = useRef<THREE.Group>(null!)

  useFrame(() => {
    const on = rt.power > 0 && rt.boost > 0.5
    group.current.visible = on
    if (!on) return
    for (let i = 0; i < group.current.children.length; i++) {
      const m = group.current.children[i] as THREE.Mesh
      // 0 → 1 로 부풀며 뒤로 밀려난다
      const life = ((rt.time * 1.6 + i / SHOCK_COUNT) % 1)
      const s = 0.35 + life * 2.6
      m.scale.set(s, s, 1)
      m.position.z = -0.4 + life * 4.2
      ;(m.material as THREE.MeshBasicMaterial).opacity = (1 - life) * 0.5
    }
  })

  return (
    <group ref={group} visible={false}>
      {Array.from({ length: SHOCK_COUNT }, (_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.9, 0.06, 6, 28]} />
          <meshBasicMaterial
            color="#dff2ff"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

/** 무적 부스터의 속도선 — 화면 양옆으로 흐르는 흰 줄기 */
function SpeedLines() {
  const group = useRef<THREE.Group>(null!)
  const seeds = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        i,
        a: (i / 12) * Math.PI * 2,
        r: 1.6 + (i % 3) * 0.5,
        off: (i / 12) * 1.2,
      })),
    [],
  )

  useFrame(() => {
    const on = rt.power > 0 && rt.boost > 0.4
    group.current.visible = on
    if (!on) return
    for (let i = 0; i < group.current.children.length; i++) {
      const m = group.current.children[i] as THREE.Mesh
      const seed = seeds[i]
      const life = (rt.time * 2.6 + seed.off) % 1
      m.position.set(Math.cos(seed.a) * seed.r, Math.sin(seed.a) * seed.r, -3 + life * 8)
      m.scale.set(1, 1, 1.4 + life * 2.2)
      ;(m.material as THREE.MeshBasicMaterial).opacity = Math.sin(life * Math.PI) * 0.5
    }
  })

  return (
    <group ref={group} visible={false}>
      {seeds.map((sp) => (
        <mesh key={sp.i} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1, 4]} />
          <meshBasicMaterial
            color="#eaf6ff"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * 엔진 불꽃. 부스터 강도(rt.boost)와 직선 가속(rt.straight)에 따라
 * 흰 코어 → 노랑 → 주황 세 겹의 화염이 뒤로 길어지고, 불티가 튄다.
 */
function EngineFlame({ tint }: { tint: string }) {
  // 무적 부스터일 때 갈아 끼울 푸른 불꽃 색
  const POWER_COLORS = ['#ffffff', '#4fb0ff', '#0f3fd8'] as const
  const flame = useRef<THREE.Group>(null!)
  const sparks = useRef<THREE.Group>(null!)
  const glow = useMemo(() => makeGlowTexture(), [])
  const seeds = useMemo(
    () =>
      Array.from({ length: SPARK_COUNT }, (_, i) => ({
        i,
        off: (i / SPARK_COUNT) * 1.6,
        sx: Math.sin(i * 2.7) * 0.16,
        sy: Math.cos(i * 1.9) * 0.14,
      })),
    [],
  )

  useFrame(() => {
    // 부스터를 밟으면 타오른다. 무적 중에는 훨씬 크고 푸른 불꽃이 된다.
    const powered = rt.power > 0
    const heat = Math.min(1, rt.boost * (powered ? 1.15 : 0.95))
    // 무적일 때는 더 빠르게 요동친다
    const fspd = powered ? 1.8 : 1
    const flicker =
      0.82 + Math.sin(rt.time * 47 * fspd) * 0.1 + Math.sin(rt.time * 23 * fspd) * 0.08
    const scale = powered ? 2.1 : 1

    const g = flame.current
    g.visible = heat > 0.02
    g.scale.set(
      (0.5 + heat * 0.3) * (powered ? 2.4 : 1),
      (0.5 + heat * 0.3) * (powered ? 2.4 : 1),
      (0.8 + heat * 3.6) * flicker * scale,
    )
    for (let i = 0; i < g.children.length; i++) {
      const m = (g.children[i] as THREE.Mesh).material as THREE.MeshBasicMaterial
      m.opacity = heat * flicker * (powered ? 0.6 : 0.7)
      m.color.set(powered ? POWER_COLORS[i] : FLAME_COLORS[i])
    }

    // 불티 — 뒤로 튀어 나가며 사라진다
    const s = sparks.current
    s.visible = heat > 0.15
    for (let i = 0; i < s.children.length; i++) {
      const p = s.children[i] as THREE.Mesh
      const seed = seeds[i]
      const life = ((rt.time * (2.2 + heat * 3) + seed.off) % 1.6) / 1.6
      ;(p.material as THREE.MeshBasicMaterial).color.set(
        seed.i % 3 === 0 ? '#ffffff' : powered ? '#4fb0ff' : tint,
      )
      p.position.set(seed.sx * (1 + life * 3), seed.sy * (1 + life * 3), 0.5 + life * (1.4 + heat * 2))
      const sc = (1 - life) * 0.16 * (0.5 + heat)
      p.scale.setScalar(Math.max(sc, 0.001))
      ;(p.material as THREE.MeshBasicMaterial).opacity = (1 - life) * heat
    }
  })

  return (
    <group>
      {/* 화염 — 안쪽이 희고 바깥이 주황인 원뿔 세 겹 */}
      <group ref={flame} position={[0, 0, 0.78]}>
        {[
          { r: 0.09, len: 1.2 },
          { r: 0.15, len: 0.9 },
          { r: 0.21, len: 0.62 },
        ].map((f, i) => (
          <mesh key={i} position={[0, 0, f.len / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[f.r, f.len, 8, 1, true]} />
            <meshBasicMaterial
              color={FLAME_COLORS[i]}
              transparent
              opacity={0}
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
      {/* 불티 */}
      <group ref={sparks}>
        {seeds.map((sp) => (
          <mesh key={sp.i}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial
              map={glow}
              color={sp.i % 3 === 0 ? '#ffffff' : tint}
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function Player({ stage }: { stage: StageConfig }) {
  const root = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const trail = useRef<THREE.Group>(null!)
  const shadow = useRef<THREE.Mesh>(null!)
  const shield = useRef<THREE.Mesh>(null!)
  const glow = useMemo(() => makeGlowTexture(), [])
  const shadowTex = useMemo(
    () => makeGlowTexture('rgba(60,30,10,0.55)', 'rgba(60,30,10,0)'),
    [],
  )

  const seeds = useMemo(
    () => Array.from({ length: TRAIL_COUNT }, (_, i) => ({ i, off: (i / TRAIL_COUNT) * 3.4 })),
    [],
  )

  useFrame(() => {
    const g = root.current
    g.position.x = rt.x
    g.position.y = rt.y
    g.rotation.z = rt.roll
    g.rotation.x = rt.pitch
    g.rotation.y = -rt.roll * 0.45

    // 위아래 부유감
    body.current.position.y = Math.sin(rt.time * 2.6) * 0.07
    body.current.rotation.x = Math.sin(rt.time * 1.9) * 0.04

    // 피격 무적 중에는 깜빡인다
    body.current.visible = rt.invuln <= 0 || Math.floor(rt.time * 18) % 2 === 0

    // 반짝이 스타 무적 — 기체를 무지개 오라가 감싼다
    const aura = shield.current
    aura.visible = rt.power > 0
    if (aura.visible) {
      const m = aura.material as THREE.MeshBasicMaterial
      m.color.setHSL((rt.time * 0.5) % 1, 0.9, 0.62)
      m.opacity = 0.12 + Math.sin(rt.time * 9) * 0.04
      const s = 1 + Math.sin(rt.time * 5) * 0.05
      aura.scale.setScalar(s)
      aura.rotation.y = rt.time * 1.2
    }

    // 꼬리 반짝임 — 뒤로 흘러가며 작아진다
    const speedK = rt.speed / 40
    for (let i = 0; i < trail.current.children.length; i++) {
      const s = trail.current.children[i] as THREE.Mesh
      const seed = seeds[i]
      const life = ((rt.time * (1.6 + speedK * 0.5) + seed.off) % 3.4) / 3.4
      s.position.z = 1.2 + life * 6.2
      s.position.x = Math.sin(seed.off * 5.1 + rt.time * 3) * (0.12 + life * 0.55)
      s.position.y = -0.05 + Math.cos(seed.off * 3.7 + rt.time * 2.4) * (0.08 + life * 0.4)
      const sc = (1 - life) * (0.55 + (seed.i % 3) * 0.12)
      s.scale.setScalar(Math.max(sc, 0.001))
      ;(s.material as THREE.MeshBasicMaterial).opacity = (1 - life) * 0.85
    }

    // 바닥 그림자 — 고도가 높을수록 흐려지고 커진다. 지면이 아득히 아래면 끈다.
    shadow.current.visible = (stage.groundY ?? 0) > -5
    const h = Math.max(rt.y, 0.4)
    shadow.current.position.set(rt.x * 0.98, 0.03, 0.4)
    const sc = (1.1 + h * 0.42) * 0.6
    shadow.current.scale.set(sc, sc * 1.7, 1)
    ;(shadow.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0.04, 0.26 - h * 0.028)
  })

  return (
    <>
      <group ref={root}>
        <group ref={body}>
          <group scale={0.64}>
            <PaperPlane />
          </group>
          <Minimi cloth={stage.ground.roadGlow} />
          <EngineFlame tint="#ff8a3d" />
          <SonicBoom />
          <SpeedLines />
        </group>
        <mesh ref={shield} visible={false}>
          <sphereGeometry args={[0.72, 16, 12]} />
          <meshBasicMaterial
            transparent
            opacity={0.12}
            depthWrite={false}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <group ref={trail} scale={0.7}>
          {seeds.map((s) => (
            <mesh key={s.i} scale={0.3}>
              <planeGeometry args={[0.55, 0.55]} />
              <meshBasicMaterial
                map={glow}
                color={s.i % 3 === 0 ? stage.palette.crystal : '#ffffff'}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </group>
      </group>

      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} opacity={0.35} />
      </mesh>
    </>
  )
}
