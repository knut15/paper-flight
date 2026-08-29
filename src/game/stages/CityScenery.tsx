import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FIELD_LENGTH } from '../constants'
import { mulberry32, range } from '../rng'
import { rt } from '../state'
import { ScrollField, type FieldItem } from '../ScrollField'
import { DEFAULT_CURVE } from '../track'
import { makeWindowsTexture } from '../textures'
import { makeItems } from './sceneryUtils'
import type { StageConfig } from './types'

const FAR_LENGTH = 900

type TowerItem = FieldItem & { h: number; w: number; d: number }

/** 옥상 항공 장애등 — 빨갛게 깜빡인다 */
function WarnLight({ phase }: { phase: number }) {
  const mesh = useRef<THREE.Mesh>(null!)
  useFrame(() => {
    const on = Math.sin(rt.time * 2.6 + phase) > 0.2
    ;(mesh.current.material as THREE.MeshBasicMaterial).opacity = on ? 1 : 0.08
  })
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.28, 8, 6]} />
      <meshBasicMaterial color="#ff3b30" transparent opacity={1} />
    </mesh>
  )
}

/** 빌딩 — 형태 5종(박스·계단형·슬림 스파이어·원통·트윈), 외벽 색은 텍스처가 정한다 */
function Tower({ tex, it }: { tex: THREE.Texture; it: TowerItem }) {
  const shape = it.variant % 5
  const body = (
    <>
      {shape === 0 && (
        <mesh position={[0, it.h / 2, 0]}>
          <boxGeometry args={[it.w, it.h, it.d]} />
          <meshStandardMaterial map={tex} roughness={0.75} />
        </mesh>
      )}
      {shape === 1 && (
        // 계단형 셋백 — 위로 갈수록 좁아진다
        <>
          <mesh position={[0, it.h * 0.25, 0]}>
            <boxGeometry args={[it.w, it.h * 0.5, it.d]} />
            <meshStandardMaterial map={tex} roughness={0.75} />
          </mesh>
          <mesh position={[0, it.h * 0.65, 0]}>
            <boxGeometry args={[it.w * 0.74, it.h * 0.3, it.d * 0.74]} />
            <meshStandardMaterial map={tex} roughness={0.75} />
          </mesh>
          <mesh position={[0, it.h * 0.9, 0]}>
            <boxGeometry args={[it.w * 0.5, it.h * 0.2, it.d * 0.5]} />
            <meshStandardMaterial map={tex} roughness={0.75} />
          </mesh>
        </>
      )}
      {shape === 2 && (
        // 슬림 타워 + 스파이어
        <>
          <mesh position={[0, it.h / 2, 0]}>
            <boxGeometry args={[it.w * 0.62, it.h, it.d * 0.62]} />
            <meshStandardMaterial map={tex} roughness={0.75} />
          </mesh>
          <mesh position={[0, it.h + 2.4, 0]}>
            <coneGeometry args={[it.w * 0.14, 5, 4]} />
            <meshStandardMaterial color="#c9cfd8" roughness={0.6} />
          </mesh>
        </>
      )}
      {shape === 3 && (
        // 원통 타워
        <>
          <mesh position={[0, it.h / 2, 0]}>
            <cylinderGeometry args={[it.w * 0.55, it.w * 0.55, it.h, 12]} />
            <meshStandardMaterial map={tex} roughness={0.75} />
          </mesh>
          <mesh position={[0, it.h + 0.4, 0]}>
            <cylinderGeometry args={[it.w * 0.42, it.w * 0.5, 0.8, 12]} />
            <meshStandardMaterial color="#9aa1ac" roughness={0.9} />
          </mesh>
        </>
      )}
      {shape === 4 && (
        // 트윈 타워 + 연결 브리지
        <>
          {[-1, 1].map((sx) => (
            <mesh key={sx} position={[sx * it.w * 0.32, it.h / 2, 0]}>
              <boxGeometry args={[it.w * 0.44, it.h, it.d * 0.7]} />
              <meshStandardMaterial map={tex} roughness={0.75} />
            </mesh>
          ))}
          <mesh position={[0, it.h * 0.72, 0]}>
            <boxGeometry args={[it.w * 0.7, it.h * 0.07, it.d * 0.4]} />
            <meshStandardMaterial color="#c9cfd8" roughness={0.7} />
          </mesh>
        </>
      )}
    </>
  )

  return (
    <group>
      {body}
      {(shape === 0 || shape === 1) && (
        <mesh position={[0, it.h + 0.3, 0]}>
          <boxGeometry args={[it.w * (shape === 1 ? 0.42 : 0.85), 0.6, it.d * (shape === 1 ? 0.42 : 0.85)]} />
          <meshStandardMaterial color="#9aa1ac" roughness={0.95} />
        </mesh>
      )}
      {it.h > 55 && (
        <group position={[0, it.h + (shape === 2 ? 4.6 : 0.6), 0]}>
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.1, 0.18, 4, 6]} />
            <meshStandardMaterial color="#7f8894" roughness={0.7} />
          </mesh>
          <group position={[0, 4.3, 0]}>
            <WarnLight phase={it.h * 1.7} />
          </group>
        </group>
      )}
    </group>
  )
}

/** 주택 — 박공지붕과 굴뚝이 있는 작은 집 */
function House({ body, roof }: { body: string; roof: string }) {
  return (
    <group>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2.6, 2, 2.2]} />
        <meshStandardMaterial color={body} roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.6, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.05, 1.4, 4, 1]} />
        <meshStandardMaterial color={roof} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.7, 3, 0.4]}>
        <boxGeometry args={[0.32, 0.9, 0.32]} />
        <meshStandardMaterial color="#8a6a5a" roughness={0.9} />
      </mesh>
    </group>
  )
}

/** 랜드마크 — 붉고 흰 띠의 전파탑 */
function RadioTower() {
  return (
    <group>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 4.2, 7, Math.sin(a) * 4.2]}
            rotation={[Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25]}
          >
            <cylinderGeometry args={[0.3, 0.5, 15, 6]} />
            <meshStandardMaterial color="#d94f3f" roughness={0.7} />
          </mesh>
        )
      })}
      {[
        { y: 17, r0: 3.4, r1: 5.2, c: '#d94f3f' },
        { y: 25, r0: 2.2, r1: 3.4, c: '#e8e4dc' },
        { y: 33, r0: 1.2, r1: 2.2, c: '#d94f3f' },
      ].map((t) => (
        <mesh key={t.y} position={[0, t.y, 0]}>
          <cylinderGeometry args={[t.r0, t.r1, 8, 8]} />
          <meshStandardMaterial color={t.c} roughness={0.75} />
        </mesh>
      ))}
      {/* 전망대와 안테나 */}
      <mesh position={[0, 38.5, 0]}>
        <cylinderGeometry args={[2.6, 2.6, 3, 10]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.6} />
      </mesh>
      <mesh position={[0, 44, 0]}>
        <cylinderGeometry args={[0.16, 0.3, 8, 6]} />
        <meshStandardMaterial color="#d94f3f" roughness={0.7} />
      </mesh>
      <group position={[0, 48.4, 0]}>
        <WarnLight phase={2.4} />
      </group>
    </group>
  )
}

/** 랜드마크 — 천천히 도는 대관람차 */
function FerrisWheel() {
  const wheel = useRef<THREE.Group>(null!)
  const cabinColors = ['#ff5c8a', '#5cd8ff', '#ffd166', '#7fd87f', '#b07aff', '#ff8a5c']

  useFrame(() => {
    wheel.current.rotation.z = rt.time * 0.12
    // 곤돌라는 항상 아래를 향한다
    for (const cabin of wheel.current.children) {
      cabin.rotation.z = -wheel.current.rotation.z
    }
  })

  return (
    <group>
      {/* 지지대 */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 3.4, 5.5, 0]} rotation={[0, 0, sx * 0.32]}>
          <boxGeometry args={[1, 12, 1]} />
          <meshStandardMaterial color="#8a919c" roughness={0.8} />
        </mesh>
      ))}
      {/* 바퀴 */}
      <mesh position={[0, 11, 0]}>
        <torusGeometry args={[8.5, 0.35, 8, 28]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.6} />
      </mesh>
      <mesh position={[0, 11, 0]}>
        <torusGeometry args={[5.5, 0.22, 8, 24]} />
        <meshStandardMaterial color="#d94f3f" roughness={0.6} />
      </mesh>
      <group ref={wheel} position={[0, 11, 0]}>
        {cabinColors.map((c, i) => {
          const a = (i / cabinColors.length) * Math.PI * 2
          return (
            <group key={i} position={[Math.cos(a) * 8.5, Math.sin(a) * 8.5, 0]}>
              <mesh position={[0, -1, 0]}>
                <boxGeometry args={[1.3, 1.4, 1.2]} />
                <meshStandardMaterial color={c} roughness={0.6} />
              </mesh>
            </group>
          )
        })}
      </group>
    </group>
  )
}

/** 랜드마크 — 돔 경기장 */
function DomeStadium() {
  return (
    <group>
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[9, 10, 4.4, 18]} />
        <meshStandardMaterial color="#b8bec8" roughness={0.85} />
      </mesh>
      <mesh position={[0, 4.4, 0]} scale={[1, 0.5, 1]}>
        <sphereGeometry args={[9, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#e8ecf0" roughness={0.6} />
      </mesh>
      {/* 조명탑 */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 10.5, 4.5, Math.sin(a) * 10.5]}>
            <cylinderGeometry args={[0.22, 0.3, 9, 6]} />
            <meshStandardMaterial color="#8a919c" roughness={0.8} />
          </mesh>
        )
      })}
    </group>
  )
}

/** 지평선을 채우는 원경 빌딩 군집 — 한 아이템이 블록 하나를 이룬다 */
function SkylineCluster({ tex, variant }: { tex: THREE.Texture; variant: number }) {
  const blocks = [
    { x: 0, w: 7, h: 26 + (variant % 3) * 9 },
    { x: 7.5, w: 6, h: 17 + ((variant + 1) % 3) * 8 },
    { x: -7, w: 5.5, h: 21 + ((variant + 2) % 4) * 6 },
    { x: 13.5, w: 5, h: 12 + (variant % 4) * 5 },
    { x: -13, w: 6.5, h: 15 + ((variant + 1) % 4) * 7 },
  ]
  return (
    <group>
      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, (i % 3) * 4 - 4]}>
          <boxGeometry args={[b.w, b.h, 6]} />
          <meshStandardMaterial map={tex} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

/** 한낮의 뭉게구름 */
function Cloud() {
  const lobes = [
    { x: 0, y: 0.3, s: 1 },
    { x: 0.9, y: 0.1, s: 0.7 },
    { x: -0.8, y: 0.08, s: 0.62 },
    { x: 0.25, y: 0.55, s: 0.55 },
  ]
  return (
    <group>
      {lobes.map((l, i) => (
        <mesh key={i} position={[l.x, l.y, 0]} scale={[l.s, l.s * 0.66, l.s]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.06}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  )
}

export function CityScenery({ stage }: { stage: StageConfig }) {
  const gy = stage.groundY ?? 0

  const windowTextures = useMemo(() => {
    const facades = ['#b8bec8', '#9aa4b0', '#a86a52', '#c9b896', '#3a4a66', '#4d7a80']
    return facades.map((c, i) => makeWindowsTexture(c, stage.seed + 1 + i, true))
  }, [stage])

  const built = useMemo(() => {
    const rand = mulberry32(stage.seed)
    const dim = () => 4.2 + Math.floor(rand() * 3) * 1.9
    const tower = (it: FieldItem, h: number): TowerItem => ({
      ...it,
      rot: 0,
      scale: 1,
      y: gy,
      h,
      w: dim(),
      d: dim(),
    })
    return {
      // 시가지 — 코스 바로 아래까지 온 도시가 깔린다
      sprawl: Array.from({ length: 46 }, (_, id) =>
        tower(
          {
            id,
            x: range(rand, -1, 1) * 62,
            y: gy,
            z: -range(rand, 10, FIELD_LENGTH),
            scale: 1,
            rot: 0,
            variant: Math.floor(rand() * 6),
          },
          range(rand, 12, 26),
        ),
      ),
      // 중층 타워 — 지붕이 비행 고도 가까이 온다
      // 이 타워들 사이를 누빈다 — 지붕이 비행 고도 위(3/4 지점 통과)로 솟는다
      mids: makeItems(rand, 22, FIELD_LENGTH, 10, 46, [1, 1], 6).map((it) =>
        tower(it, range(rand, 42, 58)),
      ),
      // 랜드마크 — 비행기 옆을 스치듯 지나는 초고층
      landmarks: makeItems(rand, 4, FIELD_LENGTH, 10, 20, [1, 1], 6).map((it, i) =>
        tower({ ...it, z: -(i + 0.5) * (FIELD_LENGTH / 4) }, range(rand, 58, 68)),
      ),
      houses: Array.from({ length: 60 }, (_, id) => ({
        id,
        x: range(rand, -1, 1) * 64,
        y: gy,
        z: -range(rand, 10, FIELD_LENGTH),
        scale: range(rand, 0.9, 1.5),
        rot: rand() * Math.PI * 2,
        variant: Math.floor(rand() * 5),
      })),
      // 랜드마크는 가끔 하나씩 — 한 바퀴(약 340m)에 2기만, 종류는 무작위
      specials: makeItems(rand, 2, FIELD_LENGTH, 26, 52, [1, 1], 3).map((it, i) => ({
        ...it,
        rot: 0,
        scale: 1,
        y: gy,
        z: -(i + 0.5) * (FIELD_LENGTH / 2) - range(rand, 0, 40),
      })),
      far: makeItems(rand, 64, FAR_LENGTH, 44, 210, [1, 1], 6).map((it) =>
        tower({ ...it, z: -range(rand, 60, FAR_LENGTH), scale: 1.4 }, range(rand, 26, 60)),
      ),
      skyline: makeItems(rand, 26, FAR_LENGTH, 80, 270, [1.6, 2.6], 6).map((it) => ({
        ...it,
        rot: 0,
        y: gy,
        z: -range(rand, 120, FAR_LENGTH),
      })),
      lowClouds: Array.from({ length: 10 }, (_, id) => ({
        id,
        x: range(rand, -1, 1) * 56,
        y: range(rand, -38, -16),
        z: -range(rand, 20, FIELD_LENGTH),
        scale: range(rand, 3, 6),
        rot: rand() * Math.PI * 2,
        variant: 0,
      })),
      clouds: Array.from({ length: 12 }, (_, id) => ({
        id,
        x: range(rand, -1, 1) * 46,
        y: range(rand, 7, 16),
        z: -range(rand, 20, FIELD_LENGTH),
        scale: range(rand, 2.2, 4.4),
        rot: rand() * Math.PI * 2,
        variant: 0,
      })),
    }
  }, [stage, gy])

  const curve = stage.curve ?? DEFAULT_CURVE

  return (
    <group>
      <ScrollField
        items={built.skyline}
        length={FAR_LENGTH}
        render={(it) => (
          <SkylineCluster tex={windowTextures[(it.variant + it.id) % 6]} variant={it.variant + it.id} />
        )}
      />
      <ScrollField
        items={built.far}
        length={FAR_LENGTH}
        render={(it) => <Tower tex={windowTextures[(it.variant + it.id) % 6]} it={it as TowerItem} />}
      />
      <ScrollField
        curve={curve}
        items={built.houses}
        length={FIELD_LENGTH}
        render={(it) => (
          <House
            body={['#e8e0d0', '#dcd4c4', '#c9beae', '#e8d8c0', '#d4c8b8'][it.variant]}
            roof={['#c0563f', '#8a5a44', '#5c7a8a', '#7a8a5c', '#a05242'][it.variant]}
          />
        )}
      />
      <ScrollField
        curve={curve}
        items={built.specials}
        length={FIELD_LENGTH}
        render={(it) =>
          it.variant === 0 ? <FerrisWheel /> : it.variant === 1 ? <RadioTower /> : <DomeStadium />
        }
      />
      <ScrollField
        curve={curve}
        items={built.sprawl}
        length={FIELD_LENGTH}
        render={(it) => <Tower tex={windowTextures[(it.variant + it.id) % 6]} it={it as TowerItem} />}
      />
      <ScrollField
        curve={curve}
        items={built.mids}
        length={FIELD_LENGTH}
        render={(it) => <Tower tex={windowTextures[(it.variant + it.id) % 6]} it={it as TowerItem} />}
      />
      <ScrollField
        curve={curve}
        items={built.landmarks}
        length={FIELD_LENGTH}
        render={(it) => <Tower tex={windowTextures[(it.variant + it.id) % 6]} it={it as TowerItem} />}
      />
      <ScrollField
        curve={curve}
        items={built.lowClouds}
        length={FIELD_LENGTH}
        render={() => <Cloud />}
      />
      <ScrollField
        curve={curve}
        items={built.clouds}
        length={FIELD_LENGTH}
        render={() => <Cloud />}
      />
    </group>
  )
}
