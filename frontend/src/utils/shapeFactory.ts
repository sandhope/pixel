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
    rect: '矩形',
    circle: '圆形',
    ellipse: '椭圆',
    line: '直线',
    triangle: '三角形',
    star: '星形',
    polygon: '多边形',
    text: '文字',
    path: '路径',
  }
  return map[type] ?? '图形'
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
