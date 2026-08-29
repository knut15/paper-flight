import type { StageConfig } from './types'

/** Stage 1 — 사막. 새벽빛이 남은 붉은 사막과 말라붙은 강바닥 위를 난다. */
export const STAGE_1_DESERT: StageConfig = {
  id: 1,
  title: 'STAGE 1',
  subtitle: '마른 강의 사막',
  biome: 'desert',
  goal: 2200,
  seed: 20260824,
  sky: { top: '#2b2a6e', mid: '#a35a86', bottom: '#f0a26a' },
  fog: { color: '#e0956d', near: 60, far: 320 },
  sun: { color: '#ffd9a0', position: [-38, 26, -240], size: 26, intensity: 2.1 },
  ambient: { color: '#ffb589', intensity: 1.15 },
  ground: {
    base: '#d9975a',
    ripple: '#b9713f',
    road: '#3f6f8f',
    roadGlow: '#7ef0ff',
  },
  palette: {
    rock: ['#b06843', '#8f4f39', '#c98357', '#7c4636'],
    accent: ['#4fb9a6', '#e3d178', '#d9695f'],
    crystal: '#8ff2ff',
  },
  uiAccent: '#ffb46b',
  curve: { amp1: 6, len1: 260, amp2: 2.4, len2: 104 },
  intro: '미니미를 태운 종이비행기가 마른 강의 사막 위를 난다. 별을 모으고 바위를 피해 결승 게이트까지.',
}

/** Stage 2 — 북극. 오로라가 걸린 밤하늘 아래 얼어붙은 강을 따라 난다. */
export const STAGE_2_ARCTIC: StageConfig = {
  id: 2,
  title: 'STAGE 2',
  subtitle: '오로라의 빙원',
  biome: 'arctic',
  goal: 2200,
  seed: 19981225,
  sky: { top: '#101f4a', mid: '#27578a', bottom: '#b6dfee' },
  fog: { color: '#9fc8dc', near: 70, far: 340 },
  sun: { color: '#e6f6ff', position: [42, 18, -250], size: 18, intensity: 1.35 },
  ambient: { color: '#bcd8f2', intensity: 1.35 },
  ground: {
    base: '#e6f1f8',
    ripple: '#a9c8dc',
    road: '#2f7fae',
    roadGlow: '#a8f2ff',
  },
  palette: {
    rock: ['#bcdcec', '#93bdd6', '#dceff8', '#6fa3c2'],
    accent: ['#3f7d6a', '#cfeaff', '#7fd8e8'],
    crystal: '#e2fbff',
  },
  uiAccent: '#8fe3ff',
  intro: '얼어붙은 강 위로 오로라가 흐른다. 눈보라와 빙탑을 피해 빙원 끝의 게이트까지.',
  aurora: { colors: ['#4cffb0', '#8f6bff'], count: 4, opacity: 0.85 },
  weather: 'snow',
  curve: { amp1: 7.5, len1: 215, amp2: 3.2, len2: 88 },
}

/** Stage 3 — 우주. 성운 원반 위로 뻗은 에너지 항로를 난다. */
export const STAGE_3_SPACE: StageConfig = {
  id: 3,
  title: 'STAGE 3',
  subtitle: '성운의 항로',
  biome: 'space',
  goal: 2200,
  seed: 20770401,
  sky: { top: '#04030f', mid: '#170a38', bottom: '#3a1355' },
  fog: { color: '#2a1050', near: 80, far: 400 },
  sun: { color: '#ffe3f6', position: [46, 24, -260], size: 13, intensity: 1.25 },
  ambient: { color: '#9a86e0', intensity: 1.05 },
  ground: {
    base: '#1c1140',
    ripple: '#9b45d6',
    road: '#2b2a7a',
    roadGlow: '#c896ff',
  },
  palette: {
    rock: ['#4d3a80', '#6a4fa3', '#382a63', '#8a6fd0'],
    accent: ['#ff6bd6', '#7cf5ff', '#ffd166'],
    crystal: '#c896ff',
  },
  uiAccent: '#c896ff',
  intro: '성운 원반 위로 에너지 항로가 뻗어 있다. 소행성과 결정 기둥을 피해 항로 끝까지.',
  aurora: { colors: ['#ff4838', '#ff8a30'], count: 7, opacity: 1, y: 96, z: -700, spacing: 220 },
  weather: 'dust',
  groundTexture: 'nebula',
  starfield: { count: 900, color: '#e8dcff' },
  curve: { amp1: 8.5, len1: 190, amp2: 3.8, len2: 79 },
}

/** Stage 4 — 불구덩이. 검게 굳은 용암 벌판, 갈라진 균열 위로 불티가 오른다. */
export const STAGE_4_LAVA: StageConfig = {
  id: 4,
  title: 'STAGE 4',
  subtitle: '타오르는 불구덩이',
  biome: 'lava',
  goal: 2200,
  seed: 66610923,
  sky: { top: '#170305', mid: '#571410', bottom: '#c33f14' },
  fog: { color: '#8a2410', near: 55, far: 300 },
  sun: { color: '#ffb36b', position: [0, 14, -260], size: 30, intensity: 1.6 },
  ambient: { color: '#ff7a4d', intensity: 1.05 },
  ground: {
    base: '#241312',
    ripple: '#ff5a1f',
    road: '#3a1c14',
    roadGlow: '#ffb054',
  },
  palette: {
    rock: ['#3a2320', '#552e24', '#241312', '#6d3a26'],
    accent: ['#ff7a30', '#ffd166', '#e8452a'],
    crystal: '#ffb054',
  },
  uiAccent: '#ff8a4d',
  intro: '굳은 용암 사이로 붉은 균열이 숨 쉰다. 화산탄과 불기둥을 피해 잿빛 하늘 끝까지.',
  weather: 'ember',
  groundTexture: 'lava',
  curve: { amp1: 9, len1: 175, amp2: 4.2, len2: 72 },
  obstacleGlow: '#ff8a3d',
}

/** Stage 5 — 협곡. 그랜드캐년처럼 층진 절벽 사이의 강을 따라 난다. */
export const STAGE_5_CANYON: StageConfig = {
  id: 5,
  title: 'STAGE 5',
  subtitle: '메아리치는 대협곡',
  biome: 'canyon',
  goal: 2200,
  seed: 19190504,
  sky: { top: '#3f7ac2', mid: '#9fc3e8', bottom: '#f3d9a8' },
  fog: { color: '#d9b98c', near: 65, far: 330 },
  sun: { color: '#fff3d4', position: [44, 30, -240], size: 22, intensity: 2.0 },
  ambient: { color: '#ffd9a8', intensity: 1.25 },
  ground: {
    base: '#c98a54',
    ripple: '#a05f36',
    road: '#3f7d92',
    roadGlow: '#9fe8e0',
  },
  palette: {
    rock: ['#c0703f', '#93502f', '#d98d54', '#7a4028'],
    accent: ['#5d8a52', '#e8d5a0', '#c9563f'],
    crystal: '#ffe9b0',
  },
  uiAccent: '#ffb670',
  intro: '수만 년이 깎아 낸 붉은 절벽 사이로 초록 강이 흐른다. 바위 다리 아래를 지나 협곡 끝까지.',
  curve: { amp1: 10, len1: 165, amp2: 4.5, len2: 68 },
}

/** Stage 6 — 바닷속. 산호 정원과 해초 숲 사이, 고래가 지나는 물길을 난다. */
export const STAGE_6_OCEAN: StageConfig = {
  id: 6,
  title: 'STAGE 6',
  subtitle: '고래의 산호 정원',
  biome: 'ocean',
  goal: 2200,
  seed: 20260825,
  // 물속에서 위를 보면 수면이 밝다 — 위가 밝고 아래로 갈수록 짙어지는 하늘
  sky: { top: '#2f7794', mid: '#123f58', bottom: '#061e2d' },
  fog: { color: '#0c384e', near: 40, far: 260 },
  sun: { color: '#e8fbff', position: [10, 66, -230], size: 0, intensity: 1.1 },
  ambient: { color: '#6fb0c8', intensity: 1.05 },
  ground: {
    base: '#33646f',
    ripple: '#bfeee4',
    road: '#0f5f8a',
    roadGlow: '#7ff2ff',
  },
  palette: {
    rock: ['#2f5f6e', '#3f7a80', '#24485a', '#4f96a0'],
    accent: ['#ff7aa2', '#ffb066', '#b07aff'],
    crystal: '#8ffff0',
  },
  uiAccent: '#7ff2ff',
  intro: '수면의 빛이 모랫바닥에 그물을 그린다. 산호 정원과 해초 숲을 지나, 고래가 지나는 물길 끝까지.',
  aurora: { colors: ['#aef2ff', '#3f9fd9'], count: 5, opacity: 0.5, y: 108, z: -520, spacing: 210 },
  weather: 'bubble',
  groundTexture: 'caustics',
  starfield: { count: 500, color: '#aef2e8' },
  curve: { amp1: 8, len1: 180, amp2: 3.6, len2: 76 },
}

/** Stage 7 — 하늘. 구름바다 위를 날며 뭉게구름을 뚫고 지나간다. */
export const STAGE_7_SKY: StageConfig = {
  id: 7,
  title: 'STAGE 7',
  subtitle: '구름바다 위에서',
  biome: 'sky',
  goal: 2200,
  seed: 20770707,
  sky: { top: '#1d4fc4', mid: '#6fa4e0', bottom: '#e8f1f8' },
  fog: { color: '#dce8f4', near: 80, far: 430 },
  sun: { color: '#fff2d0', position: [-42, 36, -250], size: 24, intensity: 2.0 },
  ambient: { color: '#dcecff', intensity: 1.3 },
  ground: {
    base: '#5e7a44',
    ripple: '#ffffff',
    road: '#9fc4e8',
    roadGlow: '#ffffff',
  },
  palette: {
    rock: ['#8fa8c0', '#a8c0d8', '#7890a8', '#c0d4e8'],
    accent: ['#ff8fb0', '#ffd166', '#7fe8d8'],
    crystal: '#ffffff',
  },
  uiAccent: '#7fc8ff',
  intro: '까마득한 고도. 발밑 구름층 틈으로 들녘이 내려다보이고, 저 멀리 여객기가 비행운을 긋는다.',
  aurora: { colors: ['#ffffff', '#dcecff'], count: 4, opacity: 0.18, y: 130, z: -620, spacing: 300 },
  groundTexture: 'clouddeck',
  groundY: -58,
  hideRoad: true,
  // 길이 안 보이는 스테이지라 코스를 직선으로 둔다 (커브가 있으면 별·장애물이 한쪽으로 쏠려 보인다)
  curve: { amp1: 0, len1: 205, amp2: 0, len2: 84 },
}

/** Stage 8 — 미니미의 집, 어린이의 방. 손가락만 한 미니미에게 방 안 모든 것이 거대하다. */
export const STAGE_8_ROOM: StageConfig = {
  id: 8,
  title: 'STAGE 8',
  subtitle: '미니미의 집',
  biome: 'room',
  goal: 2200,
  seed: 20190608,
  // 벽지와 천장 조명의 따뜻한 실내 빛
  sky: { top: '#2f7f92', mid: '#4d9fae', bottom: '#8fcaca' },
  fog: { color: '#8fc0bc', near: 60, far: 340 },
  sun: { color: '#fff0c0', position: [-40, 32, -240], size: 20, intensity: 1.7 },
  ambient: { color: '#e8ddc8', intensity: 1.25 },
  ground: {
    base: '#c99a5e',
    ripple: '#8a6234',
    road: '#4d8fd0',
    roadGlow: '#ffe9a0',
  },
  palette: {
    rock: ['#c9a06a', '#e0c088', '#a87848', '#e8d8b0'],
    accent: ['#ff5c5c', '#4d8fff', '#ffd166'],
    crystal: '#ffe9a0',
  },
  uiAccent: '#ffb46b',
  intro: '여기는 미니미의 집. 손가락만 한 미니미에게는 크레용이 기둥이고 그림책이 언덕이다. 장난감 기차를 지나 방 끝까지.',
  aurora: { colors: ['#fff2cc', '#ffd98a'], count: 3, opacity: 0.3, y: 96, z: -480, spacing: 300 },
  weather: 'mote',
  groundTexture: 'wood',
  wallStripe: { color: '#bfe8e2', count: 150, opacity: 0.16 },
  curve: { amp1: 7, len1: 210, amp2: 3.2, len2: 88 },
}

/** Stage 9 — 동굴. 종유석 천장 아래, 수정과 버섯이 빛나는 지하 물길을 난다. */
export const STAGE_9_CAVE: StageConfig = {
  id: 9,
  title: 'STAGE 9',
  subtitle: '수정 동굴',
  biome: 'cave',
  goal: 2200,
  seed: 18990911,
  sky: { top: '#000000', mid: '#000000', bottom: '#0a0d12' },
  fog: { color: '#131722', near: 32, far: 240 },
  sun: { color: '#8fd8e8', position: [0, 40, -240], size: 0, intensity: 0.55 },
  ambient: { color: '#6a7a94', intensity: 1.1 },
  ground: {
    base: '#241f2c',
    ripple: '#4a4256',
    road: '#0f4a5c',
    roadGlow: '#5cf2e8',
  },
  palette: {
    rock: ['#3f3a48', '#544e5e', '#2a2532', '#665e74'],
    accent: ['#5cf2e8', '#8f7aff', '#ffd166'],
    crystal: '#7ff2ff',
  },
  uiAccent: '#5cf2e8',
  intro: '햇빛이 닿지 않는 수정 동굴. 종유석 천장 아래, 빛나는 버섯과 수정이 지하 물길을 비춘다.',
  obstacleGlow: '#5cf2e8',
  curve: { amp1: 8.5, len1: 185, amp2: 3.8, len2: 74 },
}

/** Stage 10 — 빌딩숲. 한낮, 마천루 지붕 위를 내려다보며 활공한다. */
export const STAGE_10_CITY: StageConfig = {
  id: 10,
  title: 'STAGE 10',
  subtitle: '마천루 상공',
  biome: 'city',
  goal: 2200,
  seed: 20021231,
  sky: { top: '#2151c4', mid: '#7fa9e0', bottom: '#e8f1f8' },
  fog: { color: '#d8e4f0', near: 80, far: 430 },
  sun: { color: '#fff6dc', position: [-40, 38, -250], size: 22, intensity: 2.0 },
  ambient: { color: '#e8eef8', intensity: 1.25 },
  ground: {
    base: '#a8adb6',
    ripple: '#e8ecf0',
    road: '#26355c',
    roadGlow: '#7fd8ff',
  },
  palette: {
    rock: ['#b8bec8', '#9aa4b0', '#8a8f9a', '#c9cfd8'],
    accent: ['#5cd8ff', '#ff8a5c', '#ffd166'],
    crystal: '#ffffff',
  },
  uiAccent: '#5cb8ff',
  intro: '한낮의 마천루 상공. 발밑으로 도시가 끝없이 펼쳐지고, 가장 높은 타워들이 지붕을 스칠 듯 스쳐 간다.',
  groundTexture: 'cityday',
  groundY: -40,
  hideRoad: true,
  // 길이 안 보이는 고공 스테이지라 코스를 직선으로 둔다
  curve: { amp1: 0, len1: 190, amp2: 0, len2: 78 },
}

/** Stage 11 — 놀이동산. 롤러코스터 아래를 지나 어트랙션 사이를 헤집고 난다. */
export const STAGE_11_PARK: StageConfig = {
  id: 11,
  title: 'STAGE 11',
  subtitle: '알록달록 놀이동산',
  biome: 'park',
  goal: 2200,
  seed: 19891103,
  sky: { top: '#6fb0e8', mid: '#c9e2f4', bottom: '#ffeedd' },
  fog: { color: '#e8ddd4', near: 70, far: 360 },
  sun: { color: '#fff4d8', position: [-38, 30, -250], size: 0, intensity: 1.8 },
  ambient: { color: '#fff0e0', intensity: 1.3 },
  ground: {
    base: '#5da294',
    ripple: '#e8927c',
    road: '#5da294',
    roadGlow: '#ffd9b8',
  },
  palette: {
    rock: ['#e8927c', '#5cc9b8', '#f4e0c8', '#ff9ab8'],
    accent: ['#ff8a75', '#ffd166', '#5cc9b8'],
    crystal: '#ffd166',
  },
  uiAccent: '#ff8a75',
  intro: '알록달록한 놀이동산. 머리 위로 롤러코스터가 지나가고, 회전목마와 드롭타워 사이를 헤집으며 난다.',
  hideRoad: true,
  // 어트랙션 사이를 헤집도록 굽이를 크게
  curve: { amp1: 9.5, len1: 165, amp2: 4.2, len2: 68 },
}

/**
 * 스테이지 목록.
 * 새 스테이지는 StageConfig 를 하나 더 만들어 여기에 넣고,
 * Scene.tsx 의 Scenery switch 에 biome case 를 추가하면 된다.
 */
export const STAGES: StageConfig[] = [
  STAGE_1_DESERT,
  STAGE_2_ARCTIC,
  STAGE_3_SPACE,
  STAGE_4_LAVA,
  STAGE_5_CANYON,
  STAGE_6_OCEAN,
  STAGE_7_SKY,
  STAGE_8_ROOM,
  STAGE_9_CAVE,
  STAGE_10_CITY,
  STAGE_11_PARK,
]

export function getStage(id: number): StageConfig {
  return STAGES.find((s) => s.id === id) ?? STAGE_1_DESERT
}

/** 다음 스테이지가 있으면 돌려준다. */
export function getNextStage(id: number): StageConfig | null {
  return STAGES.find((s) => s.id === id + 1) ?? null
}
