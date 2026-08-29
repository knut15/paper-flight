import { useMemo } from 'react'
import * as THREE from 'three'
import { makeGlowTexture } from './textures'
import type { StageConfig } from './stages/types'

const VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vDir = normalize(world.xyz - cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const FRAG = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uBottom;
uniform vec3 uStripeColor;
uniform float uStripeOpacity;
uniform float uStripeCount;
varying vec3 vDir;
void main() {
  float h = vDir.y;
  vec3 c = mix(uBottom, uMid, smoothstep(-0.18, 0.16, h));
  c = mix(c, uTop, smoothstep(0.12, 0.7, h));
  // 벽지 스트라이프 — 지평선 부근 벽 높이에만 연하게 깔린다
  if (uStripeOpacity > 0.0) {
    float az = atan(vDir.x, vDir.z);
    float sv = smoothstep(0.35, 0.65, 0.5 + 0.5 * sin(az * uStripeCount));
    float band = smoothstep(-0.1, 0.03, h) * (1.0 - smoothstep(0.34, 0.68, h));
    c = mix(c, uStripeColor, sv * band * uStripeOpacity);
  }
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}
`

/** 하늘 돔 + 태양. 스테이지 색만 바꾸면 다른 행성이 된다. */
export function Sky({ stage }: { stage: StageConfig }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color(stage.sky.top) },
          uMid: { value: new THREE.Color(stage.sky.mid) },
          uBottom: { value: new THREE.Color(stage.sky.bottom) },
          uStripeColor: { value: new THREE.Color(stage.wallStripe?.color ?? '#ffffff') },
          uStripeOpacity: { value: stage.wallStripe?.opacity ?? 0 },
          uStripeCount: { value: stage.wallStripe?.count ?? 120 },
        },
      }),
    [stage],
  )

  const glow = useMemo(() => makeGlowTexture(), [])
  const [sx, sy, sz] = stage.sun.position

  return (
    <group>
      <mesh material={material} frustumCulled={false} renderOrder={-10}>
        <sphereGeometry args={[600, 32, 20]} />
      </mesh>

      {/* 태양 본체와 헤일로 — size 0 이면 그리지 않는다 */}
      <group position={[sx, sy, sz]} visible={stage.sun.size > 0}>
        <mesh>
          <circleGeometry args={[stage.sun.size, 48]} />
          <meshBasicMaterial color={stage.sun.color} transparent opacity={0.95} depthWrite={false} fog={false} />
        </mesh>
        <mesh position={[0, 0, -1]}>
          <planeGeometry args={[stage.sun.size * 6.5, stage.sun.size * 6.5]} />
          <meshBasicMaterial
            map={glow}
            color={stage.sun.color}
            transparent
            opacity={0.33}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </mesh>
      </group>
    </group>
  )
}
