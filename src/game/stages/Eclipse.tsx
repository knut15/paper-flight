import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rt } from '../state'

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/**
 * 개기일식의 코로나. 검은 원 둘레에서 가느다란 빛줄기가 사방으로 뻗는다.
 * 색은 흑백만 쓴다.
 */
const FRAG = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uCore;   // 검은 원이 차지하는 반지름 비율
varying vec2 vUv;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) discard;
  float a = atan(p.y, p.x);

  // 굵기가 제각각인 빛줄기를 여러 겹 겹친다
  float s1 = sin(a * 17.0 + sin(a * 5.0 + uSeed) * 2.4 + uTime * 0.05);
  float s2 = sin(a * 41.0 - sin(a * 11.0 + uSeed * 2.0) * 1.6 - uTime * 0.03);
  float s3 = sin(a * 7.0 + uSeed * 3.0);
  float rays = 0.40 + 0.32 * s1 + 0.18 * s2 + 0.14 * s3;
  rays = pow(max(rays, 0.0), 1.5);

  // 코어 바로 바깥에서 가장 밝고 멀어질수록 급히 사라진다
  float inner = smoothstep(uCore - 0.012, uCore + 0.02, r);
  float fade = pow(max(1.0 - (r - uCore) / (1.0 - uCore), 0.0), 3.1);

  // 코어에 딱 붙은 얇고 균일한 테두리
  float rim = smoothstep(uCore + 0.05, uCore + 0.004, r) * inner;

  float alpha = inner * fade * (0.12 + rays * 0.9) + rim * 1.0;
  vec3 col = vec3(1.0) * (0.8 + rays * 0.55);
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`

/** 개기일식 한 기. 달에 가려진 검은 원과 그 둘레의 코로나. */
export function Eclipse({ seed = 0 }: { seed?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        fog: false,
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: seed },
          uCore: { value: 0.3 },
        },
      }),
    [seed],
  )

  useFrame(() => {
    material.uniforms.uTime.value = rt.time
  })

  return (
    <group>
      {/* 코로나 */}
      <mesh material={material} renderOrder={1}>
        <planeGeometry args={[10, 10]} />
      </mesh>
      {/* 가려진 원반 */}
      <mesh position={[0, 0, 0.02]} renderOrder={2}>
        <circleGeometry args={[1.5, 64]} />
        <meshBasicMaterial color="#000000" fog={false} />
      </mesh>
    </group>
  )
}
