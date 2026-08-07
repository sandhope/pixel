// ---------- 图形类型与数据模型 ----------

export type ShapeType =
  | 'rect'
  | 'circle'
  | 'ellipse'
  | 'line'
  | 'triangle'
  | 'star'
  | 'polygon'
  | 'text'
  | 'path'

export interface BaseShape {
  id: string
  type: ShapeType
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number // 角度 0-360
  fill: string // 填充色，'none' 表示不填充
  stroke: string // 描边色，'none' 表示不描边
  strokeWidth: number
  opacity: number // 0-1
  visible: boolean
  locked: boolean
}

export interface RectShape extends BaseShape {
  type: 'rect'
  radius: number // 圆角
}

export interface CircleShape extends BaseShape {
  type: 'circle'
}

export interface EllipseShape extends BaseShape {
  type: 'ellipse'
}

export interface LineShape extends BaseShape {
  type: 'line'
  // 以 (x,y) 和 (x+width, y+height) 作为两个端点
}

export interface TriangleShape extends BaseShape {
  type: 'triangle'
}

export interface StarShape extends BaseShape {
  type: 'star'
  points: number // 角数，默认 5
  innerRatio: number // 内径/外径，默认 0.45
}

export interface PolygonShape extends BaseShape {
  type: 'polygon'
  sides: number // 边数，默认 6
}

export interface TextShape extends BaseShape {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  fontWeight: number | 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
}

export interface PathShape extends BaseShape {
  type: 'path'
  /** 绝对路径字符串，使用 viewBox 坐标系下，0,0 为原点。渲染时会被 translate(x,y) */
  d: string
  /** 标记该 path 由哪个绘制工具产生，用于图层缩略图区分图标 */
  source?: 'brush' | 'polygon' | 'curve'
}

export type Shape =
  | RectShape
  | CircleShape
  | EllipseShape
  | LineShape
  | TriangleShape
  | StarShape
  | PolygonShape
  | TextShape
  | PathShape

export interface CanvasSettings {
  width: number
  height: number
  /** 背景：'transparent' | 颜色；导出时若不是透明则作为背景色
   *  UI 上透明时显示棋盘格
   */
  background: 'transparent' | string
}

export interface ProjectState {
  shapes: Shape[]
  canvas: CanvasSettings
  selectedIds: string[]
  version: number
}
