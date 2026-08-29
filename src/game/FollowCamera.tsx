import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA_Z } from './constants'
import { rt } from './state'
import { curveX, DEFAULT_CURVE } from './track'
import type { StageConfig } from './stages/types'

const target = new THREE.Vector3()

/** 비행기 뒤를 따라가는 3인칭 카메라. 살짝 지연을 줘서 조작감이 붙는다. */
export function FollowCamera({ stage }: { stage: StageConfig }) {
  const { camera } = useThree()
  const curve = stage.curve ?? DEFAULT_CURVE
  const persp = camera as THREE.PerspectiveCamera

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const k = 1 - Math.pow(0.0015, dt)

    const shakeX = rt.shake * Math.sin(rt.time * 62) * 0.28
    const shakeY = rt.shake * Math.cos(rt.time * 71) * 0.22

    // 코스 중심을 화면 가운데에 두고, 플레이어의 코스 내 좌우 위치만 따라간다
    const center = curveX(rt.distance, curve)
    const targetX = center + (rt.x - center) * 0.62
    camera.position.x += (targetX + shakeX - camera.position.x) * k
    camera.position.y += (rt.y + 1.62 + shakeY - camera.position.y) * k
    // 무적 부스터에서는 카메라가 뒤로 더 물러나 화면이 넓어진다
    camera.position.z += (CAMERA_Z + (rt.power > 0 ? rt.boost * 3.4 : 0) - camera.position.z) * k

    // 30m 앞의 코스 중심을 바라본다. 커브에서 시선이 미리 돌아간다.
    const aheadCenter = curveX(rt.distance + 30, curve)
    // 상승 중엔 시선이 위로, 하강 중엔 아래로 쏠린다
    target.set(aheadCenter + (rt.x - center) * 0.32, rt.y + 2.25 + rt.vy * 0.55, -30)
    camera.lookAt(target)
    camera.rotation.z += -rt.roll * 0.8

    // 부스터를 밟으면 시야가 넓어진다. 무적 부스터에서는 확 줌아웃한다.
    const power = rt.power > 0 ? rt.boost : 0
    const targetFov = 62 + rt.boost * 9 + power * 22 + Math.max(0, rt.speed - 40) * 0.16
    if (Math.abs(persp.fov - targetFov) > 0.01) {
      persp.fov += (targetFov - persp.fov) * Math.min(1, dt * 6)
      persp.updateProjectionMatrix()
    }
  })

  return null
}
