import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA_Y, CAMERA_Z } from './constants'
import { Aurora } from './Aurora'
import { Collectibles } from './Collectibles'
import { FollowCamera } from './FollowCamera'
import { GameLoop } from './GameLoop'
import { GoalGate } from './GoalGate'
import { Ground } from './Ground'
import { Obstacles } from './Obstacles'
import { Player } from './Player'
import { PowerStars } from './PowerStars'
import { Sky } from './Sky'
import { StarField } from './StarField'
import { Weather } from './Weather'
import { ArcticScenery } from './stages/ArcticScenery'
import { CanyonScenery } from './stages/CanyonScenery'
import { CaveScenery } from './stages/CaveScenery'
import { CityScenery } from './stages/CityScenery'
import { DesertScenery } from './stages/DesertScenery'
import { LavaScenery } from './stages/LavaScenery'
import { OceanScenery } from './stages/OceanScenery'
import { ParkScenery } from './stages/ParkScenery'
import { RoomScenery } from './stages/RoomScenery'
import { SkyScenery } from './stages/SkyScenery'
import { SpaceScenery } from './stages/SpaceScenery'
import type { StageConfig } from './stages/types'

/** biome 별 배경. 스테이지가 늘어나면 여기에 분기를 추가한다. */
function Scenery({ stage }: { stage: StageConfig }) {
  switch (stage.biome) {
    case 'desert':
      return <DesertScenery stage={stage} />
    case 'arctic':
      return <ArcticScenery stage={stage} />
    case 'space':
      return <SpaceScenery stage={stage} />
    case 'lava':
      return <LavaScenery stage={stage} />
    case 'canyon':
      return <CanyonScenery stage={stage} />
    case 'ocean':
      return <OceanScenery stage={stage} />
    case 'sky':
      return <SkyScenery stage={stage} />
    case 'room':
      return <RoomScenery stage={stage} />
    case 'cave':
      return <CaveScenery stage={stage} />
    case 'city':
      return <CityScenery stage={stage} />
    case 'park':
      return <ParkScenery stage={stage} />
  }
}

export function Scene({ stage }: { stage: StageConfig }) {
  const [sx, sy, sz] = stage.sun.position

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 62, near: 0.1, far: 1400, position: [0, CAMERA_Y, CAMERA_Z] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
    >
      <fog attach="fog" args={[stage.fog.color, stage.fog.near, stage.fog.far]} />

      <GameLoop stage={stage} />
      <FollowCamera stage={stage} />

      <ambientLight color={stage.ambient.color} intensity={stage.ambient.intensity} />
      <hemisphereLight
        color={stage.sky.mid}
        groundColor={stage.ground.base}
        intensity={0.65}
      />
      <directionalLight
        color={stage.sun.color}
        intensity={stage.sun.intensity}
        position={[sx * 0.06, sy * 0.4, sz * 0.06]}
      />

      <Sky stage={stage} />
      <StarField stage={stage} />
      <Aurora stage={stage} />
      <Ground stage={stage} />
      <Scenery stage={stage} />
      <Collectibles stage={stage} />
      <PowerStars stage={stage} />
      <Obstacles stage={stage} />
      <GoalGate stage={stage} />
      <Weather stage={stage} />
      <Player stage={stage} />
    </Canvas>
  )
}
