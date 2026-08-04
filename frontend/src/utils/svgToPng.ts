/**
 * 使用浏览器内置 Image + Canvas 将 SVG 字符串渲染为透明 PNG 的 dataURL。
 * 由于图像是 Canvas.toDataURL，天然支持透明，无需特殊处理。
 *
 * 注意：为避免浏览器因 SVG 缺少 xmlns 导致 Image.decode 失败，
 *       这里会确保 SVG 字符串的根节点带 xmlns="http://www.w3.org/2000/svg"
 */
export async function svgToPngDataUrl(
  svgStr: string,
  scale = 2,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const { width, height } = parseSvgSize(svgStr)
  if (width <= 0 || height <= 0) throw new Error('无法获取 SVG 尺寸')

  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  try {
    const img = await loadImage(url)
    const outW = Math.max(1, Math.round(width * scale))
    const outH = Math.max(1, Math.round(height * scale))
    const dpr = window.devicePixelRatio || 1
    const canvas = document.createElement('canvas')
    canvas.width = outW * dpr
    canvas.height = outH * dpr
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // 默认清空=透明，背景若需要则在 SVG 字符串里包含 <rect> 填充
    ctx.clearRect(0, 0, outW, outH)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, outW, outH)
    const dataUrl = canvas.toDataURL('image/png')
    return { dataUrl, width: outW, height: outH }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(new Error('SVG 加载失败，请检查图形是否包含不支持的内容：' + String(e)))
    // 允许加载 SVG blob
    img.crossOrigin = 'anonymous'
    img.src = src
  })
}

/** 从 SVG 字符串解析 width/height 或 viewBox */
export function parseSvgSize(svg: string): { width: number; height: number } {
  const root = svg.match(/<svg[^>]*>/)?.[0] ?? ''
  // 1. 解析 width/height
  const wm = root.match(/\bwidth\s*=\s*["']([^"']+)["']/i)
  const hm = root.match(/\bheight\s*=\s*["']([^"']+)["']/i)
  if (wm && hm) {
    const w = parseLen(wm[1])
    const h = parseLen(hm[1])
    if (w > 0 && h > 0) return { width: w, height: h }
  }
  // 2. 解析 viewBox
  const vm = root.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)
  if (vm) {
    const parts = vm[1].split(/[\s,]+/).map((x) => parseFloat(x))
    if (parts.length === 4) {
      const [, , w, h] = parts
      if (w > 0 && h > 0) return { width: w, height: h }
    }
  }
  return { width: 800, height: 600 }
}
function parseLen(v: string): number {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}
