import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA_Z, FIELD_LENGTH } from '../constants'
import { mulberry32, range } from '../rng'
import { rt } from '../state'
import { ScrollField, type FieldItem } from '../ScrollField'
import { curveAt, DEFAULT_CURVE } from '../track'
import type { StageConfig } from './types'

const FAR_LENGTH = 900
const RIDE_COLORS = ['#ff8a75', '#ffd166', '#5cc9b8', '#ff9ab8', '#9b8cff', '#7fd87f']

/**
 * 줄무늬 원뿔 — 서커스 지붕의 핵심.
 * 부채꼴 섹터마다 두 색을 번갈아 정점 색상으로 굽는다.
 */
function makeStripedCone(radius: number, height: number, a: string, b: string, stripes = 12) {
  const geo = new THREE.ConeGeometry(radius, height, stripes * 2, 1).toNonIndexed()
  const pos = geo.getAttribute('position')
  const colors = new Float32Array(pos.count * 3)
  const ca = new THREE.Color(a)
  const cb = new THREE.Color(b)
  for (let f = 0; f < pos.count / 3; f++) {
    // 면의 무게중심 각도로 섹터를 정한다
    let cx = 0
    let cz = 0
    for (let v = 0; v < 3; v++) {
      cx += pos.getX(f * 3 + v)
      cz += pos.getZ(f * 3 + v)
    }
    const sector = Math.floor(((Math.atan2(cz, cx) + Math.PI) / (Math.PI * 2)) * stripes * 2)
    const c = sector % 2 === 0 ? ca : cb
    for (let v = 0; v < 3; v++) {
      colors[(f * 3 + v) * 3] = c.r
      colors[(f * 3 + v) * 3 + 1] = c.g
      colors[(f * 3 + v) * 3 + 2] = c.b
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

/** 어트랙션 받침 단 — 이미지처럼 모든 놀이기구가 파스텔 원판 위에 선다 */
function RideBase({ r, color = '#f4e0c8' }: { r: number; color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[r, r * 1.06, 0.5, 18]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[r * 0.94, r * 0.94, 0.08, 18]} />
        <meshStandardMaterial color="#fff4e0" roughness={0.9} />
      </mesh>
    </group>
  )
}

/** 캐노피 가장자리 알전구 */
function CanopyLights({ r, y, count = 10 }: { r: number; y: number; count?: number }) {
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]}>
            <sphereGeometry args={[0.16, 6, 5]} />
            <meshStandardMaterial
              color="#fff0b0"
              emissive="#ffd166"
              emissiveIntensity={0.9}
              roughness={0.4}
            />
          </mesh>
        )
      })}
    </group>
  )
}

/** 깃발 — 지붕 꼭대기에 꽂는다 */
function Flag({ color = '#ff5c5c' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 5]} />
        <meshStandardMaterial color="#f4e0c8" roughness={0.8} />
      </mesh>
      <mesh position={[0.32, 0.82, 0]}>
        <coneGeometry args={[0.22, 0.6, 3]} />
        <meshStandardMaterial color={color} roughness={0.7} flatShading />
      </mesh>
    </group>
  )
}

/** 동화 속 성 — 파란 고깔 지붕의 탑들이 겹겹이 솟는다 */
function FairyCastle() {
  const tower = (x: number, z: number, h: number, r: number, i: number) => (
    <group key={i} position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[r, r * 1.08, h, 10]} />
        <meshStandardMaterial color="#f4ece0" roughness={0.85} />
      </mesh>
      {/* 창 */}
      {Array.from({ length: Math.max(1, Math.floor(h / 7)) }, (_, w) => (
        <mesh key={w} position={[0, h * 0.35 + w * 6, r * 0.99]}>
          <boxGeometry args={[0.7, 1.3, 0.2]} />
          <meshStandardMaterial color="#4a5a7a" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, h + r * 1.05, 0]}>
        <coneGeometry args={[r * 1.28, r * 2.6, 10]} />
        <meshStandardMaterial color="#4d7ac2" roughness={0.7} flatShading />
      </mesh>
      <group position={[0, h + r * 1.05 + r * 1.3, 0]} scale={1.4}>
        <Flag color="#ffd166" />
      </group>
    </group>
  )

  return (
    <group>
      {/* 본성 성벽과 대문 */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[22, 10, 14]} />
        <meshStandardMaterial color="#f4ece0" roughness={0.85} />
      </mesh>
      <mesh position={[0, 10.4, 0]}>
        <boxGeometry args={[23, 1.2, 15]} />
        <meshStandardMaterial color="#e8d8c4" roughness={0.85} />
      </mesh>
      <mesh position={[0, 3.4, 7.1]}>
        <cylinderGeometry args={[2.6, 2.6, 0.6, 12, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#8a6a5a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.7, 7.05]}>
        <boxGeometry args={[5.2, 3.4, 0.5]} />
        <meshStandardMaterial color="#8a6a5a" roughness={0.85} />
      </mesh>
      {/* 모서리 탑 4 + 중앙 대탑 + 첨탑 */}
      {tower(-9.5, 6, 15, 2.4, 0)}
      {tower(9.5, 6, 15, 2.4, 1)}
      {tower(-9.5, -6, 18, 2.4, 2)}
      {tower(9.5, -6, 18, 2.4, 3)}
      {tower(-3.6, -1, 26, 2.8, 4)}
      {tower(3.6, -1, 26, 2.8, 5)}
      {tower(0, -3, 38, 3.4, 6)}
    </group>
  )
}

/** 작은 공원 — 잔디 광장에 나무·꽃·벤치 */
function ParkPatch({ seed }: { seed: number }) {
  return (
    <group>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6, 18]} />
        <meshStandardMaterial color="#7fc98f" roughness={0.95} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + seed
        return (
          <group key={i} position={[Math.cos(a) * 3.4, 0, Math.sin(a) * 3.4]}>
            <CandyTree tall={i === seed % 3} />
          </group>
        )
      })}
      {/* 꽃 */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + seed * 1.7
        return (
          <mesh key={i} position={[Math.cos(a) * 1.7, 0.28, Math.sin(a) * 1.7]}>
            <sphereGeometry args={[0.2, 6, 5]} />
            <meshStandardMaterial
              color={RIDE_COLORS[(i + seed) % RIDE_COLORS.length]}
              roughness={0.7}
            />
          </mesh>
        )
      })}
      {/* 벤치 */}
      <group position={[0, 0, -4.4]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[2.2, 0.16, 0.7]} />
          <meshStandardMaterial color="#a8785c" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.9, -0.3]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[2.2, 0.7, 0.14]} />
          <meshStandardMaterial color="#a8785c" roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
}

/** 연못 — 물빛 원반과 갈대, 오리 */
function Pond() {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.4, 1, 1]}>
        <circleGeometry args={[7, 20]} />
        <meshStandardMaterial color="#5c9fd8" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.5, 1.08, 1]}>
        <circleGeometry args={[7.3, 20]} />
        <meshStandardMaterial color="#e8d8b0" roughness={0.9} />
      </mesh>
      {/* 갈대 */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + 0.5
        return (
          <group key={i} position={[Math.cos(a) * 8.6, 0, Math.sin(a) * 5.8]}>
            <mesh position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.06, 0.08, 1.6, 5]} />
              <meshStandardMaterial color="#5faf7f" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.7, 0]}>
              <capsuleGeometry args={[0.14, 0.5, 4, 6]} />
              <meshStandardMaterial color="#a8785c" roughness={0.9} />
            </mesh>
          </group>
        )
      })}
      {/* 오리 */}
      {[[-2, 1.4], [2.4, -1]].map(([x, z], i) => (
        <group key={i} position={[x, 0.35, z]}>
          <mesh scale={[1.3, 0.8, 1]}>
            <sphereGeometry args={[0.5, 8, 6]} />
            <meshStandardMaterial color="#fff4e0" roughness={0.7} />
          </mesh>
          <mesh position={[0.55, 0.4, 0]}>
            <sphereGeometry args={[0.26, 8, 6]} />
            <meshStandardMaterial color="#fff4e0" roughness={0.7} />
          </mesh>
          <mesh position={[0.82, 0.38, 0]}>
            <coneGeometry args={[0.1, 0.3, 5]} />
            <meshStandardMaterial color="#ff9a3d" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** 파스텔 나무 */
function CandyTree({ tall = false }: { tall?: boolean }) {
  return (
    <group scale={tall ? 1.35 : 1}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 1, 6]} />
        <meshStandardMaterial color="#a8785c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <coneGeometry args={[1, 1.8, 7]} />
        <meshStandardMaterial color="#5faf7f" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <coneGeometry args={[0.7, 1.3, 7]} />
        <meshStandardMaterial color="#7fc98f" roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}

/** 드롭타워 — 줄무늬 기둥 위 원뿔 지붕, 좌석 링이 천천히 올라가 뚝 떨어진다 */
function DropTower() {
  const seats = useRef<THREE.Group>(null!)
  const capGeo = useMemo(() => makeStripedCone(2.6, 2.6, '#ff8a75', '#fff4e0', 8), [])

  useFrame(() => {
    const cycle = 7
    const t = (rt.time % cycle) / cycle
    // 0~0.7 천천히 상승, 0.7~0.78 뚝, 나머지 바닥 대기
    let y: number
    if (t < 0.7) y = 1.6 + (t / 0.7) * 10.5
    else if (t < 0.78) y = 12.1 - ((t - 0.7) / 0.08) * 10.5
    else y = 1.6
    seats.current.position.y = y
  })

  return (
    <group>
      {/* 줄무늬 기둥 — 흰·산호 링을 쌓는다 */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[0, 1 + i * 2, 0]}>
          <cylinderGeometry args={[0.75, 0.75, 2, 10]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#fff4e0' : '#ff8a75'} roughness={0.7} />
        </mesh>
      ))}
      <mesh geometry={capGeo} position={[0, 16.3, 0]}>
        <meshStandardMaterial vertexColors roughness={0.7} flatShading />
      </mesh>
      <group position={[0, 17.6, 0]}>
        <Flag color="#5cc9b8" />
      </group>
      {/* 좌석 링 */}
      <group ref={seats}>
        <mesh>
          <torusGeometry args={[1.7, 0.35, 8, 16]} />
          <meshStandardMaterial color="#5cc9b8" roughness={0.6} />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 1.7, -0.4, Math.sin(a) * 1.7]}>
              <boxGeometry args={[0.6, 0.7, 0.6]} />
              <meshStandardMaterial color={RIDE_COLORS[i % RIDE_COLORS.length]} roughness={0.6} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

/** 서커스 대형 천막 — 줄무늬 지붕과 깃발 */
function BigTop({ a, b, scale = 1 }: { a: string; b: string; scale?: number }) {
  const roof = useMemo(() => makeStripedCone(4.6, 3.4, a, b, 10), [a, b])
  return (
    <group scale={scale}>
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[3.9, 4.2, 3.4, 14]} />
        <meshStandardMaterial color="#fff4e0" roughness={0.85} />
      </mesh>
      {/* 입구 */}
      <mesh position={[0, 1.1, 4.05]} rotation={[0.15, 0, 0]}>
        <coneGeometry args={[1.1, 2.2, 4]} />
        <meshStandardMaterial color={a} roughness={0.8} flatShading />
      </mesh>
      <mesh geometry={roof} position={[0, 5.1, 0]}>
        <meshStandardMaterial vertexColors roughness={0.75} flatShading />
      </mesh>
      <group position={[0, 6.8, 0]}>
        <Flag color={a} />
      </group>
    </group>
  )
}

/* ---------------- 롤러코스터 ---------------- */

/**
 * 코스 전체를 따라 하나로 이어지는 롤러코스터.
 *
 * 트랙은 길 옆을 크게 휘돌다가 340m 주기로 두 번 길 한가운데(lateral 0)를 지난다 —
 * 그때 플레이어 머리 위를 가로지른다. 곡선의 주기를 FIELD_LENGTH 로 잡았기 때문에
 * 세그먼트를 이어 붙여도 이음매가 생기지 않는다.
 */
const COASTER_SEGMENTS = 8
const SEG_LEN = FIELD_LENGTH / COASTER_SEGMENTS

/** 트랙의 코스상 위치 s 에서의 좌우 오프셋 */
function coasterLateral(s: number) {
  const t = (s / FIELD_LENGTH) * Math.PI * 2
  return Math.sin(t) * 30 + Math.sin(t * 2 + 0.7) * 7
}

/** 트랙의 높이 — 오르막과 급강하가 번갈아 온다 */
function coasterHeight(s: number) {
  const t = (s / FIELD_LENGTH) * Math.PI * 2
  return 15 + Math.sin(t * 3 - 0.4) * 7 + Math.sin(t * 7) * 1.6
}

/** 세그먼트 하나의 레일 지오메트리 (로컬 좌표, 커브 보정은 바깥에서) */
function makeSegment(index: number, offset: number) {
  const pts: THREE.Vector3[] = []
  const steps = 22
  for (let i = 0; i <= steps; i++) {
    const local = (i / steps) * SEG_LEN
    const s = index * SEG_LEN + local
    pts.push(new THREE.Vector3(coasterLateral(s) + offset, coasterHeight(s), -local))
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.26, 5, false)
}

/** 세그먼트 안에서 기둥을 세울 지점 — 길 위(회랑)에는 세우지 않는다 */
function segmentPosts(index: number) {
  const posts: { x: number; y: number; z: number }[] = []
  for (let i = 0; i < 3; i++) {
    const local = ((i + 0.5) / 3) * SEG_LEN
    const s = index * SEG_LEN + local
    const x = coasterLateral(s)
    if (Math.abs(x) < 12) continue
    posts.push({ x, y: coasterHeight(s), z: -local })
  }
  return posts
}

function CoasterSegment({ index }: { index: number }) {
  const { railL, railR, ties, posts } = useMemo(() => {
    const railL = makeSegment(index, -0.55)
    const railR = makeSegment(index, 0.55)
    // 침목
    const ties: { x: number; y: number; z: number; rot: number }[] = []
    for (let i = 0; i < 7; i++) {
      const local = ((i + 0.5) / 7) * SEG_LEN
      const s = index * SEG_LEN + local
      const a = coasterLateral(s)
      const b = coasterLateral(s + 1)
      ties.push({ x: a, y: coasterHeight(s), z: -local, rot: Math.atan2(b - a, 1) })
    }
    return { railL, railR, ties, posts: segmentPosts(index) }
  }, [index])

  return (
    <group>
      <mesh geometry={railL}>
        <meshStandardMaterial color="#f0f4fa" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh geometry={railR}>
        <meshStandardMaterial color="#f0f4fa" roughness={0.4} metalness={0.5} />
      </mesh>
      {ties.map((t, i) => (
        <mesh key={i} position={[t.x, t.y - 0.2, t.z]} rotation={[0, t.rot, 0]}>
          <boxGeometry args={[1.5, 0.12, 0.22]} />
          <meshStandardMaterial color="#ff4d6d" roughness={0.6} />
        </mesh>
      ))}
      {posts.map((p, i) => (
        <group key={i}>
          <mesh position={[p.x, p.y / 2, p.z]}>
            <boxGeometry args={[0.4, p.y, 0.4]} />
            <meshStandardMaterial color="#7fe06a" roughness={0.7} />
          </mesh>
          <mesh position={[p.x, p.y * 0.75, p.z]} rotation={[0, 0, Math.PI / 5]}>
            <boxGeometry args={[0.2, p.y * 0.6, 0.2]} />
            <meshStandardMaterial color="#dfe6ef" roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/**
 * 레일과 열차를 한 컴포넌트에서 그린다.
 *
 * 예전에는 레일을 ScrollField 로 흘리고 열차는 rt.distance 로 위치를 계산했는데,
 * 재시작 때 rt.distance 는 0 으로 돌아가도 ScrollField 자식들의 z 는 남아 있어
 * 레일과 열차의 위상이 어긋났다(열차가 허공에 뜬다). 그래서 둘 다 여기 있는
 * 단 하나의 스크롤 누적값 scroll 로 계산한다 — 원천이 같으니 어긋날 수 없다.
 *
 * 월드 z 의 레일 파라미터는 s = scroll - z 이고, 높이·좌우 함수의 주기가
 * FIELD_LENGTH 라 되감김도 자동으로 맞는다.
 */
const TRACK_Z_MAX = CAMERA_Z + 40 // ScrollField 의 되감김 경계와 같은 값
const TRAINS = [
  { id: 0, offset: 40, speed: 26 },
  { id: 1, offset: 160, speed: 42 },
  { id: 2, offset: 280, speed: 55 },
]

/** z0 를 레일이 그려지는 창 z ∈ (TRACK_Z_MAX - 340, TRACK_Z_MAX] 로 되감는다 */
function wrapTrackZ(z0: number) {
  return ((((z0 - TRACK_Z_MAX) % FIELD_LENGTH) + FIELD_LENGTH) % FIELD_LENGTH) + TRACK_Z_MAX - FIELD_LENGTH
}

function Coaster() {
  const segGroup = useRef<THREE.Group>(null!)
  const trainGroup = useRef<THREE.Group>(null!)
  const scroll = useRef(0)

  useFrame((_, delta) => {
    if (rt.running) scroll.current += rt.speed * Math.min(delta, 0.05)
    const sc = scroll.current
    if (import.meta.env.DEV) (globalThis as unknown as { __pfCoaster: number }).__pfCoaster = sc

    // 레일 세그먼트: 진행에 맞춰 흘려보내고 카메라를 지나면 340 뒤로
    for (let i = 0; i < segGroup.current.children.length; i++) {
      segGroup.current.children[i].position.z = wrapTrackZ(sc - i * SEG_LEN)
    }

    // 열차: 레일과 같은 scroll 을 원천으로 s = sc - z
    for (let i = 0; i < trainGroup.current.children.length; i++) {
      const g = trainGroup.current.children[i]
      const cfg = TRAINS[i]
      const z = wrapTrackZ(sc - (cfg.offset + rt.time * cfg.speed))
      const sAt = sc - z
      g.position.set(coasterLateral(sAt), coasterHeight(sAt) + 0.75, z)
      g.lookAt(coasterLateral(sAt + 3), coasterHeight(sAt + 3) + 0.75, z - 3)
    }
  })

  return (
    <group>
      <group ref={segGroup}>
        {Array.from({ length: COASTER_SEGMENTS }, (_, i) => (
          <group key={i} position={[0, 0, -i * SEG_LEN]}>
            <CoasterSegment index={i} />
          </group>
        ))}
      </group>
      <group ref={trainGroup}>{TRAINS.map((t) => (
        <group key={t.id}>
          {[0, 1, 2, 3].map((c) => (
            <group key={c} position={[0, 0, c * 1.5]}>
              <mesh>
                <boxGeometry args={[1.3, 0.85, 1.3]} />
                <meshStandardMaterial
                  color={RIDE_COLORS[(t.id + c) % RIDE_COLORS.length]}
                  roughness={0.5}
                />
              </mesh>
              <mesh position={[0, 0.62, 0]}>
                <sphereGeometry args={[0.26, 10, 8]} />
                <meshStandardMaterial color="#ffcbb0" roughness={0.8} />
              </mesh>
            </group>
          ))}
        </group>
      ))}</group>
    </group>
  )
}

/* ---------------- 대관람차 ---------------- */

function FerrisWheel({ scale = 1 }: { scale?: number }) {
  const wheel = useRef<THREE.Group>(null!)
  const CABINS = 12
  const R = 11

  useFrame(() => {
    wheel.current.rotation.z = rt.time * 0.22
    for (const cabin of wheel.current.children) cabin.rotation.z = -wheel.current.rotation.z
  })

  return (
    <group scale={scale}>
      <RideBase r={7} />
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 4.5, 7.5, 0]} rotation={[0, 0, sx * 0.34]}>
          <boxGeometry args={[1.1, 16, 1.1]} />
          <meshStandardMaterial color="#f4e0c8" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 1.8, 12]} />
        <meshStandardMaterial color="#ff8a75" roughness={0.6} />
      </mesh>
      {/* 바퀴테와 스포크 */}
      <group position={[0, 14, 0]}>
        <mesh>
          <torusGeometry args={[R, 0.34, 8, 36]} />
          <meshStandardMaterial color="#fff4e0" roughness={0.6} />
        </mesh>
        <mesh>
          <torusGeometry args={[R * 0.62, 0.22, 8, 30]} />
          <meshStandardMaterial color="#ff8a75" roughness={0.55} />
        </mesh>
        <group ref={wheel}>
          {Array.from({ length: CABINS }, (_, i) => {
            const a = (i / CABINS) * Math.PI * 2
            return (
              <group key={i} position={[Math.cos(a) * R, Math.sin(a) * R, 0]}>
                {/* 스포크 */}
                <mesh position={[-Math.cos(a) * R * 0.5, -Math.sin(a) * R * 0.5, 0]} rotation={[0, 0, a]}>
                  <boxGeometry args={[R, 0.1, 0.1]} />
                  <meshStandardMaterial color="#dfe6ef" roughness={0.6} />
                </mesh>
                {/* 곤돌라 — 둥근 몸통에 고깔 지붕 */}
                <mesh position={[0, -1.15, 0]} scale={[1, 0.85, 0.9]}>
                  <sphereGeometry args={[0.95, 10, 8]} />
                  <meshStandardMaterial
                    color={RIDE_COLORS[i % RIDE_COLORS.length]}
                    roughness={0.55}
                  />
                </mesh>
                <mesh position={[0, -0.35, 0]}>
                  <coneGeometry args={[0.7, 0.7, 8]} />
                  <meshStandardMaterial color="#fff4e0" roughness={0.7} flatShading />
                </mesh>
                <mesh position={[0, -0.05, 0]}>
                  <boxGeometry args={[0.1, 0.7, 0.1]} />
                  <meshStandardMaterial color="#c9a889" roughness={0.6} />
                </mesh>
              </group>
            )
          })}
        </group>
      </group>
    </group>
  )
}

/* ---------------- 회전목마 ---------------- */

function Carousel() {
  const deck = useRef<THREE.Group>(null!)
  const carouselRoof = useMemo(() => makeStripedCone(5.7, 2.6, '#ff8a75', '#fff4e0', 10), [])

  useFrame(() => {
    deck.current.rotation.y = rt.time * 0.6
    for (let i = 0; i < deck.current.children.length; i++) {
      deck.current.children[i].position.y = Math.sin(rt.time * 3 + i * 1.1) * 0.35
    }
  })

  return (
    <group>
      <RideBase r={6} color="#e8927c" />
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[5.2, 5.4, 0.5, 20]} />
        <meshStandardMaterial color="#fff4e0" roughness={0.8} />
      </mesh>
      {/* 줄무늬 중앙 기둥 */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[0, 1.3 + i * 1, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 1, 10]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#ff8a75' : '#fff4e0'} roughness={0.7} />
        </mesh>
      ))}
      <CanopyLights r={5.15} y={5.75} count={12} />
      {/* 줄무늬 지붕 + 스캘럽 가장자리 */}
      <mesh geometry={carouselRoof} position={[0, 6.5, 0]}>
        <meshStandardMaterial vertexColors roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 5.45, 0]}>
        <torusGeometry args={[5.35, 0.28, 8, 22]} />
        <meshStandardMaterial color="#fff4e0" roughness={0.75} />
      </mesh>
      <group position={[0, 7.8, 0]}>
        <Flag color="#ff8a75" />
      </group>
      {/* 목마 */}
      <group ref={deck} position={[0, 1.2, 0]}>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <group key={i} position={[Math.cos(a) * 3.6, 0, Math.sin(a) * 3.6]} rotation={[0, -a, 0]}>
              <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 3, 6]} />
                <meshStandardMaterial color="#ffd166" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.9, 0]} scale={[1.3, 0.75, 0.6]}>
                <sphereGeometry args={[0.62, 10, 8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.7} />
              </mesh>
              <mesh position={[0.55, 1.35, 0]} rotation={[0, 0, -0.5]}>
                <capsuleGeometry args={[0.16, 0.5, 4, 8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.7} />
              </mesh>
            </group>
          )
        })}
      </group>
    </group>
  )
}

/* ---------------- 바이킹(해적선) ---------------- */

function PirateShip() {
  const swing = useRef<THREE.Group>(null!)

  useFrame(() => {
    swing.current.rotation.z = Math.sin(rt.time * 1.1) * 0.95
  })

  return (
    <group>
      <RideBase r={7.5} color="#5cc9b8" />
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 3.4, 5, 0]} rotation={[0, 0, sx * 0.32]}>
          <boxGeometry args={[0.6, 11, 0.6]} />
          <meshStandardMaterial color="#dfe6ef" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      <group ref={swing} position={[0, 10, 0]}>
        <mesh position={[0, -3.2, 0]}>
          <boxGeometry args={[0.22, 6.4, 0.22]} />
          <meshStandardMaterial color="#9aa4b2" roughness={0.6} />
        </mesh>
        {/* 배 */}
        <group position={[0, -6.9, 0]}>
          <mesh scale={[1, 0.55, 0.7]}>
            <sphereGeometry args={[3.2, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <meshStandardMaterial color="#8a5a34" roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[3.1, 0.5, 0]} rotation={[0, 0, -0.5]}>
            <coneGeometry args={[0.5, 1.8, 6]} />
            <meshStandardMaterial color="#8a5a34" roughness={0.85} />
          </mesh>
          {[-1.6, 0, 1.6].map((x) => (
            <mesh key={x} position={[x, 0.55, 0]}>
              <sphereGeometry args={[0.26, 10, 8]} />
              <meshStandardMaterial color="#ffcbb0" roughness={0.8} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

/* ---------------- 그 밖의 소품 ---------------- */

/** 풍선 다발 */
function Balloons({ seed }: { seed: number }) {
  const group = useRef<THREE.Group>(null!)
  useFrame(() => {
    group.current.position.y = Math.sin(rt.time * 0.9 + seed) * 0.6
    group.current.rotation.y = Math.sin(rt.time * 0.4 + seed) * 0.4
  })
  return (
    <group ref={group}>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i} position={[Math.cos(a) * 0.7, 4.5 + (i % 2) * 0.5, Math.sin(a) * 0.7]}>
            <mesh scale={[1, 1.2, 1]}>
              <sphereGeometry args={[0.6, 12, 10]} />
              <meshStandardMaterial
                color={RIDE_COLORS[(i + seed) % RIDE_COLORS.length]}
                roughness={0.45}
              />
            </mesh>
            <mesh position={[0, -2.2, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 4, 4]} />
              <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/** 범퍼카장 — 작은 차들이 바닥을 돈다 */
function BumperCars() {
  const group = useRef<THREE.Group>(null!)
  const roof = useMemo(() => makeStripedCone(7.4, 2.2, '#5cc9b8', '#fff4e0', 10), [])
  useFrame(() => {
    for (let i = 0; i < group.current.children.length; i++) {
      const c = group.current.children[i]
      const a = rt.time * (0.7 + (i % 3) * 0.25) + i * 1.7
      const r = 1.6 + (i % 3) * 1.1
      c.position.set(Math.cos(a) * r, 0.45, Math.sin(a * 1.3) * r)
      c.rotation.y = -a
    }
  })
  return (
    <group>
      <RideBase r={7.2} />
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[11, 0.24, 9]} />
        <meshStandardMaterial color="#4a5568" roughness={0.9} />
      </mesh>
      {/* 네 기둥 위 줄무늬 캐노피 */}
      {[[-5, -4], [5, -4], [-5, 4], [5, 4]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 3.4, z]}>
          <cylinderGeometry args={[0.18, 0.18, 6.4, 8]} />
          <meshStandardMaterial color="#fff4e0" roughness={0.7} />
        </mesh>
      ))}
      <mesh geometry={roof} position={[0, 7.4, 0]}>
        <meshStandardMaterial vertexColors roughness={0.75} flatShading />
      </mesh>
      <group position={[0, 8.6, 0]}>
        <Flag color="#5cc9b8" />
      </group>
      <group ref={group}>
        {Array.from({ length: 6 }, (_, i) => (
          <group key={i}>
            <mesh scale={[1.2, 0.5, 1]}>
              <sphereGeometry args={[0.75, 10, 8]} />
              <meshStandardMaterial color={RIDE_COLORS[i % RIDE_COLORS.length]} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.35, 0]}>
              <sphereGeometry args={[0.22, 8, 6]} />
              <meshStandardMaterial color="#ffcbb0" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

/** 정문 아치 — 깃발이 나부낀다 */
function ParkGate() {
  return (
    <group>
      {[-13, 13].map((x) => (
        <mesh key={x} position={[x, 4, 0]}>
          <cylinderGeometry args={[0.7, 0.9, 8, 10]} />
          <meshStandardMaterial color="#ff4d6d" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 8.6, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[13, 0.6, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#ffd166" roughness={0.6} />
      </mesh>
      {[-13, 0, 13].map((x, i) => (
        <mesh key={x} position={[x, i === 1 ? 14.2 : 8.6, 0]}>
          <coneGeometry args={[0.5, 1.4, 6]} />
          <meshStandardMaterial color={RIDE_COLORS[i]} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------- 배치 ---------------- */

/** 코스 곡선을 따르며 길 위를 넘어가는 구조물 (롤러코스터·정문) */
function OverpassField({
  items,
  stage,
  render,
}: {
  items: FieldItem[]
  stage: StageConfig
  render: (item: FieldItem) => React.ReactNode
}) {
  const group = useRef<THREE.Group>(null!)
  const curve = stage.curve ?? DEFAULT_CURVE

  useFrame((_, delta) => {
    if (!rt.running) return
    const d = rt.speed * Math.min(delta, 0.05)
    const kids = group.current.children
    for (let i = 0; i < kids.length; i++) {
      const c = kids[i]
      c.position.z += d
      if (c.position.z > 30) c.position.z -= FIELD_LENGTH
      c.position.x = curveAt(rt.distance, c.position.z, curve)
    }
  })

  return (
    <group ref={group}>
      {items.map((it) => (
        <group key={it.id} position={[0, it.y, it.z]} scale={it.scale}>
          {render(it)}
        </group>
      ))}
    </group>
  )
}

export function ParkScenery({ stage }: { stage: StageConfig }) {
  const built = useMemo(() => {
    const rand = mulberry32(stage.seed)
    const spread = (count: number, gap: number, minX: number, maxX: number) =>
      Array.from({ length: count }, (_, id) => ({
        id,
        x: (rand() > 0.5 ? 1 : -1) * range(rand, minX, maxX),
        y: 0,
        z: -id * gap - range(rand, 0, gap * 0.5),
        scale: 1,
        rot: 0,
        variant: Math.floor(rand() * 6),
      }))
    return {
      gate: [{ id: 0, x: 0, y: 0, z: -FIELD_LENGTH * 0.5, scale: 1.5, rot: 0, variant: 0 }],
      wheels: spread(1, FIELD_LENGTH, 26, 34).map((it) => ({ ...it, scale: 2.2 })),
      castle: [{ id: 0, x: 36, y: 0, z: -FIELD_LENGTH * 0.62, scale: 1.9, rot: -0.35, variant: 0 }],
      parks: spread(6, FIELD_LENGTH / 6, 15, 30).map((it) => ({ ...it, scale: 1.7 })),
      carousels: spread(3, FIELD_LENGTH / 3, 22, 34).map((it) => ({ ...it, scale: 2.1 })),
      ships: spread(3, FIELD_LENGTH / 3, 40, 54).map((it) => ({ ...it, scale: 2.6 })),
      bumpers: spread(3, FIELD_LENGTH / 3, 24, 36).map((it) => ({ ...it, scale: 1.8 })),
      booths: spread(10, FIELD_LENGTH / 10, 16, 30).map((it) => ({ ...it, scale: 1.9 })),
      towers: spread(3, FIELD_LENGTH / 3, 20, 32).map((it) => ({ ...it, scale: 1.8 })),
      trees: spread(26, FIELD_LENGTH / 26, 11, 30).map((it) => ({ ...it, scale: 1.7 })),
      balloons: spread(10, FIELD_LENGTH / 10, 11, 20).map((it) => ({ ...it, scale: 1.6 })),
      far: spread(12, FAR_LENGTH / 12, 55, 150).map((it) => ({ ...it, scale: 2.3 })),
      farPonds: spread(5, FAR_LENGTH / 5, 45, 120).map((it) => ({ ...it, scale: 2.2 })),
    }
  }, [stage])

  const curve = stage.curve ?? DEFAULT_CURVE

  return (
    <group>
      {/* 원경 — 회전목마·텐트·이따금 관람차 하나 */}
      <ScrollField
        items={built.far}
        length={FAR_LENGTH}
        speedScale={0.2}
        render={(it) =>
          it.variant % 2 === 0 ? (
            <Carousel />
          ) : (
            <BigTop a={RIDE_COLORS[it.variant % RIDE_COLORS.length]} b="#fff4e0" scale={1.2} />
          )
        }
      />
      {/* 멀리 반짝이는 연못 */}
      <ScrollField
        items={built.farPonds}
        length={FAR_LENGTH}
        speedScale={0.2}
        render={() => <Pond />}
      />

      {/* 코스를 따라 하나로 이어지는 롤러코스터 — 레일과 열차가 한 몸 */}
      <Coaster />
      <OverpassField items={built.gate} stage={stage} render={() => <ParkGate />} />

      <ScrollField
        curve={curve}
        items={built.wheels}
        length={FIELD_LENGTH}
        render={() => <FerrisWheel />}
      />
      {/* 아주 큰 동화 속 성 */}
      <ScrollField
        curve={curve}
        items={built.castle}
        length={FIELD_LENGTH}
        render={() => <FairyCastle />}
      />
      <ScrollField
        curve={curve}
        items={built.parks}
        length={FIELD_LENGTH}
        render={(it) => <ParkPatch seed={it.id} />}
      />
      <ScrollField
        curve={curve}
        items={built.carousels}
        length={FIELD_LENGTH}
        render={() => <Carousel />}
      />
      <ScrollField
        curve={curve}
        items={built.ships}
        length={FIELD_LENGTH}
        render={() => <PirateShip />}
      />
      <ScrollField
        curve={curve}
        items={built.bumpers}
        length={FIELD_LENGTH}
        render={() => <BumperCars />}
      />
      <ScrollField
        curve={curve}
        items={built.booths}
        length={FIELD_LENGTH}
        render={(it) => (
          <BigTop
            a={RIDE_COLORS[it.variant % 3 === 0 ? 0 : it.variant % RIDE_COLORS.length]}
            b="#fff4e0"
            scale={0.75 + (it.variant % 3) * 0.2}
          />
        )}
      />
      <ScrollField
        curve={curve}
        items={built.towers}
        length={FIELD_LENGTH}
        render={() => <DropTower />}
      />
      <ScrollField
        curve={curve}
        items={built.trees}
        length={FIELD_LENGTH}
        render={(it) => <CandyTree tall={it.variant % 2 === 0} />}
      />
      <ScrollField
        curve={curve}
        items={built.balloons}
        length={FIELD_LENGTH}
        render={(it) => <Balloons seed={it.id} />}
      />
    </group>
  )
}
