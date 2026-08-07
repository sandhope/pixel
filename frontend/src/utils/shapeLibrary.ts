// ---------- 图形库管理模块 ----------
// 基于 Method-Draw 的图形库实现

import basicJson from '@/assets/shapelib/basic.json'
import arrowJson from '@/assets/shapelib/arrow.json'
import dialogBalloonJson from '@/assets/shapelib/dialog_balloon.json'
import flowchartJson from '@/assets/shapelib/flowchart.json'
import gameJson from '@/assets/shapelib/game.json'
import mathJson from '@/assets/shapelib/math.json'
import musicJson from '@/assets/shapelib/music.json'
import natureJson from '@/assets/shapelib/nature.json'
import objectJson from '@/assets/shapelib/object.json'
import socialJson from '@/assets/shapelib/social.json'
import symbolJson from '@/assets/shapelib/symbol.json'
import uiJson from '@/assets/shapelib/ui.json'
import weatherJson from '@/assets/shapelib/weather.json'

export interface ShapeLibCategory {
  id: string
  label: string
  labelKey?: string // i18n key
  data: Record<string, string> // shapeId -> path d
  sourceSize: number // 源 viewBox 尺寸
}

export interface ShapeLibShape {
  id: string
  categoryId: string
  d: string
  name: string
  sourceSize: number // 源 viewBox 尺寸
}

const DEFAULT_SIZE = 300 // Method-Draw 图形库默认 viewBox 尺寸

// 分类定义
export const SHAPE_LIB_CATEGORIES: Omit<ShapeLibCategory, 'data' | 'sourceSize'>[] = [
  { id: 'basic', label: '基础' },
  { id: 'object', label: '物品' },
  { id: 'symbol', label: '符号' },
  { id: 'arrow', label: '箭头' },
  { id: 'flowchart', label: '流程图' },
  { id: 'nature', label: '自然' },
  { id: 'game', label: '卡牌/棋牌' },
  { id: 'dialog_balloon', label: '对话框' },
  { id: 'music', label: '音乐' },
  { id: 'weather', label: '天气/时间' },
  { id: 'ui', label: 'UI 组件' },
  { id: 'social', label: '社交' },
  { id: 'math', label: '数学' },
]

interface RawLibData {
  data: Record<string, string>
  sourceSize: number
}

function loadJson(raw: any): RawLibData {
  const data = (raw?.data as Record<string, string>) || {}
  const sourceSize = (raw?.size as number) || DEFAULT_SIZE
  return { data, sourceSize }
}

// 预加载的图形库数据
const rawDataMap: Record<string, RawLibData> = {
  basic: loadJson(basicJson),
  arrow: loadJson(arrowJson),
  dialog_balloon: loadJson(dialogBalloonJson),
  flowchart: loadJson(flowchartJson),
  game: loadJson(gameJson),
  math: loadJson(mathJson),
  music: loadJson(musicJson),
  nature: loadJson(natureJson),
  object: loadJson(objectJson),
  social: loadJson(socialJson),
  symbol: loadJson(symbolJson),
  ui: loadJson(uiJson),
  weather: loadJson(weatherJson),
}

export function getShapeLibCategories(): ShapeLibCategory[] {
  return SHAPE_LIB_CATEGORIES.map((c) => ({
    ...c,
    data: rawDataMap[c.id]?.data || {},
    sourceSize: rawDataMap[c.id]?.sourceSize || DEFAULT_SIZE,
  }))
}

export function getShapesByCategory(categoryId: string): ShapeLibShape[] {
  const raw = rawDataMap[categoryId]
  if (!raw) return []
  return Object.keys(raw.data).map((id) => ({
    id,
    categoryId,
    d: raw.data[id],
    name: idToName(id),
    sourceSize: raw.sourceSize,
  }))
}

export function getShape(categoryId: string, shapeId: string): ShapeLibShape | null {
  const raw = rawDataMap[categoryId]
  if (!raw || !raw.data[shapeId]) return null
  return {
    id: shapeId,
    categoryId,
    d: raw.data[shapeId],
    name: idToName(shapeId),
    sourceSize: raw.sourceSize,
  }
}

export function librarySize(): number {
  return DEFAULT_SIZE
}

/**
 * 获取指定分类的源 viewBox 尺寸
 */
export function getCategorySourceSize(categoryId: string): number {
  return rawDataMap[categoryId]?.sourceSize || DEFAULT_SIZE
}

// 把 snake_case id 转换为可读名称（首字母大写）
function idToName(id: string): string {
  return id
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

// 生成 SVG 预览图标（用于面板缩略图）
export function makeShapeIcon(d: string, size = 40, color = '#45B7D1', sourceSize?: number): string {
  const src = sourceSize || DEFAULT_SIZE
  const off = src * 0.05
  const vb = `${-off} ${-off} ${src + off * 2} ${src + off * 2}`
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${size}" height="${size}">` +
    `<path d="${d}" fill="${color}" stroke="none" stroke-linejoin="round" stroke-linecap="round"/>` +
    `</svg>`
  )
}
