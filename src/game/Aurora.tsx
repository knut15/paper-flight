import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rt } from './state'
import type { StageConfig } from './stages/types'

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAG = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uOpacity;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;

void main() {
  float x = vUv.x;
  float y = vUv.y;

  // 서로 다른 주기의 물결을 겹쳐 커튼 주름을 만든다
  float w1 = sin(x * 9.0 + uTime * 0.55 + uSeed) * 0.5 + 0.5;
  float w2 = sin(x * 21.0 - uTime * 0.9 + uSeed * 2.3) * 0.5 + 0.5;
  float w3 = sin(x * 3.5 + uTime * 0.3 - uSeed) * 0.5 + 0.5;
  float band = w1 * 0.5 + w2 * 0.25 + w3 * 0.25;
  // 주름을 날카롭게 세워 커튼 결이 드러나게 한다
  band = pow(band, 1.9);

  // 아래는 밝게, 위로 갈수록 흩어진다
  float vert = smoothstep(0.0, 0.12, y) * (1.0 - smoothstep(0.5, 1.0, y));
  // 좌우 끝을 부드럽게 자른다
  float edge = smoothstep(0.0, 0.12, x) * (1.0 - smoothstep(0.88, 1.0, x));

  float alpha = band * vert * edge * uOpacity;
  vec3 col = mix(uColorA, uColorB, clamp(y * 1.6 + band * 0.2, 0.0, 1.0));
  gl_FragColor = vec4(col * (0.8 + band * 1.1), alpha);
}
`

/** 하늘에 거는 오로라 커튼. stage.aurora 가 있을 때만 그린다. */
export function Aurora({ stage }: { stage: StageConfig }) {
  const cfg = stage.aurora
  const group = useRef<THREE.Group>(null!)

  const curtains = useMemo(() => {
    if (!cfg) return []
    const a = new THREE.Color(cfg.colors[0])
    const b = new THREE.Color(cfg.colors[1])
    const baseY = cfg.y ?? 88
    const baseZ = cfg.z ?? -700
    const spacing = cfg.spacing ?? 240
    return Array.from({ length: cfg.count }, (_, i) => {
      const material = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: i * 1.87 },
          uOpacity: { value: cfg.opacity * (1 - i * 0.12) },
          uColorA: { value: a },
          uColorB: { value: b },
        },
      })
      return {
        i,
        material,
        position: [(i - (cfg.count - 1) / 2) * spacing, baseY + (i % 2) * 30, baseZ - (i % 3) * 30] as [
          number,
          number,
          number,
        ],
        rotation: [0, (i % 2 === 0 ? 1 : -1) * 0.16, (i % 3) * 0.06] as [number, number, number],
        size: [430 + i * 60, 290] as [number, number],
      }
    })
  }, [cfg])

  useFrame(() => {
    for (const c of curtains) c.material.uniforms.uTime.value = rt.time
    if (group.current) group.current.position.x = Math.sin(rt.time * 0.05) * 6
  })

  if (!cfg) return null

  return (
    <group ref={group}>
      {/* renderOrder 2: 블랙홀의 어둠(0·1)보다 뒤에 그려져 어둠에 눌리지 않되,
          깊이 테스트로 사건의 지평선(불투명)에는 제대로 가려진다 */}
      {curtains.map((c) => (
        <mesh
          key={c.i}
          position={c.position}
          rotation={c.rotation}
          material={c.material}
          renderOrder={2}
        >
          <planeGeometry args={c.size} />
        </mesh>
      ))}
    </group>
  )
}
