import * as THREE from 'three'
import { mulberry32 } from './rng'

/** 바닥 바탕 텍스처. 잔 알갱이 + 물결 무늬로 속도감을 만든다. */
export function makeGroundTexture(base: string, ripple: string, seed = 7) {
  const size = 512
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const rand = mulberry32(seed)

  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  // 물결(사구 결) — 가로로 길게 흐르는 곡선
  ctx.strokeStyle = ripple
  ctx.globalAlpha = 0.28
  for (let i = 0; i < 26; i++) {
    const y = rand() * size
    ctx.lineWidth = 1 + rand() * 3
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= size; x += 32) {
      ctx.lineTo(x, y + Math.sin((x / size) * Math.PI * 2 + i) * (4 + rand() * 8))
    }
    ctx.stroke()
  }

  // 알갱이
  ctx.globalAlpha = 0.16
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = rand() > 0.5 ? ripple : '#ffffff'
    ctx.fillRect(rand() * size, rand() * size, 2, 2)
  }
  ctx.globalAlpha = 1

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** 가운데 길(마른 강바닥) 텍스처. 세로로 흐르는 발광 라인. */
export function makeRoadTexture(road: string, glow: string, seed = 11) {
  const w = 256
  const h = 512
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  const rand = mulberry32(seed)

  const g = ctx.createLinearGradient(0, 0, w, 0)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(0.12, road)
  g.addColorStop(0.5, road)
  g.addColorStop(0.88, road)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // 흐르는 물길 라인
  ctx.strokeStyle = glow
  ctx.lineCap = 'round'
  for (let i = 0; i < 14; i++) {
    const x0 = 20 + rand() * (w - 40)
    ctx.globalAlpha = 0.15 + rand() * 0.5
    ctx.lineWidth = 1 + rand() * 2.5
    ctx.beginPath()
    ctx.moveTo(x0, -10)
    for (let y = 0; y <= h + 10; y += 48) {
      ctx.lineTo(x0 + Math.sin(y / 90 + i * 1.7) * (6 + rand() * 10), y)
    }
    ctx.stroke()
  }

  // 가장자리 밝은 띠
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 4
  ctx.strokeStyle = glow
  ctx.beginPath()
  ctx.moveTo(16, 0)
  ctx.lineTo(16, h)
  ctx.moveTo(w - 16, 0)
  ctx.lineTo(w - 16, h)
  ctx.stroke()
  ctx.globalAlpha = 1

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** 부드러운 원형 글로우 (태양, 반짝임, 그림자에 공용) */
export function makeGlowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const size = 128
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, inner)
  g.addColorStop(0.45, inner)
  g.addColorStop(1, outer)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** 성운 바닥 텍스처. 보랏빛 얼룩과 흩뿌린 별로 우주 원반을 만든다. */
export function makeNebulaTexture(base: string, glow: string, seed = 5) {
  const size = 512
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const rand = mulberry32(seed)

  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  // 뭉게뭉게 퍼지는 성운 얼룩
  for (let i = 0; i < 40; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 40 + rand() * 130
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    const a = 0.05 + rand() * 0.13
    g.addColorStop(0, hexToRgba(glow, a))
    g.addColorStop(1, hexToRgba(glow, 0))
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }

  // 흩뿌린 별
  for (let i = 0; i < 900; i++) {
    ctx.globalAlpha = 0.2 + rand() * 0.7
    ctx.fillStyle = rand() > 0.85 ? glow : "#ffffff"
    const s = rand() > 0.9 ? 2 : 1
    ctx.fillRect(rand() * size, rand() * size, s, s)
  }
  ctx.globalAlpha = 1

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "")
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 굳은 용암 바닥. 검은 현무암 위로 붉은 균열이 갈라진다. */
export function makeLavaTexture(base: string, crack: string, seed = 13) {
  const size = 512
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const rand = mulberry32(seed)

  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  // 얼룩덜룩한 현무암 결
  for (let i = 0; i < 260; i++) {
    const r = 12 + rand() * 60
    ctx.globalAlpha = 0.05 + rand() * 0.08
    ctx.fillStyle = rand() > 0.5 ? "#000000" : "#6b3a2a"
    ctx.beginPath()
    ctx.arc(rand() * size, rand() * size, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // 갈라진 균열 — 가지를 치며 뻗는다
  ctx.lineCap = "round"
  for (let i = 0; i < 34; i++) {
    let x = rand() * size
    let y = rand() * size
    let a = rand() * Math.PI * 2
    const seg = 6 + Math.floor(rand() * 10)
    const w = 1 + rand() * 3.5
    for (let j = 0; j < seg; j++) {
      const len = 8 + rand() * 26
      const nx = x + Math.cos(a) * len
      const ny = y + Math.sin(a) * len
      // 균열 둘레의 열기
      ctx.strokeStyle = crack
      ctx.globalAlpha = 0.18
      ctx.lineWidth = w * 3.2
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(nx, ny)
      ctx.stroke()
      // 균열 심
      ctx.globalAlpha = 0.95
      ctx.lineWidth = w
      ctx.strokeStyle = "#ffd9a0"
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(nx, ny)
      ctx.stroke()
      x = nx
      y = ny
      a += (rand() - 0.5) * 1.2
    }
  }
  ctx.globalAlpha = 1

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** 사암 지층. 협곡 절벽에 입히면 가로로 층이 진다. */
export function makeStrataTexture(colors: string[], seed = 21) {
  const w = 256
  const h = 512
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const ctx = c.getContext("2d")!
  const rand = mulberry32(seed)

  let y = 0
  let i = 0
  while (y < h) {
    const band = 8 + rand() * 34
    ctx.fillStyle = colors[i % colors.length]
    ctx.fillRect(0, y, w, band)
    // 층 경계의 그늘
    ctx.globalAlpha = 0.16
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, y, w, 2 + rand() * 3)
    ctx.globalAlpha = 1
    y += band
    i++
  }

  // 세로로 흘러내린 물자국
  ctx.globalAlpha = 0.12
  for (let k = 0; k < 40; k++) {
    ctx.fillStyle = rand() > 0.5 ? "#000000" : "#ffffff"
    const x = rand() * w
    ctx.fillRect(x, 0, 1 + rand() * 3, h)
  }
  ctx.globalAlpha = 1

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** 바닷속 모래 바닥. 수면을 통과한 빛이 그물 무늬(커스틱)로 일렁인다. */
export function makeCausticsTexture(base: string, light: string, seed = 17) {
  const size = 512
  const c = document.createElement("canvas")
  c.width = c.height = size
  const ctx = c.getContext("2d")!
  const rand = mulberry32(seed)

  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  // 모래 알갱이
  ctx.globalAlpha = 0.1
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = rand() > 0.5 ? "#ffffff" : "#000000"
    ctx.fillRect(rand() * size, rand() * size, 2, 2)
  }

  // 커스틱 — 일그러진 밝은 셀 경계선을 여러 겹 겹친다
  ctx.lineCap = "round"
  ctx.strokeStyle = light
  for (let i = 0; i < 90; i++) {
    const cx = rand() * size
    const cy = rand() * size
    const r = 18 + rand() * 46
    const wobble = 4 + rand() * 9
    ctx.globalAlpha = 0.1 + rand() * 0.22
    ctx.lineWidth = 1.5 + rand() * 2.5
    ctx.beginPath()
    const steps = 14
    for (let j = 0; j <= steps; j++) {
      const a = (j / steps) * Math.PI * 2
      const rr = r + Math.sin(a * 3 + i) * wobble + Math.sin(a * 5 + i * 2) * (wobble * 0.5)
      const x = cx + Math.cos(a) * rr
      const y = cy + Math.sin(a) * rr
      if (j === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** 어린이 방 마룻바닥. 널판 이음매와 나뭇결, 옹이가 있다. */
export function makeWoodTexture(base: string, seam: string, seed = 23) {
  const size = 512
  const c = document.createElement("canvas")
  c.width = c.height = size
  const ctx = c.getContext("2d")!
  const rand = mulberry32(seed)

  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  const planks = 5
  const w = size / planks
  for (let p = 0; p < planks; p++) {
    const x0 = p * w
    // 널판마다 톤을 살짝 다르게
    ctx.globalAlpha = 0.1 + rand() * 0.1
    ctx.fillStyle = rand() > 0.5 ? "#ffffff" : "#000000"
    ctx.fillRect(x0, 0, w, size)
    ctx.globalAlpha = 1

    // 이음매
    ctx.strokeStyle = seam
    ctx.globalAlpha = 0.55
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x0, 0)
    ctx.lineTo(x0, size)
    ctx.stroke()

    // 나뭇결 — 세로로 흐르는 물결선
    ctx.globalAlpha = 0.16
    ctx.lineWidth = 1.4
    for (let g = 0; g < 9; g++) {
      const gx = x0 + 8 + rand() * (w - 16)
      ctx.beginPath()
      ctx.moveTo(gx, 0)
      for (let y = 0; y <= size; y += 32) {
        ctx.lineTo(gx + Math.sin(y / 60 + g + p) * 4, y)
      }
      ctx.stroke()
    }

    // 옹이
    if (rand() > 0.55) {
      const kx = x0 + w * (0.3 + rand() * 0.4)
      const ky = rand() * size
      ctx.globalAlpha = 0.3
      ctx.beginPath()
      ctx.ellipse(kx, ky, 5 + rand() * 5, 8 + rand() * 8, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** 고공 비행 시점의 구름층. 흰 구름 덩어리 사이로 들녘 지형이 내려다보인다. */
export function makeCloudDeckTexture(terrain: string, cloud: string, seed = 29) {
  const size = 512
  const c = document.createElement("canvas")
  c.width = c.height = size
  const ctx = c.getContext("2d")!
  const rand = mulberry32(seed)

  // 지형 — 들녘 조각보
  ctx.fillStyle = terrain
  ctx.fillRect(0, 0, size, size)
  const fields = ["#6f8a4d", "#4d6a3a", "#8a9a5c", "#7a6a48", "#5e7a44"]
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = fields[Math.floor(rand() * fields.length)]
    ctx.globalAlpha = 0.5 + rand() * 0.4
    const w = 30 + rand() * 90
    const h = 20 + rand() * 70
    ctx.fillRect(rand() * size, rand() * size, w, h)
  }
  // 강줄기
  ctx.globalAlpha = 0.7
  ctx.strokeStyle = "#4d7a8a"
  ctx.lineWidth = 5
  ctx.beginPath()
  let rx = rand() * size
  ctx.moveTo(rx, 0)
  for (let y = 0; y <= size; y += 40) {
    rx += (rand() - 0.5) * 60
    ctx.lineTo(rx, y)
  }
  ctx.stroke()
  ctx.globalAlpha = 1

  // 구름층 — 그림 구름은 성기게만 깔고, 입체 구름 조각이 주역이 되게 한다
  for (let i = 0; i < 48; i++) {
    const cx = rand() * size
    const cy = rand() * size
    const lobes = 4 + Math.floor(rand() * 5)
    // 그림자 먼저
    for (let j = 0; j < lobes; j++) {
      const ox = (rand() - 0.5) * 46
      const oy = (rand() - 0.5) * 34
      const r = 12 + rand() * 26
      const sh = ctx.createRadialGradient(cx + ox + 4, cy + oy + 5, 0, cx + ox + 4, cy + oy + 5, r)
      sh.addColorStop(0, "rgba(90,110,130,0.35)")
      sh.addColorStop(1, "rgba(90,110,130,0)")
      ctx.fillStyle = sh
      ctx.fillRect(cx + ox - r, cy + oy - r, r * 2 + 8, r * 2 + 8)
    }
    for (let j = 0; j < lobes; j++) {
      const ox = (rand() - 0.5) * 46
      const oy = (rand() - 0.5) * 34
      const r = 12 + rand() * 26
      const g = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r)
      g.addColorStop(0, cloud)
      g.addColorStop(0.7, cloud)
      g.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = g
      ctx.fillRect(cx + ox - r, cy + oy - r, r * 2, r * 2)
    }
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** 밤 도시 바닥 — 블록 사이 도로가 가로등 불빛으로 점점이 빛난다. */
export function makeCityTexture(base: string, light: string, seed = 31, day = false) {
  const size = 512
  const c = document.createElement("canvas")
  c.width = c.height = size
  const ctx = c.getContext("2d")!
  const rand = mulberry32(seed)

  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  // 블록(건물 부지) — 살짝 다른 톤의 사각형
  const cells = 6
  const cw = size / cells
  for (let gx = 0; gx < cells; gx++) {
    for (let gy = 0; gy < cells; gy++) {
      ctx.globalAlpha = 0.35
      ctx.fillStyle = day
        ? rand() > 0.5
          ? "#ffffff"
          : "#6a7078"
        : rand() > 0.5
          ? "#232838"
          : "#1c2130"
      ctx.fillRect(gx * cw + 5, gy * cw + 5, cw - 10, cw - 10)
    }
  }
  ctx.globalAlpha = 1

  if (day) {
    // 공원 — 초록 블록
    for (let i = 0; i < 9; i++) {
      ctx.globalAlpha = 0.85
      ctx.fillStyle = rand() > 0.5 ? "#7fa86a" : "#6a9458"
      const gx = Math.floor(rand() * cells)
      const gy = Math.floor(rand() * cells)
      ctx.fillRect(gx * cw + 6, gy * cw + 6, cw - 12, cw - 12)
    }
    // 강 — 굽이치며 가로지르는 물길
    ctx.globalAlpha = 1
    ctx.strokeStyle = "#4f8ac2"
    ctx.lineWidth = 30
    ctx.beginPath()
    let wx = rand() * size
    ctx.moveTo(wx, -10)
    for (let y = 0; y <= size + 10; y += 48) {
      wx += (rand() - 0.5) * 70
      ctx.lineTo(wx, y)
    }
    ctx.stroke()
  }

  // 도로 — 격자선
  ctx.strokeStyle = day ? "#7f8894" : "#2e3444"
  ctx.lineWidth = 8
  for (let i = 0; i <= cells; i++) {
    ctx.beginPath()
    ctx.moveTo(i * cw, 0)
    ctx.lineTo(i * cw, size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i * cw)
    ctx.lineTo(size, i * cw)
    ctx.stroke()
  }

  // 불빛/차량 — 도로를 따라 점점이
  const dotColors = day ? ["#e8ecf0", "#e84d3d", "#3f6fd8", "#f4d44d"] : [light]
  for (let i = 0; i <= cells; i++) {
    for (let j = 0; j < 26; j++) {
      const along = rand() * size
      ctx.globalAlpha = 0.5 + rand() * 0.5
      ctx.fillStyle = dotColors[Math.floor(rand() * dotColors.length)]
      ctx.beginPath()
      ctx.arc(i * cw + (rand() - 0.5) * 6, along, day ? 1.2 : 1.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(along, i * cw + (rand() - 0.5) * 6, day ? 1.2 : 1.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** 빌딩 외벽 창문. 켜진 창(따뜻한/차가운 빛)과 꺼진 창이 섞인다. */
export function makeWindowsTexture(base: string, seed = 37, day = false) {
  const w = 256
  const h = 512
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const ctx = c.getContext("2d")!
  const rand = mulberry32(seed)

  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  const cols = 8
  const rows = 20
  const cw = w / cols
  const ch = h / rows
  const litColors = day
    ? ["#9fc4e0", "#7fa8cc", "#c9dcee", "#e8f0f8"]
    : ["#ffd98a", "#ffe9b8", "#9fd8e8", "#e8f0f4"]
  const offColor = day ? "#8f99a6" : "#141824"
  for (let r = 0; r < rows; r++) {
    // 밤에는 층 전체가 꺼져 있기도 하다
    const floorLit = day ? true : rand() > 0.22
    for (let col = 0; col < cols; col++) {
      const lit = floorLit && rand() > (day ? 0.25 : 0.42)
      ctx.fillStyle = lit ? litColors[Math.floor(rand() * litColors.length)] : offColor
      ctx.globalAlpha = lit ? 0.7 + rand() * 0.3 : 0.9
      ctx.fillRect(col * cw + 3, r * ch + 3, cw - 6, ch - 6)
    }
  }
  ctx.globalAlpha = 1

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}
