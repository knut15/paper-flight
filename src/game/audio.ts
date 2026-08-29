import { rt } from './state'

/**
 * 효과음. 외부 오디오 파일 없이 Web Audio 로 전부 만든다.
 * - 바람: 핑크 노이즈 → lowpass. 일정한 "드라이어" 드론이 되지 않도록
 *   서로 다른 주기의 돌풍 변조를 겹쳐 세기와 음색이 계속 오르내린다.
 * - 날갯짓: 짧은 하이패스 화이트노이즈 버스트. 종이가 펄럭이는 소리.
 * 브라우저 정책상 사용자 제스처(시작 버튼/Space) 후에만 켤 수 있다.
 */
let ctx: AudioContext | null = null
let master: GainNode | null = null
let windGain: GainNode | null = null
let windFilter: BiquadFilterNode | null = null
let musicGain: GainNode | null = null
let musicEcho: DelayNode | null = null
let hatBuf: AudioBuffer | null = null
let snareBuf: AudioBuffer | null = null
let muted = false

const MASTER_VOLUME = 0.5

// HMR 로 모듈이 다시 로드될 때 이전 바람/음악이 겹쳐 울리지 않게 닫는다
const g = globalThis as { __pfAudioCtx?: AudioContext; __pfMusicTimer?: number }
if (g.__pfAudioCtx) {
  void g.__pfAudioCtx.close().catch(() => {})
  g.__pfAudioCtx = undefined
}
if (g.__pfMusicTimer) {
  clearInterval(g.__pfMusicTimer)
  g.__pfMusicTimer = undefined
}

/** 핑크 노이즈 (바람용 — 저음이 풍부해 훨씬 부드럽다) */
function makePinkNoise(ac: AudioContext) {
  const buf = ac.createBuffer(1, ac.sampleRate * 4, ac.sampleRate)
  const d = buf.getChannelData(0)
  let b0 = 0
  let b1 = 0
  let b2 = 0
  for (let i = 0; i < d.length; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.997 * b0 + 0.029591 * white
    b1 = 0.985 * b1 + 0.032534 * white
    b2 = 0.95 * b2 + 0.048056 * white
    d[i] = (b0 + b1 + b2 + white * 0.05) * 2.1
  }
  return buf
}

export function initAudio() {
  if (ctx) {
    void ctx.resume()
    return
  }
  try {
    ctx = new AudioContext()
  } catch {
    return // 오디오 미지원 환경이면 조용히 끈다
  }
  g.__pfAudioCtx = ctx
  master = ctx.createGain()
  master.gain.value = muted ? 0 : MASTER_VOLUME
  master.connect(ctx.destination)

  const src = ctx.createBufferSource()
  src.buffer = makePinkNoise(ctx)
  src.loop = true
  // 종이비행기답게 — 묵직한 저음 대신 가볍고 산뜻한 높은 대역의 바람
  windFilter = ctx.createBiquadFilter()
  windFilter.type = 'bandpass'
  windFilter.frequency.value = 850
  windFilter.Q.value = 0.5
  windGain = ctx.createGain()
  windGain.gain.value = 0
  src.connect(windFilter)
  windFilter.connect(windGain)
  windGain.connect(master)
  src.start()

  // 16비트 배경음악 채널 — 에코 버스로 SNES 풍의 공간감을 만든다
  musicGain = ctx.createGain()
  musicGain.gain.value = 0.4
  musicGain.connect(master)
  musicEcho = ctx.createDelay(1)
  musicEcho.delayTime.value = 0.245
  const echoFeedback = ctx.createGain()
  echoFeedback.gain.value = 0.3
  const echoWet = ctx.createGain()
  echoWet.gain.value = 0.2
  musicEcho.connect(echoFeedback)
  echoFeedback.connect(musicEcho)
  musicEcho.connect(echoWet)
  echoWet.connect(musicGain)
  hatBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate)
  const hd = hatBuf.getChannelData(0)
  for (let i = 0; i < hd.length; i++) hd[i] = (Math.random() * 2 - 1) * (1 - i / hd.length)
  snareBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.16), ctx.sampleRate)
  const sd = snareBuf.getChannelData(0)
  for (let i = 0; i < sd.length; i++) sd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sd.length, 1.6)
  startMusic()

  console.debug('[audio] ready v5')
}

/** 매 프레임 호출. 돌풍처럼 오르내리는 바람과 주기적인 날갯짓. */
export function updateAudio(_dt: number) {
  if (!ctx || !windGain || !windFilter) return
  const t = ctx.currentTime
  const k = Math.max(0, (rt.speed - 30) / 30) // 0(저속) ~ 0.8(최고속)

  // 서로 소수 관계인 주기 세 개를 겹쳐 "쏴아- 쏴아-" 하는 돌풍을 만든다
  const gust =
    0.55 +
    0.28 * Math.sin(rt.time * 0.55) +
    0.17 * Math.sin(rt.time * 1.31 + 1.7) +
    0.1 * Math.sin(rt.time * 3.7 + 0.6)

  // 가볍게 — 볼륨을 낮추고 대역을 높여 "쉬이~" 하는 산뜻한 바람
  const targetGain = rt.running ? (0.024 + k * 0.09) * Math.max(0.3, gust) : 0.006
  windGain.gain.setTargetAtTime(targetGain, t, 0.15)
  windFilter.frequency.setTargetAtTime(
    720 + k * 520 + gust * 240 + Math.abs(rt.vy) * 60 + Math.abs(rt.vx) * 30,
    t,
    0.2,
  )

  // 배경음악 — 주행 중엔 제 볼륨, 멈추면 살짝 줄인다
  if (musicGain) musicGain.gain.setTargetAtTime(rt.running ? 0.4 : 0.18, t, 0.3)


}

/** 별 획득 — 위로 튀는 "푱" 차임. 콤보가 쌓이면 음이 반음씩 올라간다. */
export function playPickup(combo = 0) {
  if (!ctx || !master || muted) return
  const t = ctx.currentTime
  const base = 620 * Math.pow(1.059, Math.min(combo, 14))

  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(base, t)
  osc.frequency.exponentialRampToValueAtTime(base * 2.1, t + 0.09)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.24, t + 0.014)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
  osc.connect(gain)
  gain.connect(master)
  osc.start(t)
  osc.stop(t + 0.24)

  // 반짝이는 배음 한 겹
  const shimmer = ctx.createOscillator()
  shimmer.type = 'sine'
  shimmer.frequency.setValueAtTime(base * 3, t)
  shimmer.frequency.exponentialRampToValueAtTime(base * 4.2, t + 0.08)
  const sg = ctx.createGain()
  sg.gain.setValueAtTime(0.055, t)
  sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.13)
  shimmer.connect(sg)
  sg.connect(master)
  shimmer.start(t)
  shimmer.stop(t + 0.14)
}

// ---------- 8비트 배경음악 ----------

/** 미디 노트 → 주파수 */
function noteHz(n: number) {
  return 440 * Math.pow(2, (n - 69) / 12)
}

// 경쾌한 다장조 8마디 루프 (16분음표 128스텝, 0 은 쉼표)
// 진행: C - G - Am - F | C - G - F - G→C
const LEAD: number[] = [
  // 1 (C)
  76, 0, 79, 0, 84, 0, 79, 0, 81, 0, 79, 0, 76, 0, 72, 0,
  // 2 (G)
  74, 0, 79, 0, 83, 0, 79, 0, 81, 83, 81, 79, 74, 0, 0, 0,
  // 3 (Am)
  84, 0, 81, 0, 76, 0, 81, 0, 83, 0, 84, 0, 83, 81, 79, 0,
  // 4 (F)
  81, 0, 77, 0, 72, 0, 77, 0, 79, 81, 79, 77, 76, 0, 74, 0,
  // 5 (C) — 변주
  76, 79, 84, 0, 88, 0, 84, 79, 81, 0, 79, 0, 76, 0, 0, 0,
  // 6 (G)
  83, 0, 79, 0, 74, 0, 79, 83, 86, 0, 83, 0, 81, 79, 81, 0,
  // 7 (F)
  77, 0, 81, 0, 84, 0, 81, 0, 83, 84, 83, 81, 79, 0, 76, 0,
  // 8 (G→C) — 상행 마무리
  74, 76, 77, 79, 81, 83, 84, 0, 84, 0, 79, 0, 76, 0, 72, 0,
]
// 4분음표(4스텝)마다 하나 — 근음과 5음이 통통 튄다
const BASS: number[] = [
  48, 48, 55, 48, 55, 55, 50, 55, 57, 57, 52, 57, 53, 53, 48, 53,
  48, 48, 55, 48, 55, 55, 50, 55, 53, 53, 48, 53, 55, 50, 55, 50,
]
// 마디별 3화음 — 오프비트 아르페지오용
const CHORDS: number[][] = [
  [60, 64, 67],
  [59, 62, 67],
  [57, 60, 64],
  [57, 60, 65],
  [60, 64, 67],
  [59, 62, 67],
  [57, 60, 65],
  [59, 62, 67],
]
const BPM = 148
const STEP = 60 / BPM / 4

/** 16비트 리드 — 살짝 어긋난 톱니파 두 개를 로우패스로 둥글린다 */
function playSquare(freq: number, when: number, dur: number, vol: number) {
  if (!ctx || !musicGain) return
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(vol, when + 0.016)
  gain.gain.setValueAtTime(vol, when + dur * 0.55)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2600, when)
  filter.frequency.exponentialRampToValueAtTime(1200, when + dur)
  filter.Q.value = 0.7

  for (const detune of [-6, 6]) {
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    osc.detune.value = detune
    osc.connect(filter)
    osc.start(when)
    osc.stop(when + dur + 0.02)
  }
  filter.connect(gain)
  gain.connect(musicGain)
  if (musicEcho) {
    const send = ctx.createGain()
    send.gain.value = 0.4
    gain.connect(send)
    send.connect(musicEcho)
  }
}

function playTriangle(freq: number, when: number, dur: number, vol: number) {
  if (!ctx || !musicGain) return
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = freq
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(vol, when + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur)
  osc.connect(gain)
  gain.connect(musicGain)
  if (musicEcho && freq > 200) {
    // 베이스는 마르고 아르페지오만 은은하게 울린다
    const send = ctx.createGain()
    send.gain.value = 0.3
    gain.connect(send)
    send.connect(musicEcho)
  }
  osc.start(when)
  osc.stop(when + dur + 0.02)
}

function playKick(when: number) {
  if (!ctx || !musicGain) return
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(155, when)
  osc.frequency.exponentialRampToValueAtTime(46, when + 0.1)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.13, when)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.13)
  osc.connect(gain)
  gain.connect(musicGain)
  osc.start(when)
  osc.stop(when + 0.15)
}

function playSnare(when: number) {
  if (!ctx || !musicGain || !snareBuf) return
  const src = ctx.createBufferSource()
  src.buffer = snareBuf
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1500
  filter.Q.value = 0.5
  const gain = ctx.createGain()
  gain.gain.value = 0.045
  src.connect(filter)
  filter.connect(gain)
  gain.connect(musicGain)
  if (musicEcho) {
    const send = ctx.createGain()
    send.gain.value = 0.15
    gain.connect(send)
    send.connect(musicEcho)
  }
  src.start(when)
}

function playHat(when: number, vol: number) {
  if (!ctx || !musicGain || !hatBuf) return
  const src = ctx.createBufferSource()
  src.buffer = hatBuf
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 6000
  const gain = ctx.createGain()
  gain.gain.value = vol
  src.connect(filter)
  filter.connect(gain)
  gain.connect(musicGain)
  src.start(when)
}

/** 룩어헤드 스케줄러 — 끊김 없이 루프를 예약한다 */
function startMusic() {
  if (!ctx) return
  let step = 0
  let nextTime = ctx.currentTime + 0.1
  const timer = window.setInterval(() => {
    if (!ctx) return
    while (nextTime < ctx.currentTime + 0.25) {
      const i = step % LEAD.length
      const bar = (i / 16) | 0
      const beat = i % 16

      const lead = LEAD[i]
      if (lead > 0) playSquare(noteHz(lead), nextTime, STEP * 1.7, 0.05)

      if (i % 4 === 0) {
        const bass = BASS[((i / 4) | 0) % BASS.length]
        playTriangle(noteHz(bass), nextTime, STEP * 3.4, 0.1)
      }

      // 오프비트 아르페지오 — 코드톤이 반짝반짝 돈다
      if (beat % 4 === 2) {
        const chord = CHORDS[bar % CHORDS.length]
        playTriangle(noteHz(chord[((i / 4) | 0) % 3] + 12), nextTime, STEP * 1.4, 0.03)
      }

      // 드럼 — 킥·스네어·햇
      if (beat === 0 || beat === 8 || (bar % 2 === 1 && beat === 10)) playKick(nextTime)
      if (beat === 4 || beat === 12) playSnare(nextTime)
      if (i % 2 === 1) playHat(nextTime, beat === 14 ? 0.028 : 0.013)

      nextTime += STEP
      step++
    }
  }, 90)
  g.__pfMusicTimer = timer
}

/** 반짝이 스타 — 번개가 내리치는 소리 */
export function playThunder() {
  if (!ctx || !master || muted) return
  const t = ctx.currentTime

  // 쩌적 — 짧고 날카로운 크랙
  const crackBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate)
  const cd = crackBuf.getChannelData(0)
  for (let i = 0; i < cd.length; i++) {
    const k = i / cd.length
    cd[i] = (Math.random() * 2 - 1) * Math.pow(1 - k, 2.2)
  }
  const crack = ctx.createBufferSource()
  crack.buffer = crackBuf
  const crackFilter = ctx.createBiquadFilter()
  crackFilter.type = 'highpass'
  crackFilter.frequency.setValueAtTime(2600, t)
  crackFilter.frequency.exponentialRampToValueAtTime(600, t + 0.4)
  const crackGain = ctx.createGain()
  crackGain.gain.setValueAtTime(0.42, t)
  crackGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
  crack.connect(crackFilter)
  crackFilter.connect(crackGain)
  crackGain.connect(master)
  crack.start(t)

  // 우르릉 — 뒤따르는 저음 울림
  const rumble = ctx.createOscillator()
  rumble.type = 'sawtooth'
  rumble.frequency.setValueAtTime(120, t + 0.04)
  rumble.frequency.exponentialRampToValueAtTime(38, t + 0.9)
  const rumbleFilter = ctx.createBiquadFilter()
  rumbleFilter.type = 'lowpass'
  rumbleFilter.frequency.value = 320
  const rumbleGain = ctx.createGain()
  rumbleGain.gain.setValueAtTime(0.0001, t + 0.04)
  rumbleGain.gain.exponentialRampToValueAtTime(0.22, t + 0.1)
  rumbleGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1)
  rumble.connect(rumbleFilter)
  rumbleFilter.connect(rumbleGain)
  rumbleGain.connect(master)
  rumble.start(t + 0.04)
  rumble.stop(t + 1.15)

  // 콰광 — 배를 때리는 저음 폭발
  const boom = ctx.createOscillator()
  boom.type = 'sine'
  boom.frequency.setValueAtTime(190, t)
  boom.frequency.exponentialRampToValueAtTime(32, t + 0.5)
  const boomGain = ctx.createGain()
  boomGain.gain.setValueAtTime(0.55, t)
  boomGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
  boom.connect(boomGain)
  boomGain.connect(master)
  boom.start(t)
  boom.stop(t + 0.75)

  // 파열음 — 폭발의 알갱이
  const burstBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.7), ctx.sampleRate)
  const bd = burstBuf.getChannelData(0)
  for (let i = 0; i < bd.length; i++) {
    const k = i / bd.length
    bd[i] = (Math.random() * 2 - 1) * Math.pow(1 - k, 1.3)
  }
  const burst = ctx.createBufferSource()
  burst.buffer = burstBuf
  const burstFilter = ctx.createBiquadFilter()
  burstFilter.type = 'lowpass'
  burstFilter.frequency.setValueAtTime(1800, t)
  burstFilter.frequency.exponentialRampToValueAtTime(240, t + 0.6)
  const burstGain = ctx.createGain()
  burstGain.gain.setValueAtTime(0.4, t)
  burstGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)
  burst.connect(burstFilter)
  burstFilter.connect(burstGain)
  burstGain.connect(master)
  burst.start(t)
}

export function toggleMute() {
  muted = !muted
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, ctx.currentTime, 0.05)
  return muted
}
