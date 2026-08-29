import type { CurveConfig } from '../track'

/** 스테이지 한 개를 값으로만 기술한다. 새 스테이지는 이 타입을 채워 stages 배열에 넣으면 된다. */
export type StageBiome =
  | 'desert'
  | 'arctic'
  | 'space'
  | 'lava'
  | 'canyon'
  | 'ocean'
  | 'sky'
  | 'room'
  | 'cave'
  | 'city'
  | 'park'

export type StageConfig = {
  id: number
  /** 화면에 표시되는 이름 */
  title: string
  subtitle: string
  biome: StageBiome
  /** 클리어까지 날아야 하는 거리(m) */
  goal: number
  seed: number
  sky: { top: string; mid: string; bottom: string }
  fog: { color: string; near: number; far: number }
  sun: { color: string; position: [number, number, number]; size: number; intensity: number }
  ambient: { color: string; intensity: number }
  ground: {
    /** 모래/얼음 등 바닥 바탕색 */
    base: string
    /** 잔결 무늬 색 */
    ripple: string
    /** 가운데 길 색 */
    road: string
    /** 길 위 발광 라인 색 */
    roadGlow: string
  }
  /** 소품 색 팔레트 */
  palette: {
    rock: string[]
    accent: string[]
    crystal: string
  }
  /** HUD 하단 그라데이션 등에 쓰는 대표색 */
  uiAccent: string
  /** 타이틀 화면에 띄우는 한 줄 소개 */
  intro: string
  /** 하늘에 거는 오로라 커튼. 없으면 안 그린다. y/z/spacing 으로 배치를 조절한다. */
  aurora?: {
    colors: [string, string]
    count: number
    opacity: number
    y?: number
    z?: number
    spacing?: number
  }
  /** 화면에 흩날리는 입자. 'snow' 는 눈, 'ember' 는 불티, 'dust' 는 성간 먼지. */
  weather?: 'snow' | 'ember' | 'dust' | 'bubble' | 'mote'
  /** 바닥 무늬 종류. 기본은 잔결('grain'). */
  groundTexture?:
    | 'grain'
    | 'nebula'
    | 'lava'
    | 'caustics'
    | 'wood'
    | 'clouddeck'
    | 'city'
  | 'park'
    | 'cityday'
  /** 하늘에 박히는 별. 없으면 안 그린다. */
  starfield?: { count: number; color: string }
  /** 지면 높이. 내리면(음수) 고공 비행 느낌이 난다. */
  groundY?: number
  /** true 면 가운데 길(물길/트랙)을 그리지 않는다 — 탁 트인 하늘용. */
  hideRoad?: boolean
  /** 벽지(하늘 돔)의 연한 세로 스트라이프. 실내 스테이지용. */
  wallStripe?: { color: string; count: number; opacity: number }
  /** 코스가 휘는 정도. 생략하면 DEFAULT_CURVE 를 쓴다. */
  curve?: CurveConfig
  /** 장애물 발광색. 배경과 장애물이 헷갈리는 스테이지에서 켠다. */
  obstacleGlow?: string
}
