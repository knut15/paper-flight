import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from './rng'
import { rt } from './state'
import { makeGlowTexture } from './textures'
import type { StageConfig } from './stages/types'

const RADIUS = 420

/**
 * 하늘 돔 안쪽에 박힌 별. 카메라를 따라다녀 언제나 같은 자리에 보이고,
 * 밝기만 미세하게 흔들려 반짝인다.
 */
export function StarField({ stage }: { stage: StageConfig }) {
  const cfg = stage.starfield
  const points = useRef<THREE.Points>(null!)
  const tex = useMemo(() => makeGlowTexture(), [])

  const geometry = useMemo(() => {
    if (!cfg) return null
    const rand = mulberry32(stage.seed + 313)
    const pos = new Float32Array(cfg.count * 3)
    for (let i = 0; i < cfg.count; i++) {
      // 지평선 아래는 버리고 위쪽 반구에만 뿌린다
      const theta = rand() * Math.PI * 2
      const phi = Math.acos(rand() * 0.92)
      const r = RADIUS * (0.75 + rand() * 0.25)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi)
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return geo
  }, [cfg, stage.seed])

  useFrame((state) => {
    if (!points.current) return
    points.current.position.copy(state.camera.position)
    points.current.rotation.y = rt.time * 0.004
    const m = points.current.material as THREE.PointsMaterial
    m.opacity = 0.72 + Math.sin(rt.time * 1.6) * 0.06
  })

  if (!cfg || !geometry) return null

  return (
    <points ref={points} geometry={geometry} frustumCulled={false} renderOrder={-8}>
      <pointsMaterial
        map={tex}
        color={cfg.color}
        size={2.4}
        sizeAttenuation
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
