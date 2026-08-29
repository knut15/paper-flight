import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rt } from './state'

/**
 * 미니미 캐릭터. 종이비행기 위에 앉아 있고 화면에는 뒤통수가 보인다.
 * 뒤통수임을 알리는 단서: 머리 뒤로 묶은 머리칼, 고글 스트랩, 뒤로 날리는 목도리.
 */
export function Minimi({
  body = '#ffb3c8',
  cloth = '#7ef0ff',
  hair = '#6b4430',
}: {
  body?: string
  cloth?: string
  hair?: string
}) {
  const root = useRef<THREE.Group>(null!)
  const scarf = useRef<THREE.Group>(null!)

  useFrame(() => {
    const t = rt.time
    // 바람 맞는 느낌으로 살짝 흔들린다
    root.current.rotation.z = Math.sin(t * 2.1) * 0.05 - rt.roll * 0.35
    root.current.rotation.x = Math.sin(t * 1.4) * 0.03
    root.current.position.y = 0.07 + Math.sin(t * 3.1) * 0.012

    const s = scarf.current
    for (let i = 0; i < s.children.length; i++) {
      const c = s.children[i]
      const phase = t * 7 - i * 0.7
      c.position.x = Math.sin(phase) * (0.06 + i * 0.05) - rt.vx * 0.012
      c.position.y = 0.5 + Math.sin(phase * 0.8) * 0.035 - i * 0.03
      c.rotation.z = Math.sin(phase) * 0.35
    }
  })

  return (
    <group ref={root} position={[0, 0.07, 0.2]} scale={0.35}>
      {/* 몸통 겸 머리 — 동글동글한 실루엣 */}
      <mesh position={[0, 0.46, 0]}>
        <sphereGeometry args={[0.42, 28, 22]} />
        <meshStandardMaterial color={body} roughness={0.62} />
      </mesh>

      {/* 머리칼 — 정수리만 덮어 분홍 뒤통수가 드러나게 한다 */}
      <mesh position={[0, 0.47, 0.02]} rotation={[0.22, 0, 0]}>
        <sphereGeometry args={[0.437, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
        <meshStandardMaterial color={hair} roughness={0.85} />
      </mesh>
      {/* 뒤로 묶은 머리 */}
      <mesh position={[0, 0.6, 0.34]} rotation={[1.05, 0, 0]}>
        <capsuleGeometry args={[0.085, 0.26, 6, 12]} />
        <meshStandardMaterial color={hair} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.66, 0.24]}>
        <torusGeometry args={[0.09, 0.028, 6, 14]} />
        <meshStandardMaterial color="#e2596b" roughness={0.6} />
      </mesh>

      {/* 고글 스트랩 — 뒤통수를 가로지른다 */}
      <mesh position={[0, 0.42, 0.04]} rotation={[0.12, 0, 0]}>
        <torusGeometry args={[0.425, 0.026, 8, 30, Math.PI * 0.9]} />
        <meshStandardMaterial color="#2f3550" roughness={0.5} />
      </mesh>

      {/* 팔 — 비행기 앞쪽을 붙잡고 있다 */}
      <mesh position={[-0.36, 0.34, -0.14]} rotation={[0.5, 0, 0.4]}>
        <capsuleGeometry args={[0.085, 0.3, 6, 10]} />
        <meshStandardMaterial color={body} roughness={0.62} />
      </mesh>
      <mesh position={[0.36, 0.34, -0.14]} rotation={[0.5, 0, -0.4]}>
        <capsuleGeometry args={[0.085, 0.3, 6, 10]} />
        <meshStandardMaterial color={body} roughness={0.62} />
      </mesh>

      {/* 발 */}
      <mesh position={[-0.19, 0.06, -0.12]} rotation={[0, 0.2, 0]} scale={[1, 0.62, 1.5]}>
        <sphereGeometry args={[0.15, 14, 12]} />
        <meshStandardMaterial color="#e2596b" roughness={0.55} />
      </mesh>
      <mesh position={[0.19, 0.06, -0.12]} rotation={[0, -0.2, 0]} scale={[1, 0.62, 1.5]}>
        <sphereGeometry args={[0.15, 14, 12]} />
        <meshStandardMaterial color="#e2596b" roughness={0.55} />
      </mesh>

      {/* 목도리 — 뒤로 길게 날린다 */}
      <mesh position={[0, 0.24, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.075, 8, 20]} />
        <meshStandardMaterial color={cloth} roughness={0.7} />
      </mesh>
      <group ref={scarf}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.5, 0.56 + i * 0.32]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.17 - i * 0.03, 0.045, 0.3]} />
            <meshStandardMaterial color={cloth} roughness={0.75} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
