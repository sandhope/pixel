import type { Shape } from '@/types/shapes'

/**
 * 把单个形状 -> 对应的 SVG 内部元素（不包含 translate/rotate，那层包裹）
 * 在主画布渲染时，外层 <g transform="translate(x,y) rotate(rotation, x/2,y/2) scale(...)">
 */
export function shapeInnerSvg(s: Shape): string {
  if (!s) return ''
  const common = commonAttrs(s)
  switch (s.type) {
    case 'rect': {
      const r = Math.min(s.radius ?? 0, s.width / 2, s.height / 2)
      return `<rect x="0" y="0" width="${fmt(s.width)}" height="${fmt(s.height)}" rx="${fmt(r)}" ry="${fmt(r)}"${common}/>`
    }
    case 'circle': {
      const r = Math.min(s.width, s.height) / 2
      return `<ellipse cx="${fmt(s.width / 2)}" cy="${fmt(s.height / 2)}" rx="${fmt(s.width / 2)}" ry="${fmt(s.height / 2)}"${common}/>`
    }
    case 'ellipse':
      return `<ellipse cx="${fmt(s.width / 2)}" cy="${fmt(s.height / 2)}" rx="${fmt(s.width / 2)}" ry="${fmt(s.height / 2)}"${common}/>`
    case 'line':
      return `<line x1="0" y1="0" x2="${fmt(s.width)}" y2="${fmt(s.height)}"${common}/>`
    case 'triangle':
      return `<polygon points="${fmt(s.width / 2)},0 ${fmt(s.width)},${fmt(s.height)} 0,${fmt(s.height)}"${common}/>`
    case 'polygon': {
      const sides = s.sides ?? 6
      const cx = s.width / 2
      const cy = s.height / 2
      const rx = s.width / 2
      const ry = s.height / 2
      const pts: string[] = []
      for (let i = 0; i < sides; i++) {
        const a = (Math.PI * 2 * i) / sides - Math.PI / 2
        pts.push(`${fmt(cx + rx * Math.cos(a))},${fmt(cy + ry * Math.sin(a))}`)
      }
      return `<polygon points="${pts.join(' ')}"${common}/>`
    }
    case 'star': {
      const points = s.points ?? 5
      const inner = s.innerRatio ?? 0.45
      const cx = s.width / 2
      const cy = s.height / 2
      const outerR = Math.min(s.width, s.height) / 2
      const innerR = outerR * inner
      const pts: string[] = []
      for (let i = 0; i < points * 2; i++) {
        const a = (Math.PI * i) / points - Math.PI / 2
        const r = i % 2 === 0 ? outerR : innerR
        pts.push(`${fmt(cx + r * Math.cos(a))},${fmt(cy + r * Math.sin(a))}`)
      }
      return `<polygon points="${pts.join(' ')}"${common}/>`
    }
    case 'text': {
      const anchor = s.textAlign === 'left' ? 'start' : s.textAlign === 'right' ? 'end' : 'middle'
      const x = s.textAlign === 'left' ? 0 : s.textAlign === 'right' ? s.width : s.width / 2
      const y = s.height / 2
      const family = escapeXml(s.fontFamily)
      const weight = typeof s.fontWeight === 'number' ? s.fontWeight : s.fontWeight
      return (
        `<text x="${fmt(x)}" y="${fmt(y)}" ` +
        `dominant-baseline="central" text-anchor="${anchor}" ` +
        `font-family="${family}" ` +
        `font-size="${fmt(s.fontSize)}" ` +
        `font-weight="${weight}" ` +
        `line-height="${fmtNumber(s.lineHeight)}"${common}>` +
        `${escapeXml(s.text || '')}` +
        `</text>`
      )
    }
    case 'path': {
      // 把 d 按 width/100, height/100 缩放，这样默认 path 是 100x100 viewBox，用户调整尺寸时 path 会跟着缩放
      const sx = s.width / 100
      const sy = s.height / 100
      return (
        `<g transform="scale(${fmtNumber(sx)},${fmtNumber(sy)})">` +
        `<path d="${s.d}"${common}/>` +
        `</g>`
      )
    }
  }
}

export function commonAttrs(s: Shape): string {
  const parts: string[] = []
  if (s.fill) parts.push(`fill="${s.fill === 'none' ? 'none' : escapeXml(s.fill)}"`)
  if (s.stroke) parts.push(`stroke="${s.stroke === 'none' ? 'none' : escapeXml(s.stroke)}"`)
  if (s.strokeWidth > 0) parts.push(`stroke-width="${fmt(s.strokeWidth)}"`)
  if (s.opacity < 1) parts.push(`opacity="${fmtNumber(s.opacity)}"`)
  if (parts.length === 0) return ''
  return ' ' + parts.join(' ')
}

export function fmt(v: number): string {
  return Number.isFinite(v) ? (Math.round(v * 100) / 100).toString() : '0'
}
export function fmtNumber(v: number): string {
  return Number.isFinite(v) ? (Math.round(v * 1000) / 1000).toString() : '0'
}

export function escapeXml(str: string): string {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
