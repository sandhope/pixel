import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { nanoid } from 'nanoid'
import type { ProjectState, Shape, CanvasSettings, ShapeType } from '@/types/shapes'
import { createShape } from '@/utils/shapeFactory'
import { buildExportSvg } from '@/utils/exportSvg'
import { t } from '@/i18n'

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
    return s
  }
  function insertShapeAt(type: ShapeType, cx: number, cy: number) {
    // 把图形中心放到 (cx, cy)
    const s = createShape(type)
    s.x = cx - s.width / 2
    s.y = cy - s.height / 2
    addShape(s)
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

  return {
    // state
    shapes,
    canvas,
    selectedIds,
    dirty,
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
  }
})
