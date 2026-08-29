import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rt } from '../state'

/** 사건의 지평선 반지름. 나머지 치수는 전부 여기에 비례한다. */
const R = 4.6

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/**
 * 강착 원반과 중력 렌즈 고리를 함께 그리는 셰이더.
 * 링을 여러 겹 겹치지 않고 반지름 방향으로 연속해서 밝기가 변한다.
 * uInner  : 안쪽 반지름 / 바깥 반지름
 * uHeat   : 안쪽이 타오르는 정도 (클수록 안쪽만 밝다)
 * uBeam   : 도플러 비밍 세기 (한쪽이 밝아진다)
 * uStreak : 흐르는 결의 세기
 */
const FRAG = /* glsl */ `
uniform float uTime;
uniform float uInner;
uniform float uHeat;
uniform float uBeam;
uniform float uStreak;
uniform float uSpin;
uniform float uGain;
varying vec2 vUv;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0 || r < uInner) discard;

  float ang = atan(p.y, p.x);
  // 안쪽 0, 바깥 1
  float rr = (r - uInner) / (1.0 - uInner);

  // 안쪽으로 갈수록 빨리 도는 결
  float flow = ang + uTime * uSpin / (0.25 + rr * 1.6);
  float st =
    0.62 +
    0.22 * sin(flow * 6.0 + rr * 3.0) +
    0.10 * sin(flow * 13.0 - rr * 1.6) +
    0.06 * sin(flow * 29.0 + rr * 2.4);
  st = mix(1.0, st, uStreak);

  // 안쪽 가장자리가 가장 뜨겁고 바깥으로 급히 식는다
  float heat = pow(max(1.0 - rr, 0.0), uHeat);
  // 안팎 경계를 부드럽게 자른다
  float edge = smoothstep(0.0, 0.035, rr) * smoothstep(1.0, 0.82, rr);

  // 도플러 비밍 — 다가오는 쪽이 밝다
  float beam = mix(1.0, 0.35 + 0.65 * (0.5 + 0.5 * sin(ang + 1.2)), uBeam);

  float a = heat * edge * st * beam * uGain;

  // 흰 → 금 → 어두운 구리
  vec3 col = mix(vec3(1.0, 0.99, 0.96), vec3(0.98, 0.82, 0.52), smoothstep(0.0, 0.28, rr));
  col = mix(col, vec3(0.72, 0.47, 0.20), smoothstep(0.22, 0.7, rr));
  col = mix(col, vec3(0.32, 0.19, 0.07), smoothstep(0.65, 1.0, rr));

  gl_FragColor = vec4(col * (0.85 + st * 0.45), clamp(a, 0.0, 1.0));
}
`

type DiskUniforms = {
  inner: number
  heat: number
  beam: number
  streak: number
  spin: number
  gain: number
}

function makeDiskMaterial(u: DiskUniforms) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uInner: { value: u.inner },
      uHeat: { value: u.heat },
      uBeam: { value: u.beam },
      uStreak: { value: u.streak },
      uSpin: { value: u.spin },
      uGain: { value: u.gain },
    },
  })
}

/** 바깥에서 안쪽으로 감겨 들어가는 가스 줄기 */
function makeSpiral(startR: number, turns: number, wobble: number, phase: number) {
  const pts: THREE.Vector3[] = []
  const steps = 72
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const r = startR * (1 - t * 0.78)
    const a = phase + t * Math.PI * 2 * turns
    pts.push(
      new THREE.Vector3(
        Math.cos(a) * r,
        Math.sin(a) * r,
        Math.sin(a * 2.3 + phase) * wobble * (1 - t),
      ),
    )
  }
  return new THREE.CatmullRomCurve3(pts)
}

const SPIRALS = [
  { startR: R * 4.2, turns: 1.15, wobble: R * 0.2, phase: 0.0, radius: R * 0.016, opacity: 0.3 },
  { startR: R * 4.9, turns: 1.5, wobble: R * 0.28, phase: 2.1, radius: R * 0.012, opacity: 0.24 },
  { startR: R * 3.6, turns: 0.95, wobble: R * 0.14, phase: 4.0, radius: R * 0.02, opacity: 0.28 },
  { startR: R * 5.5, turns: 1.85, wobble: R * 0.34, phase: 5.4, radius: R * 0.01, opacity: 0.18 },
]

/**
 * 블랙홀. 완전히 검은 사건의 지평선, 거의 옆에서 보는 강착 원반,
 * 중력 렌즈로 구 위아래로 감겨 올라온 고리, 그리고 더 멀리 맺힌 두 번째 상.
 */
export function BlackHole() {
  const swirl = useRef<THREE.Group>(null!)
  const disk = useMemo(
    () => makeDiskMaterial({ inner: 0.3, heat: 1.85, beam: 0.6, streak: 0.85, spin: 0.62, gain: 1 }),
    [],
  )
  const lens = useMemo(
    () => makeDiskMaterial({ inner: 0.66, heat: 3.4, beam: 0.25, streak: 0.5, spin: 0.18, gain: 1 }),
    [],
  )
  const echo = useMemo(
    () => makeDiskMaterial({ inner: 0.9, heat: 4.5, beam: 0.4, streak: 0.35, spin: 0.1, gain: 0.55 }),
    [],
  )

  const shadow = useMemo(() => {
    const size = 128
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.18, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(0,0,0,0.98)')
    g.addColorStop(0.55, 'rgba(0,0,0,0.6)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  useFrame(() => {
    const t = rt.time
    disk.uniforms.uTime.value = t
    lens.uniforms.uTime.value = t
    echo.uniforms.uTime.value = t
    // 살아 있는 것처럼 느리게 뛰는 밝기
    const pulse = 1 + Math.sin(t * 0.53) * 0.11 + Math.sin(t * 1.31) * 0.05
    disk.uniforms.uGain.value = pulse
    lens.uniforms.uGain.value = pulse
    if (swirl.current) swirl.current.rotation.z = -t * 0.16
  })

  return (
    <group>
      {/* 주변 별빛을 삼키는 어둠. 넓게 한 겹, 가깝게 한 겹. */}
      <mesh renderOrder={0} position={[0, 0, -0.4]}>
        <planeGeometry args={[R * 24, R * 24]} />
        <meshBasicMaterial map={shadow} transparent opacity={0.7} depthWrite={false} fog={false} />
      </mesh>
      <mesh renderOrder={1}>
        <planeGeometry args={[R * 12, R * 12]} />
        <meshBasicMaterial map={shadow} transparent opacity={0.95} depthWrite={false} fog={false} />
      </mesh>

      {/* 멀리 한 번 더 맺힌 상 */}
      <mesh material={echo} renderOrder={2} rotation={[0, 0, 0.35]}>
        <ringGeometry args={[R * 2.7, R * 3.0, 160, 1]} />
      </mesh>

      {/* 강착 원반 — 거의 옆에서 본다 */}
      <mesh material={disk} renderOrder={3} rotation={[Math.PI / 2 - 0.26, 0, 0.52]}>
        <ringGeometry args={[R * 1.32, R * 4.4, 200, 1]} />
      </mesh>

      {/* 빨려 들어가는 가스 줄기 */}
      <group ref={swirl} renderOrder={3} rotation={[Math.PI / 2 - 0.26, 0, 0.52]}>
        {SPIRALS.map((sp, i) => (
          <mesh key={i}>
            <tubeGeometry args={[makeSpiral(sp.startR, sp.turns, sp.wobble, sp.phase), 96, sp.radius, 6, false]} />
            <meshBasicMaterial
              color="#ffdfae"
              transparent
              opacity={sp.opacity}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              fog={false}
            />
          </mesh>
        ))}
      </group>

      {/* 사건의 지평선 */}
      <mesh renderOrder={4}>
        <sphereGeometry args={[R, 48, 32]} />
        <meshBasicMaterial color="#000000" fog={false} />
      </mesh>

      {/* 중력 렌즈로 구를 감싸 올라온 고리 */}
      <mesh material={lens} renderOrder={5}>
        <ringGeometry args={[R * 1.02, R * 1.55, 200, 1]} />
      </mesh>

      {/* 광자 고리 */}
      <mesh renderOrder={6}>
        <ringGeometry args={[R * 1.005, R * 1.035, 160, 1]} />
        <meshBasicMaterial
          color="#fffdf6"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>
    </group>
  )
}
