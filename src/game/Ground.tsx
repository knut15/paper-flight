import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rt } from './state'
import { DEFAULT_CURVE } from './track'
import {
  makeCausticsTexture,
  makeCityTexture,
  makeCloudDeckTexture,
  makeGroundTexture,
  makeLavaTexture,
  makeNebulaTexture,
  makeRoadTexture,
  makeWoodTexture,
} from './textures'
import type { StageConfig } from './stages/types'

const GROUND_SIZE = 900
const GROUND_TILE = 26 // 텍스처 한 장이 덮는 월드 길이
const ROAD_WIDTH = 19
const ROAD_TILE = 34
const MESH_Z = -GROUND_SIZE / 2 + 60

/**
 * 길을 코스 곡선대로 휘게 만드는 정점 변형.
 * 평면은 -90° 로 눕혀 두므로 로컬 y 가 월드 z 에 대응한다.
 */
function bend(
  material: THREE.Material,
  uDist: { value: number },
  uCurve: { value: THREE.Vector4 },
  key: string,
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDist = uDist
    shader.uniforms.uCurve = uCurve
    shader.vertexShader =
      'uniform float uDist;\nuniform vec4 uCurve;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float worldZ = -transformed.y + ${MESH_Z.toFixed(1)};
         float s = uDist - worldZ;
         transformed.x += sin(s / uCurve.y) * uCurve.x + sin(s / uCurve.w + 1.7) * uCurve.z;`,
      )
  }
  material.customProgramCacheKey = () => key
}

/** 바닥과 가운데 길. 텍스처 offset 으로 흘리고, 길은 코스 곡선대로 휜다. */
export function Ground({ stage }: { stage: StageConfig }) {
  const groundY = stage.groundY ?? 0
  // 고공 스테이지는 지면 무늬가 크게 보여야 아득한 느낌이 난다
  const groundTile = stage.groundTexture === 'clouddeck' ? 120 : GROUND_TILE
  const groundTex = useMemo(
    () =>
      stage.groundTexture === 'nebula'
        ? makeNebulaTexture(stage.ground.base, stage.ground.ripple, stage.seed)
        : stage.groundTexture === 'lava'
          ? makeLavaTexture(stage.ground.base, stage.ground.ripple, stage.seed)
          : stage.groundTexture === 'caustics'
            ? makeCausticsTexture(stage.ground.base, stage.ground.ripple, stage.seed)
            : stage.groundTexture === 'wood'
              ? makeWoodTexture(stage.ground.base, stage.ground.ripple, stage.seed)
              : stage.groundTexture === 'clouddeck'
                ? makeCloudDeckTexture(stage.ground.base, stage.ground.ripple, stage.seed)
                : stage.groundTexture === 'city' || stage.groundTexture === 'cityday'
                  ? makeCityTexture(
                      stage.ground.base,
                      stage.ground.ripple,
                      stage.seed,
                      stage.groundTexture === 'cityday',
                    )
                  : makeGroundTexture(stage.ground.base, stage.ground.ripple, stage.seed),
    [stage],
  )
  const roadTex = useMemo(
    () => makeRoadTexture(stage.ground.road, stage.ground.roadGlow, stage.seed + 3),
    [stage],
  )

  const curve = stage.curve ?? DEFAULT_CURVE
  const uDist = useMemo(() => ({ value: 0 }), [])
  const uCurve = useMemo(
    () => ({ value: new THREE.Vector4(curve.amp1, curve.len1, curve.amp2, curve.len2) }),
    [curve],
  )

  const roadMat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ map: roadTex, transparent: true, depthWrite: false })
    bend(m, uDist, uCurve, 'road')
    return m
  }, [roadTex, uDist, uCurve])

  const glowMat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color(stage.ground.roadGlow),
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    bend(m, uDist, uCurve, 'roadglow')
    return m
  }, [stage.ground.roadGlow, uDist, uCurve])

  useEffect(() => {
    groundTex.repeat.set(GROUND_SIZE / groundTile, GROUND_SIZE / groundTile)
    roadTex.repeat.set(1, GROUND_SIZE / ROAD_TILE)
    return () => {
      groundTex.dispose()
      roadTex.dispose()
      roadMat.dispose()
      glowMat.dispose()
    }
  }, [groundTex, roadTex, roadMat, glowMat, groundTile])

  useFrame((_, delta) => {
    uDist.value = rt.distance
    glowMat.opacity = 0.22 + Math.sin(rt.time * 2.2) * 0.06
    if (!rt.running) return
    const dt = Math.min(delta, 0.05)
    const d = rt.speed * dt
    // 평면이 -90° 로 누워 있어 텍스처 v 축이 화면 안쪽(-z)을 향한다.
    // 무늬가 카메라 쪽으로 흘러오려면 offset 을 더해야 한다.
    groundTex.offset.y += d / groundTile
    roadTex.offset.y += d / ROAD_TILE
  })

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY, MESH_Z]}>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
        <meshStandardMaterial map={groundTex} roughness={1} metalness={0} />
      </mesh>

      {!stage.hideRoad && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, MESH_Z]} material={roadMat}>
          <planeGeometry args={[ROAD_WIDTH, GROUND_SIZE, 2, 280]} />
        </mesh>
      )}

      {/* 길 위에 얇게 깔린 발광 */}
      {!stage.hideRoad && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, MESH_Z]} material={glowMat}>
          <planeGeometry args={[ROAD_WIDTH * 0.92, GROUND_SIZE, 2, 280]} />
        </mesh>
      )}
    </group>
  )
}
