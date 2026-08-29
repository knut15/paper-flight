import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * 종이비행기 다트 모양. 진행 방향은 -z 이고 카메라는 +z 에 있으므로
 * 화면에는 뒷날개와 아래 지느러미가 보인다.
 */
const N: [number, number, number] = [0, 0.02, -1.85] // 코
const C: [number, number, number] = [0, 0.1, 1.05] // 뒤 중앙(윗면)
const LI: [number, number, number] = [-0.36, 0.0, 1.12] // 왼쪽 접힘선
const RI: [number, number, number] = [0.36, 0.0, 1.12]
const LT: [number, number, number] = [-1.36, 0.34, 1.2] // 왼쪽 날개끝
const RT: [number, number, number] = [1.36, 0.34, 1.2]
const KB: [number, number, number] = [0, -0.5, 1.0] // 아래 지느러미 끝

function buildGeometry() {
  const tris: [number, number, number][][] = [
    [N, LT, LI], // 왼쪽 날개
    [N, LI, C], // 왼쪽 몸통 윗면
    [N, C, RI], // 오른쪽 몸통 윗면
    [N, RI, RT], // 오른쪽 날개
    [N, KB, LI], // 아래 지느러미 왼쪽
    [N, RI, KB], // 아래 지느러미 오른쪽
  ]
  const pos: number[] = []
  for (const t of tris) for (const v of t) pos.push(v[0], v[1], v[2])
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.computeVertexNormals()
  return geo
}

function buildCreases() {
  const segs: [number, number, number][][] = [
    [N, C],
    [N, LT],
    [N, RT],
    [LT, LI],
    [RT, RI],
    [LI, C],
    [RI, C],
    [N, KB],
  ]
  const pos: number[] = []
  for (const [a, b] of segs) pos.push(a[0], a[1], a[2], b[0], b[1], b[2])
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  return geo
}

export function PaperPlane({ tint = '#fff8ec' }: { tint?: string }) {
  const geo = useMemo(buildGeometry, [])
  const creases = useMemo(buildCreases, [])
  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial
          color={tint}
          side={THREE.DoubleSide}
          flatShading
          roughness={0.82}
          metalness={0}
        />
      </mesh>
      <lineSegments geometry={creases}>
        <lineBasicMaterial color="#c9b49a" transparent opacity={0.55} />
      </lineSegments>
    </group>
  )
}
