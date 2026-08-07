import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { nanoid } from 'nanoid'
import type { ProjectState, Shape, CanvasSettings, ShapeType } from '@/types/shapes'
import { createShape, createPathFromD } from '@/utils/shapeFactory'
import { buildExportSvg } from '@/utils/exportSvg'
import { t } from '@/i18n'

export type ToolMode = 'select' | 'brush' | 'polygon' | 'curve'

export interface BrushSettings {
  color: string
  width: number
  opacity: number
}

const STORAGE_KEY = 'pixel-editor-state-v1'

function defaultCanvas(): CanvasSettings {
  return {
    width: 512,
    height: 512,
    background: 'transparent',
  }
}

function defaultProject(): ProjectState {
  return {
    shapes: [],
    canvas: defaultCanvas(),
    selectedIds: [],
    version: 1,
  }
}

export const useEditorStore = defineStore('editor', () => {
  // ----- state -----
  const shapes = ref<Shape[]>([])
  const canvas = ref<CanvasSettings>(defaultCanvas())
  const selectedIds = ref<string[]>([])
  const dirty = ref(false)

  // ----- 工具模式 & 画笔设置 -----
  const toolMode = ref<ToolMode>('select')
  const brush = ref<BrushSettings>({
    color: '#0f172a',
    width: 4,
    opacity: 1,
  })

  // ----- history (简单 undo/redo，最多 50 步) -----
  // 注意：必须用 ref 包裹，computed 才能追踪长度变化，否则按钮永远 disabled
  const past = ref<string[]>([])
  const future = ref<string[]>([])
  const HISTORY_LIMIT = 50

  function snapshot(): string {
    return JSON.stringify({
      shapes: shapes.value,
      canvas: canvas.value,
    })
  }
  function restore(snap: string) {
    const parsed = JSON.parse(snap) as Pick<ProjectState, 'shapes' | 'canvas'>
    shapes.value = parsed.shapes
    canvas.value = parsed.canvas
    dirty.value = true
  }
  function commit() {
    const snap = snapshot()
    if (past.value[past.value.length - 1] === snap) return
    past.value.push(snap)
    if (past.value.length > HISTORY_LIMIT) past.value.shift()
    future.value.length = 0
    dirty.value = true
  }
  function undo() {
    if (past.value.length === 0) return
    const cur = snapshot()
    const prev = past.value.pop()!
    future.value.push(cur)
    restore(prev)
  }
  function redo() {
    if (future.value.length === 0) return
    const cur = snapshot()
    const next = future.value.pop()!
    past.value.push(cur)
    restore(next)
  }
  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  // ----- selectors -----
  const selectedShapes = computed(() =>
    shapes.value.filter((s) => selectedIds.value.includes(s.id)),
  )
  const activeShape = computed(() =>
    selectedShapes.value.length === 1 ? selectedShapes.value[0] : null,
  )
  const shapeCount = computed(() => shapes.value.length)

  // ----- load / save local -----
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      const p = JSON.parse(raw) as ProjectState
      if (p && Array.isArray(p.shapes)) {
        shapes.value = p.shapes
        canvas.value = p.canvas ?? defaultCanvas()
        selectedIds.value = []
        dirty.value = false
        return true
      }
    } catch {}
    return false
  }
  function saveToStorage() {
    const p: ProjectState = {
      shapes: shapes.value,
      canvas: canvas.value,
      selectedIds: selectedIds.value,
      version: 1,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    dirty.value = false
  }
  watch([shapes, canvas], () => saveToStorage(), { deep: true })

  // ----- mutations -----
  function addShape(shape: Shape) {
    commit()
    shapes.value.push(shape)
    selectedIds.value = [shape.id]
  }
  function addShapeByType(type: ShapeType, x = 100, y = 100) {
    const s = createShape(type, x, y)
    addShape(s)
    setToolMode('select')
    return s
  }
  function insertShapeAt(type: ShapeType, cx: number, cy: number) {
    // 把图形中心放到 (cx, cy)
    const s = createShape(type)
    s.x = cx - s.width / 2
    s.y = cy - s.height / 2
    addShape(s)
    setToolMode('select')
    return s
  }
  function updateShape(id: string, patch: Partial<Shape>) {
    const s = shapes.value.find((x) => x.id === id)
    if (!s) return
    Object.assign(s, patch)
    dirty.value = true
  }
  function updateActive(patch: Partial<Shape>) {
    if (!activeShape.value) return
    commit()
    updateShape(activeShape.value.id, patch)
  }
  function setSelected(ids: string[]) {
    selectedIds.value = ids
  }
  function selectOne(id: string, additive = false) {
    if (additive) {
      const set = new Set(selectedIds.value)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      selectedIds.value = [...set]
    } else {
      selectedIds.value = [id]
    }
  }
  function clearSelection() {
    selectedIds.value = []
  }
  function deleteSelection() {
    if (selectedIds.value.length === 0) return
    commit()
    shapes.value = shapes.value.filter((s) => !selectedIds.value.includes(s.id))
    selectedIds.value = []
  }
  function duplicateSelection() {
    if (selectedIds.value.length === 0) return
    commit()
    const newIds: string[] = []
    for (const id of selectedIds.value) {
      const idx = shapes.value.findIndex((s) => s.id === id)
      if (idx < 0) continue
      const src = shapes.value[idx]
      const copy: Shape = { ...src, x: src.x + 20, y: src.y + 20 } as Shape
      // 重新生成 id 以避免冲突
      copy.id = nanoid(10)
      // 深拷贝渐变定义，避免共享引用
      if (src.fillGradient) {
        copy.fillGradient = JSON.parse(JSON.stringify(src.fillGradient))
      }
      shapes.value.push(copy)
      newIds.push(copy.id)
    }
    selectedIds.value = newIds
  }
  function moveLayer(id: string, dir: 'up' | 'down' | 'top' | 'bottom') {
    const idx = shapes.value.findIndex((s) => s.id === id)
    if (idx < 0) return
    commit()
    const arr = shapes.value
    const [s] = arr.splice(idx, 1)
    if (dir === 'up') arr.splice(Math.min(idx + 1, arr.length), 0, s)
    else if (dir === 'down') arr.splice(Math.max(idx - 1, 0), 0, s)
    else if (dir === 'top') arr.push(s)
    else arr.unshift(s)
  }
  function reorder(fromId: string, toId: string, place: 'before' | 'after') {
    const from = shapes.value.findIndex((s) => s.id === fromId)
    const to = shapes.value.findIndex((s) => s.id === toId)
    if (from < 0 || to < 0 || from === to) return
    commit()
    const arr = shapes.value
    const [item] = arr.splice(from, 1)
    let target = arr.findIndex((s) => s.id === toId)
    if (place === 'after') target += 1
    arr.splice(target, 0, item)
  }
  function setCanvas(patch: Partial<CanvasSettings>) {
    commit()
    Object.assign(canvas.value, patch)
    dirty.value = true
  }
  function resetAll() {
    if (!confirm(t('msg.confirmClear'))) return
    commit()
    shapes.value = []
    selectedIds.value = []
  }
  // ----- 工具模式 & 画笔 -----
  function setToolMode(mode: ToolMode) {
    toolMode.value = mode
  }
  function setBrush(patch: Partial<BrushSettings>) {
    Object.assign(brush.value, patch)
  }
  /**
   * 从图形库添加自定义 path
   * @param d 源 SVG path d
   * @param sourceSize 源尺寸
   * @param x 画布位置 x
   * @param y 画布位置 y
   * @param width 目标宽
   * @param height 目标高
   */
  function addLibraryShape(params: {
    d: string
    sourceSize?: number
    name?: string
    x?: number
    y?: number
    width?: number
    height?: number
  }) {
    const { d, sourceSize, name, x = 100 + Math.random() * 80, y = 100 + Math.random() * 80, width = 120, height = 120 } = params
    const s = createPathFromD(d, { sourceSize, name, x, y, width, height })
    addShape(s)
    setToolMode('select')
    return s
  }
  /**
   * 添加画笔绘制的 path（仅描边）
   * @param pathD SVG path d（世界坐标下）
   * @param bbox 包围盒 {x,y,w,h} 世界坐标
   */
  function addBrushPath(pathD: string, bbox: { x: number; y: number; w: number; h: number }) {
    // 转换 d 中的坐标：减去 bbox.x/y，变成局部坐标，并归一化到 0-100 空间
    const w = Math.max(1, bbox.w)
    const h = Math.max(1, bbox.h)
    const localD = shiftAndScalePathD(pathD, -bbox.x, -bbox.y, 100 / w, 100 / h)
    const s = createPathFromD(localD, {
      sourceSize: 100,
      name: t('shape.brush'),
      x: bbox.x,
      y: bbox.y,
      width: w,
      height: h,
      fill: 'none',
      stroke: brush.value.color,
      strokeWidth: brush.value.width,
      source: 'brush',
    })
    s.opacity = brush.value.opacity
    addShape(s)
    return s
  }
  /**
   * 添加多边形/曲线工具绘制的 path（可填充可描边）
   * @param pathD SVG path d（世界坐标下，已包含 Z 或平滑曲线命令）
   * @param bbox 包围盒 {x,y,w,h} 世界坐标
   * @param opts 名称、填充、描边等
   */
  function addFreeformPath(
    pathD: string,
    bbox: { x: number; y: number; w: number; h: number },
    opts: { name: string; fill?: string; stroke?: string; strokeWidth?: number; source?: 'polygon' | 'curve' },
  ) {
    const w = Math.max(1, bbox.w)
    const h = Math.max(1, bbox.h)
    const localD = shiftAndScalePathD(pathD, -bbox.x, -bbox.y, 100 / w, 100 / h)
    const s = createPathFromD(localD, {
      sourceSize: 100,
      name: opts.name,
      x: bbox.x,
      y: bbox.y,
      width: w,
      height: h,
      fill: opts.fill ?? 'none',
      stroke: opts.stroke ?? brush.value.color,
      strokeWidth: opts.strokeWidth ?? brush.value.width,
      source: opts.source,
    })
    s.opacity = brush.value.opacity
    addShape(s)
    return s
  }
  function loadProjectJSON(json: string) {
    try {
      const p = JSON.parse(json) as ProjectState
      if (!p || !Array.isArray(p.shapes)) throw new Error(t('msg.invalidFormat'))
      commit()
      shapes.value = p.shapes
      canvas.value = p.canvas ?? defaultCanvas()
      selectedIds.value = []
      dirty.value = true
      return true
    } catch (e: any) {
      alert(t('msg.importFail') + (e?.message ?? String(e)))
      return false
    }
  }
  function toProjectJSON(): string {
    const p: ProjectState = {
      shapes: shapes.value,
      canvas: canvas.value,
      selectedIds: selectedIds.value,
      version: 1,
    }
    return JSON.stringify(p, null, 2)
  }

  // 导出相关
  function exportSvgString(): string {
    return buildExportSvg(shapes.value, canvas.value)
  }

  // 对齐辅助
  function alignSelection(kind: 'left' | 'right' | 'hcenter' | 'top' | 'bottom' | 'vcenter') {
    if (selectedShapes.value.length < 2) return
    commit()
    const boxes = selectedShapes.value.map((s) => ({
      s,
      l: s.x,
      r: s.x + s.width,
      t: s.y,
      b: s.y + s.height,
      cx: s.x + s.width / 2,
      cy: s.y + s.height / 2,
    }))
    const minL = Math.min(...boxes.map((b) => b.l))
    const maxR = Math.max(...boxes.map((b) => b.r))
    const minT = Math.min(...boxes.map((b) => b.t))
    const maxB = Math.max(...boxes.map((b) => b.b))
    const midCx = (minL + maxR) / 2
    const midCy = (minT + maxB) / 2
    for (const b of boxes) {
      if (kind === 'left') b.s.x = minL
      else if (kind === 'right') b.s.x = maxR - b.s.width
      else if (kind === 'hcenter') b.s.x = midCx - b.s.width / 2
      else if (kind === 'top') b.s.y = minT
      else if (kind === 'bottom') b.s.y = maxB - b.s.height
      else if (kind === 'vcenter') b.s.y = midCy - b.s.height / 2
    }
    dirty.value = true
  }

  // ----- path 辅助函数（内部用）-----
  /**
   * 对 SVG path d 中的所有坐标做 (dx + x*sx, dy + y*sy)
   * 仅用于 M/L/C/S/Q/T/A 里的绝对坐标数字（相对坐标 m/l/c/... 会乘 sx/sy）
   * 这里做简化处理：对所有数字都做 translate + scale，因为画笔产出的是绝对坐标折线
   */
  function shiftAndScalePathD(d: string, dx: number, dy: number, sx: number, sy: number): string {
    return d.replace(/([a-zA-Z]?)([\s,]*)([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)([\s,]+)([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)/g, (_m, cmd, sp1, xStr, sp2, yStr) => {
      const x = parseFloat(xStr)
      const y = parseFloat(yStr)
      if (isNaN(x) || isNaN(y)) return _m
      const nx = ((x + dx) * sx).toFixed(4).replace(/\.?0+$/, '')
      const ny = ((y + dy) * sy).toFixed(4).replace(/\.?0+$/, '')
      return `${cmd || ''}${sp1}${nx}${sp2}${ny}`
    })
  }

  return {
    // state
    shapes,
    canvas,
    selectedIds,
    dirty,
    toolMode,
    brush,
    // selectors
    selectedShapes,
    activeShape,
    shapeCount,
    canUndo,
    canRedo,
    // actions
    loadFromStorage,
    saveToStorage,
    addShape,
    addShapeByType,
    insertShapeAt,
    updateShape,
    updateActive,
    setSelected,
    selectOne,
    clearSelection,
    deleteSelection,
    duplicateSelection,
    moveLayer,
    reorder,
    setCanvas,
    resetAll,
    loadProjectJSON,
    toProjectJSON,
    exportSvgString,
    alignSelection,
    undo,
    redo,
    commit,
    setToolMode,
    setBrush,
    addLibraryShape,
    addBrushPath,
    addFreeformPath,
  }
})
