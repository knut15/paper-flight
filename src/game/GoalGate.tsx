import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rt } from './state'
import { curveX, DEFAULT_CURVE } from './track'
import type { StageConfig } from './stages/types'

/** 결승 게이트. 남은 거리만큼 앞에 세워 두고 도착하면 스테이지가 끝난다. */
export function GoalGate({ stage }: { stage: StageConfig }) {
  const root = useRef<THREE.Group>(null!)

  useFrame(() => {
    const remain = stage.goal - rt.distance
    root.current.position.z = -remain
    root.current.position.x = curveX(stage.goal, stage.curve ?? DEFAULT_CURVE)
    root.current.visible = remain < 420 && remain > -30
    root.current.rotation.z = Math.sin(rt.time * 0.8) * 0.04
  })

  return (
    <group ref={root}>
      <mesh position={[0, 5.6, 0]}>
        <torusGeometry args={[6.2, 0.42, 10, 32]} />
        <meshStandardMaterial
          color={stage.ground.roadGlow}
          emissive={stage.ground.roadGlow}
          emissiveIntensity={1.2}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 5.6, 0]}>
        <circleGeometry args={[6, 32]} />
        <meshBasicMaterial
          color={stage.ground.roadGlow}
          transparent
          opacity={0.14}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {[-6.2, 6.2].map((x) => (
        <mesh key={x} position={[x, 2.8, 0]}>
          <cylinderGeometry args={[0.5, 0.8, 5.6, 6]} />
          <meshStandardMaterial color={stage.palette.rock[1]} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  )
}
