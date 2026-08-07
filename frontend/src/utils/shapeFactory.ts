import { nanoid } from 'nanoid'
import type {
  Shape,
  ShapeType,
  RectShape,
  CircleShape,
  EllipseShape,
  LineShape,
  TriangleShape,
  StarShape,
  PolygonShape,
  TextShape,
  PathShape,
} from '@/types/shapes'
import { t } from '@/i18n'
import { librarySize } from '@/utils/shapeLibrary'

const palette = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFE66D',
  '#F4A261',
  '#A78BFA',
  '#F472B6',
  '#22D3EE',
  '#FBBF24',
]

function pickColor(i: number) {
  return palette[i % palette.length]
}

let n = 0
function nextColor() {
  return pickColor(n++)
}

export function createShape(type: ShapeType, x = 100, y = 100, overrides: Partial<Shape> = {}): Shape {
  const base = {
    id: nanoid(10),
    type,
    name: defaultName(type),
    x,
    y,
    width: 120,
    height: 120,
    rotation: 0,
    fill: nextColor(),
    stroke: 'none',
    strokeWidth: 0,
    opacity: 1,
    visible: true,
    locked: false,
  }

  let out: Shape
  switch (type) {
    case 'rect':
      out = { ...base, type, radius: 12 } as RectShape
      break
    case 'circle':
      out = { ...base, type } as CircleShape
      break
    case 'ellipse':
      out = { ...base, type, width: 160, height: 100 } as EllipseShape
      break
    case 'line':
      out = {
        ...base,
        type,
        width: 160,
        height: 0,
        fill: 'none',
        stroke: nextColor(),
        strokeWidth: 3,
      } as LineShape
      break
    case 'triangle':
      out = { ...base, type } as TriangleShape
      break
    case 'star':
      out = { ...base, type, points: 5, innerRatio: 0.45 } as StarShape
      break
    case 'polygon':
      out = { ...base, type, sides: 6 } as PolygonShape
      break
    case 'text':
      out = {
        ...base,
        type,
        width: 220,
        height: 64,
        text: 'LOGO',
        fontSize: 48,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        fontWeight: 700,
        textAlign: 'center',
        lineHeight: 1.2,
        fill: '#0f172a',
      } as TextShape
      break
    case 'path':
    default:
      out = {
        ...base,
        type: 'path',
        // 默认一个心形 SVG path
        d: heartPath(),
      } as PathShape
      break
  }
  return { ...out, ...overrides } as Shape
}

function defaultName(type: ShapeType): string {
  const map: Record<ShapeType, string> = {
    rect: t('shape.rect'),
    circle: t('shape.circle'),
    ellipse: t('shape.ellipse'),
    line: t('shape.line'),
    triangle: t('shape.triangle'),
    star: t('shape.star'),
    polygon: t('shape.polygon'),
    text: t('shape.text'),
    path: t('shape.path'),
  }
  return map[type] ?? t('shape.default')
}

export function heartPath(): string {
  // viewBox 内 0,0 原点，宽高 100，使用时 scale 到 width/height
  return (
    'M50,88 ' +
    'C20,60 5,45 5,28 ' +
    'C5,12 18,2 32,2 ' +
    'C42,2 48,10 50,18 ' +
    'C52,10 58,2 68,2 ' +
    'C82,2 95,12 95,28 ' +
    'C95,45 80,60 50,88 Z'
  )
}

/**
 * 基于自定义 SVG path d 创建 PathShape
 * @param d 源 path 字符串
 * @param sourceSize 源 viewBox 大小（默认 Method-Draw 图形库 300）
 * @param targetWidth 目标图形宽度
 * @param targetHeight 目标图形高度
 * @param x 画布 x
 * @param y 画布 y
 * @param overrides 其他覆盖属性
 */
export function createPathFromD(
  d: string,
  opts: {
    sourceSize?: number
    width?: number
    height?: number
    x?: number
    y?: number
    fill?: string
    stroke?: string
    strokeWidth?: number
    name?: string
    source?: 'brush' | 'polygon' | 'curve'
  } = {},
): PathShape {
  const {
    sourceSize = librarySize(),
    width = 120,
    height = 120,
    x = 100,
    y = 100,
    fill = nextColor(),
    stroke = 'none',
    strokeWidth = 0,
    name = t('shape.path'),
    source,
  } = opts

  // 归一化：把源坐标 (0..sourceSize) 内的 path 转换到 (0..100) 空间
  const scaled = normalizePathD(d, sourceSize)

  return {
    id: nanoid(10),
    type: 'path',
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    fill,
    stroke,
    strokeWidth,
    opacity: 1,
    visible: true,
    locked: false,
    d: scaled,
    source,
  }
}

/**
 * 将 path d 归一化到 100x100 viewBox
 */
function normalizePathD(d: string, sourceSize: number): string {
  if (!d) return ''
  const scale = 100 / sourceSize
  // 使用正则替换所有数字
  return d.replace(/([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)/g, (match) => {
    const n = parseFloat(match)
    if (isNaN(n)) return match
    return (n * scale).toFixed(4).replace(/\.?0+$/, '')
  })
}
