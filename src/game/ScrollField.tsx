import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA_Z } from './constants'
import { rt } from './state'
import { curveAt, type CurveConfig } from './track'

export type FieldItem = {
  id: number
  x: number
  y: number
  z: number
  scale: number
  rot: number
  variant: number
}

/**
 * 아이템을 +z 로 흘려보내고 카메라를 지나가면 뒤로 되감는다.
 * 배경 소품은 전부 이걸로 무한 스크롤한다.
 */
export function ScrollField({
  items,
  length,
  render,
  spin = 0,
  speedScale = 1,
  curve,
}: {
  items: FieldItem[]
  length: number
  render: (item: FieldItem) => ReactNode
  /** 0 이 아니면 매 프레임 y 축으로 회전시킨다 */
  spin?: number
  /** 1 보다 작으면 느리게 흘러 원경 시차가 생긴다 */
  speedScale?: number
  /** 코스 곡선. 주면 소품이 길을 따라 좌우로 휜다. 원경은 생략한다. */
  curve?: CurveConfig
}) {
  const group = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    if (!rt.running) {
      // 멈춰 있어도 커브 위치는 맞춰 둔다 (타이틀/일시정지 화면)
      if (curve) {
        const children = group.current.children
        for (let i = 0; i < children.length; i++) {
          children[i].position.x = items[i].x + curveAt(rt.distance, children[i].position.z, curve)
        }
      }
      return
    }
    const dt = Math.min(delta, 0.05)
    const d = rt.speed * dt * speedScale
    const children = group.current.children
    for (let i = 0; i < children.length; i++) {
      const c = children[i]
      c.position.z += d
      if (c.position.z > CAMERA_Z + 40) c.position.z -= length
      if (spin) c.rotation.y += spin * dt
      if (curve) c.position.x = items[i].x + curveAt(rt.distance, c.position.z, curve)
    }
  })

  return (
    <group ref={group}>
      {items.map((it) => (
        <group key={it.id} position={[it.x, it.y, it.z]} rotation={[0, it.rot, 0]} scale={it.scale}>
          {render(it)}
        </group>
      ))}
    </group>
  )
}
