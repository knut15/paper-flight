import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FIELD_LENGTH } from '../constants'
import { mulberry32, range } from '../rng'
import { rt } from '../state'
import { ScrollField } from '../ScrollField'
import { DEFAULT_CURVE } from '../track'
import { makeItems } from './sceneryUtils'
import type { StageConfig } from './types'

const FAR_LENGTH = 900

const CRAYON_COLORS = ['#ff5c5c', '#4d8fff', '#ffd166', '#7fd87f', '#b07aff', '#ff9a3d']

/**
 * 크레용(크레파스) — 바닥에 눕혀 놓았다.
 * 게임하는 어린이가 보기에 위로 솟은 뾰족한 물건이 없도록 전부 눕힌다.
 */
function Crayon({ color }: { color: string }) {
  return (
    <group position={[0, 0.57, 0]} rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[0.55, 0.55, 5.2, 10]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      {/* 종이 라벨 */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 2.6, 10]} />
        <meshStandardMaterial color="#f4ead8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <coneGeometry args={[0.55, 1.2, 10]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
    </group>
  )
}

/** 연필·색연필 — 역시 바닥에 눕혀 놓았다. body 를 주면 색연필이 된다. */
function Pencil({ body }: { body?: string }) {
  const shaft = body ?? '#ffc94d'
  const lead = body ?? '#3a3a3a'
  return (
    <group position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[0.48, 0.48, 6.4, 6]} />
        <meshStandardMaterial color={shaft} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 3.6, 0]}>
        <coneGeometry args={[0.48, 1.1, 6]} />
        <meshStandardMaterial color="#e8c9a0" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 4.35, 0]}>
        <coneGeometry args={[0.16, 0.45, 6]} />
        <meshStandardMaterial color={lead} roughness={0.6} />
      </mesh>
      <mesh position={[0, -3.4, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.5, 10]} />
        <meshStandardMaterial color="#c8ccd4" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, -3.95, 0]}>
        <cylinderGeometry args={[0.48, 0.44, 0.7, 10]} />
        <meshStandardMaterial color="#ff9ab8" roughness={0.85} />
      </mesh>
    </group>
  )
}

/** 동그란 러그 — 참고 이미지의 파란 새끼줄 러그 */
function Rug({ a, b }: { a: string; b: string }) {
  return (
    <group position={[0, 0.05, 0]}>
      {[4.6, 3.5, 2.4, 1.3].map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, i * 0.012, 0]}>
          <ringGeometry args={[r - 1.05, r, 28, 1]} />
          <meshStandardMaterial color={i % 2 === 0 ? a : b} roughness={1} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

/** 스탠드 램프 — 따뜻하게 빛나는 갓 */
function Lamp() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[1.1, 1.4, 0.5, 12]} />
        <meshStandardMaterial color="#7a5636" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 4.2, 8]} />
        <meshStandardMaterial color="#8a6234" roughness={0.9} />
      </mesh>
      <mesh position={[0, 5, 0]}>
        <coneGeometry args={[1.9, 2.4, 12, 1, true]} />
        <meshStandardMaterial
          color="#ffe9b8"
          emissive="#ffd98a"
          emissiveIntensity={0.55}
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

/** 브라운관 TV — 두툼한 몸통과 어두운 화면 */
function RetroTV() {
  return (
    <group>
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[4.6, 3.6, 3.4]} />
        <meshStandardMaterial color="#6a7a6e" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.9, 1.75]}>
        <boxGeometry args={[3.4, 2.6, 0.2]} />
        <meshStandardMaterial
          color="#1c2a30"
          emissive="#3f6a5c"
          emissiveIntensity={0.35}
          roughness={0.3}
        />
      </mesh>
      {/* 다이얼 */}
      {[0.6, 1.3].map((y) => (
        <mesh key={y} position={[1.85, y + 0.7, 1.75]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.2, 10]} />
          <meshStandardMaterial color="#c8ccd4" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

/** 벽에 걸린 포스터 액자 — 원경에서 청록 벽을 채운다 */
function Poster({ colors, variant }: { colors: string[]; variant: number }) {
  const w = 10 + (variant % 3) * 4
  const h = 14 + (variant % 2) * 6
  return (
    <group position={[0, 18 + (variant % 3) * 8, 0]}>
      <mesh>
        <boxGeometry args={[w + 1.6, h + 1.6, 0.8]} />
        <meshStandardMaterial color="#3a3230" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.5]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={colors[variant % colors.length]} roughness={0.95} />
      </mesh>
      {/* 포스터 안 그림 흉내 — 밝은 사각형 */}
      <mesh position={[0, h * 0.14, 0.55]}>
        <planeGeometry args={[w * 0.62, h * 0.4]} />
        <meshStandardMaterial color="#e8ddc4" roughness={0.95} />
      </mesh>
    </group>
  )
}

/** 장난감 블록 — 위에 스터드 4개가 박힌 브릭 */
function ToyBrick({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2.6, 2, 2.6]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      {[-0.65, 0.65].map((x) =>
        [-0.65, 0.65].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 2.25, z]}>
            <cylinderGeometry args={[0.42, 0.42, 0.5, 12]} />
            <meshStandardMaterial color={color} roughness={0.55} />
          </mesh>
        )),
      )}
    </group>
  )
}

/** 쌓인 그림책 — 표지 사이로 흰 페이지가 보인다 */
function BookStack({ colors, variant }: { colors: string[]; variant: number }) {
  const books = 2 + (variant % 2)
  return (
    <group>
      {Array.from({ length: books }, (_, i) => (
        <group key={i} position={[0, i * 0.75 + 0.35, 0]} rotation={[0, (i - 1) * 0.35, 0]}>
          <mesh>
            <boxGeometry args={[4.4, 0.7, 3.2]} />
            <meshStandardMaterial color={colors[(variant + i) % colors.length]} roughness={0.8} />
          </mesh>
          <mesh position={[0.15, 0, 0]}>
            <boxGeometry args={[4.2, 0.52, 3.0]} />
            <meshStandardMaterial color="#f8f4e8" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** 곰인형 — 앉아서 이쪽을 본다 */
function TeddyBear({ fur }: { fur: string }) {
  const belly = '#e8cfa8'
  return (
    <group>
      {/* 다리 */}
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.5, 0.9]} rotation={[0.9, 0, 0]} scale={[1, 1, 1.4]}>
          <sphereGeometry args={[0.55, 10, 8]} />
          <meshStandardMaterial color={fur} roughness={1} />
        </mesh>
      ))}
      {/* 몸통 */}
      <mesh position={[0, 1.5, 0]} scale={[1.15, 1.25, 1]}>
        <sphereGeometry args={[1.3, 12, 10]} />
        <meshStandardMaterial color={fur} roughness={1} />
      </mesh>
      <mesh position={[0, 1.35, 0.95]} scale={[0.8, 0.95, 0.5]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color={belly} roughness={1} />
      </mesh>
      {/* 팔 */}
      {[-1.35, 1.35].map((x) => (
        <mesh key={x} position={[x, 1.7, 0.2]} rotation={[0, 0, x > 0 ? -0.7 : 0.7]} scale={[1, 1.5, 1]}>
          <sphereGeometry args={[0.5, 10, 8]} />
          <meshStandardMaterial color={fur} roughness={1} />
        </mesh>
      ))}
      {/* 머리 */}
      <mesh position={[0, 3.3, 0.1]}>
        <sphereGeometry args={[1.05, 12, 10]} />
        <meshStandardMaterial color={fur} roughness={1} />
      </mesh>
      {/* 주둥이·코 */}
      <mesh position={[0, 3.05, 1]} scale={[0.6, 0.45, 0.5]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color={belly} roughness={1} />
      </mesh>
      <mesh position={[0, 3.2, 1.45]}>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshStandardMaterial color="#3a2a20" roughness={0.6} />
      </mesh>
      {/* 눈 */}
      {[-0.38, 0.38].map((x) => (
        <mesh key={x} position={[x, 3.55, 0.98]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshStandardMaterial color="#241a12" roughness={0.4} />
        </mesh>
      ))}
      {/* 귀 */}
      {[-0.72, 0.72].map((x) => (
        <mesh key={x} position={[x, 4.15, 0]}>
          <sphereGeometry args={[0.38, 10, 8]} />
          <meshStandardMaterial color={fur} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

/** 줄무늬 고무공 */
function RubberBall({ a, b }: { a: string; b: string }) {
  return (
    <group position={[0, 1.3, 0]} rotation={[0.4, 0.7, 0.2]}>
      <mesh>
        <sphereGeometry args={[1.3, 14, 12]} />
        <meshStandardMaterial color={a} roughness={0.5} />
      </mesh>
      <mesh>
        <torusGeometry args={[1.31, 0.22, 8, 28]} />
        <meshStandardMaterial color={b} roughness={0.5} />
      </mesh>
    </group>
  )
}

/** 원경의 거대 가구 실루엣 */
function Furniture({ variant, tone }: { variant: number; tone: string }) {
  if (variant === 0) {
    // 침대 — 매트리스·헤드보드·베개·이불
    return (
      <group>
        <mesh position={[0, 10, 0]}>
          <boxGeometry args={[70, 14, 34]} />
          <meshStandardMaterial color={tone} roughness={0.95} />
        </mesh>
        <mesh position={[-32, 26, 0]}>
          <boxGeometry args={[6, 34, 34]} />
          <meshStandardMaterial color={tone} roughness={0.95} />
        </mesh>
        <mesh position={[-20, 19.5, 0]} scale={[1, 0.45, 1]}>
          <boxGeometry args={[16, 8, 24]} />
          <meshStandardMaterial color="#f4ecdc" roughness={1} />
        </mesh>
        <mesh position={[10, 18.2, 0]}>
          <boxGeometry args={[46, 3.5, 33]} />
          <meshStandardMaterial color="#9ab8d8" roughness={1} />
        </mesh>
      </group>
    )
  }
  if (variant === 1) {
    // 책상 — 상판과 다리
    return (
      <group>
        <mesh position={[0, 30, 0]}>
          <boxGeometry args={[52, 4, 26]} />
          <meshStandardMaterial color={tone} roughness={0.95} />
        </mesh>
        {[-22, 22].map((x) =>
          [-10, 10].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 14, z]}>
              <boxGeometry args={[4, 28, 4]} />
              <meshStandardMaterial color={tone} roughness={0.95} />
            </mesh>
          )),
        )}
      </group>
    )
  }
  // 책장 — 칸마다 알록달록한 책이 꽂혀 있다
  return (
    <group>
      <mesh position={[0, 26, 0]}>
        <boxGeometry args={[36, 52, 12]} />
        <meshStandardMaterial color={tone} roughness={0.95} />
      </mesh>
      {[10, 24, 38].map((y, si) => (
        <group key={y}>
          <mesh position={[0, y + 6.5, 1]}>
            <boxGeometry args={[32, 1.6, 11]} />
            <meshStandardMaterial color="#6a4a30" roughness={0.95} />
          </mesh>
          {[-12, -6, 0, 6, 12].map((x, bi) => (
            <mesh key={x} position={[x, y + 0.5, 2]} rotation={[0, 0, (bi % 3) * 0.06]}>
              <boxGeometry args={[4.4, 11, 8]} />
              <meshStandardMaterial
                color={CRAYON_COLORS[(si * 5 + bi) % CRAYON_COLORS.length]}
                roughness={0.9}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/** 장난감 기차 — 방바닥을 크게 돌며 달린다 */
function ToyTrain() {
  const group = useRef<THREE.Group>(null!)
  const R = 46
  const CZ = -190

  useFrame(() => {
    const a = rt.time * 0.22
    const cars = group.current.children
    for (let i = 0; i < cars.length; i++) {
      const ca = a - i * 0.16
      cars[i].position.set(Math.cos(ca) * R, 0, CZ + Math.sin(ca) * R * 0.55)
      cars[i].rotation.y = -Math.atan2(Math.cos(ca) * 0.55, -Math.sin(ca))
    }
  })

  const wheel = (x: number, z: number) => (
    <mesh key={`${x}${z}`} position={[x, 0.55, z]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.55, 0.55, 0.4, 10]} />
      <meshStandardMaterial color="#3a3a44" roughness={0.6} />
    </mesh>
  )

  return (
    <group ref={group}>
      {/* 기관차 */}
      <group scale={2.2}>
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[3.6, 1.4, 1.9]} />
          <meshStandardMaterial color="#d94f3f" roughness={0.6} />
        </mesh>
        <mesh position={[0.9, 1.9, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.8, 0.8, 2, 12]} />
          <meshStandardMaterial color="#3f6fd8" roughness={0.6} />
        </mesh>
        <mesh position={[1.5, 2.9, 0]}>
          <cylinderGeometry args={[0.3, 0.45, 0.9, 10]} />
          <meshStandardMaterial color="#ffd166" roughness={0.6} />
        </mesh>
        <mesh position={[-1.1, 2.3, 0]}>
          <boxGeometry args={[1.3, 1.4, 1.7]} />
          <meshStandardMaterial color="#3f6fd8" roughness={0.6} />
        </mesh>
        {wheel(1.1, 1)}
        {wheel(-1.1, 1)}
        {wheel(1.1, -1)}
        {wheel(-1.1, -1)}
      </group>
      {/* 화물칸 2량 */}
      {[0, 1].map((i) => (
        <group key={i} scale={2.2}>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[3, 1.3, 1.8]} />
            <meshStandardMaterial color={i === 0 ? '#7fd87f' : '#ffd166'} roughness={0.6} />
          </mesh>
          {wheel(0.9, 1)}
          {wheel(-0.9, 1)}
          {wheel(0.9, -1)}
          {wheel(-0.9, -1)}
        </group>
      ))}
    </group>
  )
}

export function RoomScenery({ stage }: { stage: StageConfig }) {
  const built = useMemo(() => {
    const rand = mulberry32(stage.seed)
    return {
      crayons: makeItems(rand, 22, FIELD_LENGTH, 11, 34, [1.0, 1.9], CRAYON_COLORS.length),
      pencils: makeItems(rand, 16, FIELD_LENGTH, 12, 30, [0.9, 1.5], 4),
      rugs: makeItems(rand, 5, FIELD_LENGTH, 13, 26, [1.2, 2.2], 2),
      lamps: makeItems(rand, 4, FIELD_LENGTH, 15, 30, [1.2, 2.0], 1),
      tvs: makeItems(rand, 4, FIELD_LENGTH, 14, 30, [1.1, 1.8], 1),
      posters: makeItems(rand, 14, FAR_LENGTH, 55, 150, [1, 1.8], 6).map((it) => ({
        ...it,
        z: -range(rand, 200, FAR_LENGTH),
        rot: (it.x > 0 ? -1 : 1) * (Math.PI / 2) + (rand() - 0.5) * 0.4,
      })),
      bricks: makeItems(rand, 24, FIELD_LENGTH, 10.5, 36, [0.9, 2.0], 3),
      books: makeItems(rand, 14, FIELD_LENGTH, 12, 32, [1.0, 1.8], 2),
      bears: makeItems(rand, 6, FIELD_LENGTH, 14, 30, [1.6, 2.6], 1),
      balls: makeItems(rand, 8, FIELD_LENGTH, 12, 28, [0.9, 1.7], 3),
      furniture: makeItems(rand, 9, FAR_LENGTH, 60, 170, [1, 1.7], 3).map((it) => ({
        ...it,
        z: -range(rand, 250, FAR_LENGTH),
      })),
    }
  }, [stage])

  const curve = stage.curve ?? DEFAULT_CURVE
  const accent = stage.palette.accent

  return (
    <group>
      <ScrollField
        items={built.furniture}
        length={FAR_LENGTH}
        speedScale={0.16}
        render={(it) => (
          <Furniture variant={it.variant} tone={stage.palette.rock[it.variant % 4]} />
        )}
      />
      <ScrollField
        curve={curve}
        items={built.crayons}
        length={FIELD_LENGTH}
        render={(it) => <Crayon color={CRAYON_COLORS[it.variant]} />}
      />
      <ScrollField
        curve={curve}
        items={built.pencils}
        length={FIELD_LENGTH}
        render={(it) => (
          <Pencil body={it.variant === 0 ? undefined : CRAYON_COLORS[(it.id + it.variant) % CRAYON_COLORS.length]} />
        )}
      />
      <ScrollField
        curve={curve}
        items={built.rugs}
        length={FIELD_LENGTH}
        render={(it) => (
          <Rug a={it.variant === 0 ? '#3f6f9a' : '#4d8fa8'} b="#8fb8cc" />
        )}
      />
      <ScrollField
        curve={curve}
        items={built.lamps}
        length={FIELD_LENGTH}
        render={() => <Lamp />}
      />
      <ScrollField
        curve={curve}
        items={built.tvs}
        length={FIELD_LENGTH}
        render={() => <RetroTV />}
      />
      <ScrollField
        items={built.posters}
        length={FAR_LENGTH}
        speedScale={0.16}
        render={(it) => <Poster colors={CRAYON_COLORS} variant={it.variant} />}
      />
      <ScrollField
        curve={curve}
        items={built.bricks}
        length={FIELD_LENGTH}
        render={(it) => <ToyBrick color={accent[it.variant % accent.length]} />}
      />
      <ScrollField
        curve={curve}
        items={built.books}
        length={FIELD_LENGTH}
        render={(it) => <BookStack colors={CRAYON_COLORS} variant={it.variant + it.id} />}
      />
      <ScrollField
        curve={curve}
        items={built.bears}
        length={FIELD_LENGTH}
        render={(it) => <TeddyBear fur={it.id % 2 === 0 ? '#b07848' : '#8f5f38'} />}
      />
      <ScrollField
        curve={curve}
        items={built.balls}
        length={FIELD_LENGTH}
        render={(it) => (
          <RubberBall
            a={CRAYON_COLORS[it.variant]}
            b={CRAYON_COLORS[(it.variant + 3) % CRAYON_COLORS.length]}
          />
        )}
      />
      <ToyTrain />
    </group>
  )
}
