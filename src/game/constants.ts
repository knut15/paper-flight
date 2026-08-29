// 게임 전역 상수. 스테이지가 늘어나도 여기 값은 공유한다.

/** 카메라가 서 있는 z. 플레이어는 원점 근처에 머물고 월드가 +z 로 흘러온다. */
export const CAMERA_Z = 6.4
export const CAMERA_Y = 2.9

/** 좌우 이동 한계 */
export const HALF_WIDTH = 7.5
/** 고도 한계 */
export const MIN_Y = 0.9
export const MAX_Y = 6.4

/** 전진 속도 (단위/초) */
export const BASE_SPEED = 34
export const MAX_SPEED = 56
/** 커브에서 밀려 느려지는 정도. 직선 가속은 없다 — 속도를 올리려면 부스터를 쓴다. */
export const CURVE_PENALTY = 14
/** 속도가 목표치를 따라가는 빠르기 (0에 가까울수록 즉각적) */
export const SPEED_EASE = 0.4
export const SPEED_EASE_BOOST = 0.02

/** Z 부스터 */
export const BOOST_BONUS = 22
/** X 브레이크가 목표로 삼는 속도와 감속의 부드러움 */
export const BRAKE_EASE = 0.25

/** 반짝이 스타를 먹었을 때의 무적 시간(초) */
export const POWER_TIME = 3.5
/** 무적 중 부스터가 도달하는 최고 속도 */
export const POWER_MAX_SPEED = 100

/** 조작 반응 */
export const LATERAL_ACCEL = 40
export const VERTICAL_ACCEL = 46
export const DAMPING = 0.82

/** 소품 필드가 한 바퀴 도는 길이. 이 길이만큼 z 를 되감아 무한 스크롤을 만든다. */
export const FIELD_LENGTH = 340

/** 무적 시간(초) */
export const INVULN_TIME = 1.6
