<template>
  <div
    ref="viewportEl"
    class="canvas-viewport"
    @dragover.prevent="onDragOver"
    @drop="onDrop"
    @keydown="onKey"
    tabindex="0"
  >
    <!-- 画布外框：居中显示，带阴影 -->
    <div
      class="canvas-wrapper"
      :style="canvasWrapperStyle"
      @mousedown.self="onCanvasMouseDown"
    >
      <!-- 棋盘格背景（仅用于显示透明背景的视觉效果，导出时不含） -->
      <div class="checker-bg" :style="{ width: '100%', height: '100%' }"></div>
      <!-- 可选：纯色背景层（仅当 canvas.background !== 'transparent' 时显示） -->
      <div
        v-if="editor.canvas.background !== 'transparent'"
        class="solid-bg"
        :style="{ backgroundColor: editor.canvas.background as string }"
      ></div>

      <!-- SVG 画布本身 -->
      <svg
        ref="svgEl"
        class="canvas-svg"
        :width="editor.canvas.width"
        :height="editor.canvas.height"
        :viewBox="`0 0 ${editor.canvas.width} ${editor.canvas.height}`"
        @mousedown="onSvgMouseDown"
      >
        <!-- 每个 shape 一个 group（可点击） -->
        <g
          v-for="s in editor.shapes"
          :key="s.id"
          class="shape-g"
          :class="{
            selected: editor.selectedIds.includes(s.id),
            hidden: !s.visible,
            locked: s.locked,
          }"
          :transform="shapeTransform(s)"
          @mousedown.stop="onShapeMouseDown($event, s)"
          @dblclick.stop="onShapeDblClick($event, s)"
        >
          <!-- hit-area 用于透明填充时仍可选中；line 类型不做此处理 -->
          <rect
            v-if="s.type !== 'line'"
            class="hit-area"
            x="-4"
            y="-4"
            :width="s.width + 8"
            :height="s.height + 8"
            fill="transparent"
          />
          <g
            class="shape-inner"
            :class="{ 'editing-hidden': editingTextId === s.id && s.type === 'text' }"
            v-html="shapeInnerSvg(s)"
          ></g>
        </g>

        <!-- 选中外框 & 操作手柄 -->
        <template v-if="box != null">
          <!-- 外边框 + 十字旋转杆 -->
          <g :transform="`translate(${box.x},${box.y}) rotate(${box.rotation}, ${box.w / 2}, ${box.h / 2})`">
            <rect
              class="sel-outline"
              x="0"
              y="0"
              :width="box.w"
              :height="box.h"
              fill="none"
              stroke="#6366f1"
              stroke-width="1.5"
              stroke-dasharray="5 4"
              vector-effect="non-scaling-stroke"
            />
            <!-- 8 个缩放手柄 -->
            <rect
              v-for="h in scaleHandles"
              :key="'s' + h.pos"
              :x="h.x - 5"
              :y="h.y - 5"
              width="10"
              height="10"
              fill="#fff"
              stroke="#6366f1"
              stroke-width="1.5"
              class="handle scale-handle"
              :style="{ cursor: h.cursor }"
              @mousedown.stop="onScaleHandleDown($event, h.pos)"
            />
            <!-- 旋转手柄：顶部中点往上延伸 24px -->
            <line
              x1="box.w / 2"
              y1="0"
              x2="box.w / 2"
              y2="-28"
              stroke="#6366f1"
              stroke-width="1.5"
              vector-effect="non-scaling-stroke"
            />
            <circle
              :cx="box.w / 2"
              :cy="-28"
              r="7"
              fill="#fff"
              stroke="#6366f1"
              stroke-width="1.5"
              class="handle rotate-handle"
              style="cursor: default"
              @mousedown.stop="onRotateHandleDown"
            />
          </g>
        </template>
      </svg>

      <!-- 文字编辑 input 层 -->
      <input
        v-if="editingTextShape"
        ref="editingInputRef"
        v-model="editingTextValue"
        class="text-edit-input"
        :style="editingInputStyle"
        @blur="onInputBlur"
        @keyup="onInputKeyup"
        @mousedown.stop
      />
    </div>

    <div class="canvas-hint" v-if="editor.shapes.length === 0">
      {{ t('canvas.empty.hint') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useEditorStore } from '@/store/editor'
import type { Shape, ShapeType } from '@/types/shapes'
import { shapeInnerSvg as renderInner } from '@/utils/svgRender'
import { t } from '@/i18n'

const editor = useEditorStore()

const viewportEl = ref<HTMLDivElement>()
const svgEl = ref<SVGSVGElement>()

// 文字编辑状态
const editingTextId = ref<string | null>(null)
const editingInputRef = ref<HTMLInputElement>()
const editingTextValue = ref('')

// 选中框（屏幕坐标系下的包围盒，但这里直接拿 active shape 的自身坐标）
interface SelBox {
  x: number
  y: number
  w: number
  h: number
  rotation: number
  locked: boolean
}
const box = computed<SelBox | null>(() => {
  const s = editor.activeShape
  if (!s) return null
  return { x: s.x, y: s.y, w: s.width, h: s.height, rotation: s.rotation, locked: s.locked }
})

// 正在编辑的文字形状
const editingTextShape = computed(() => {
  if (!editingTextId.value) return null
  return editor.shapes.find((s) => s.id === editingTextId.value && s.type === 'text') as import('@/types/shapes').TextShape | undefined
})

// 编辑输入框的样式位置（在 SVG 坐标系中）
const editingInputStyle = computed(() => {
  const s = editingTextShape.value
  if (!s) return {}
  const weight = s.fontWeight
  const align = s.textAlign || 'left'
  return {
    left: `${s.x}px`,
    top: `${s.y}px`,
    width: `${s.width}px`,
    height: `${s.height}px`,
    transform: `rotate(${s.rotation || 0}deg)`,
    transformOrigin: 'center center',
    position: 'absolute' as const,
    fontSize: `${s.fontSize}px`,
    fontFamily: s.fontFamily,
    fontWeight: weight,
    textAlign: align,
    lineHeight: `${s.lineHeight}`,
    color: s.fill === 'none' ? '#000' : s.fill,
  }
})

function shapeTransform(s: Shape): string {
  const rot = s.rotation ? ` rotate(${s.rotation} ${s.width / 2} ${s.height / 2})` : ''
  return `translate(${s.x} ${s.y})${rot}`
}
function shapeInnerSvg(s: Shape): string {
  return renderInner(s)
}

// 画布 wrapper 尺寸：固定，外层做 auto fit
const canvasWrapperStyle = computed(() => {
  return {
    width: editor.canvas.width + 'px',
    height: editor.canvas.height + 'px',
  }
})

// ---------- 缩放手柄定义 ----------
// 8 个手柄在 0° 时的基础光标方向
const BASE_CURSORS: Record<string, string> = {
  tl: 'nwse-resize', tc: 'ns-resize', tr: 'nesw-resize',
  ml: 'ew-resize', mr: 'ew-resize',
  bl: 'nesw-resize', bc: 'ns-resize', br: 'nwse-resize',
}
// 浏览器只有 4 种 resize 光标，按 90° 步进旋转后的映射
const ROTATE_MAP: Record<string, string[]> = {
  'nwse-resize': ['nwse-resize', 'nesw-resize', 'nwse-resize', 'nesw-resize'],
  'nesw-resize': ['nesw-resize', 'nwse-resize', 'nesw-resize', 'nwse-resize'],
  'ns-resize':   ['ns-resize', 'ew-resize', 'ns-resize', 'ew-resize'],
  'ew-resize':   ['ew-resize', 'ns-resize', 'ew-resize', 'ns-resize'],
}

const scaleHandles = computed(() => {
  if (!box.value) return []
  const { w, h, rotation } = box.value
  // 将旋转角度按 90° 就近量化（0/90/180/270）
  const step = Math.round((((rotation % 360) + 360) % 360) / 90) % 4
  const positions = [
    { pos: 'tl', x: 0, y: 0 },
    { pos: 'tc', x: w / 2, y: 0 },
    { pos: 'tr', x: w, y: 0 },
    { pos: 'ml', x: 0, y: h / 2 },
    { pos: 'mr', x: w, y: h / 2 },
    { pos: 'bl', x: 0, y: h },
    { pos: 'bc', x: w / 2, y: h },
    { pos: 'br', x: w, y: h },
  ]
  return positions.map(p => ({
    ...p,
    cursor: getScaleCursor(p.pos, rotation),
  }))
})

function getScaleCursor(pos: string, rotation: number): string {
  const step = Math.round((((rotation % 360) + 360) % 360) / 90) % 4
  return ROTATE_MAP[BASE_CURSORS[pos]][step]
}

// ---------- 拖动相关 ----------
type DragMode = null | 'move' | 'scale' | 'rotate'
interface DragState {
  mode: DragMode
  startMouse: { x: number; y: number }
  startShapes: {
    id: string
    x: number
    y: number
    w: number
    h: number
    rot: number
  }[]
  handle?: string
  rotateCenter?: { x: number; y: number }
  startAngle?: number
  shift?: boolean
}
const drag = reactive<DragState>({
  mode: null,
  startMouse: { x: 0, y: 0 },
  startShapes: [],
})

function svgPointFromEvent(e: MouseEvent): { x: number; y: number } {
  if (!svgEl.value) return { x: 0, y: 0 }
  const pt = svgEl.value.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  const ctm = svgEl.value.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const p = pt.matrixTransform(ctm.inverse())
  return { x: p.x, y: p.y }
}

function onSvgMouseDown() {
  // 空白处点击不做处理，用 canvas wrapper 的 self 事件处理
}
function onCanvasMouseDown(e: MouseEvent) {
  editor.clearSelection()
  focusViewport()
}

function onShapeMouseDown(e: MouseEvent, s: Shape) {
  if (!s.visible) return
  const additive = e.shiftKey || e.metaKey || e.ctrlKey
  if (s.locked) {
    // 锁定的图形在画布上不可选中、不可拖动
    return
  }
  editor.selectOne(s.id, additive)
  editor.commit() // 让当前状态记入历史
  focusViewport()

  const p = svgPointFromEvent(e)
  drag.mode = 'move'
  drag.startMouse = { x: p.x, y: p.y }
  drag.startShapes = editor.selectedShapes.map((sh) => ({
    id: sh.id,
    x: sh.x,
    y: sh.y,
    w: sh.width,
    h: sh.height,
    rot: sh.rotation,
  }))
  drag.shift = e.shiftKey
  document.body.style.cursor = 'move'
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onScaleHandleDown(e: MouseEvent, pos: string) {
  if (!editor.activeShape || editor.activeShape.locked) return
  editor.commit()
  const p = svgPointFromEvent(e)
  drag.mode = 'scale'
  drag.handle = pos
  drag.startMouse = { x: p.x, y: p.y }
  drag.shift = e.shiftKey
  const s = editor.activeShape
  drag.startShapes = [
    { id: s.id, x: s.x, y: s.y, w: s.width, h: s.height, rot: s.rotation },
  ]
  document.body.style.cursor = getScaleCursor(pos, s.rotation)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onRotateHandleDown(e: MouseEvent) {
  if (!editor.activeShape || editor.activeShape.locked) return
  editor.commit()
  const p = svgPointFromEvent(e)
  const s = editor.activeShape
  drag.mode = 'rotate'
  drag.rotateCenter = { x: s.x + s.width / 2, y: s.y + s.height / 2 }
  drag.startAngle = Math.atan2(p.y - drag.rotateCenter.y, p.x - drag.rotateCenter.x)
  drag.startShapes = [{ id: s.id, x: s.x, y: s.y, w: s.width, h: s.height, rot: s.rotation }]
  document.body.style.cursor = 'crosshair'
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  if (!drag.mode) return
  const p = svgPointFromEvent(e)
  if (drag.mode === 'move') {
    const dx = p.x - drag.startMouse.x
    const dy = p.y - drag.startMouse.y
    for (const init of drag.startShapes) {
      editor.updateShape(init.id, { x: init.x + dx, y: init.y + dy })
    }
  } else if (drag.mode === 'scale' && drag.handle && drag.startShapes[0]) {
    const init = drag.startShapes[0]
    const pos = drag.handle
    const rad = (init.rot * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    // 以图形中心为原点，将起始点与当前点都逆旋转到本地坐标系
    const cx = init.x + init.w / 2
    const cy = init.y + init.h / 2
    const toLocal = (px: number, py: number) => {
      const gx = px - cx
      const gy = py - cy
      return { x: gx * cos + gy * sin, y: -gx * sin + gy * cos }
    }
    const v0 = toLocal(drag.startMouse.x, drag.startMouse.y)
    const v = toLocal(p.x, p.y)
    // 手柄在本地空间的固定方向符号
    const sx = pos.includes('r') ? 1 : pos.includes('l') ? -1 : 0
    const sy = pos.includes('b') ? 1 : pos.includes('t') ? -1 : 0
    let w = init.w
    let h = init.h
    const deltaX = v.x - v0.x
    const deltaY = v.y - v0.y
    const keepRatio = e.shiftKey || pos === 'br' || pos === 'tl' || pos === 'tr' || pos === 'bl'
    if (keepRatio && (pos === 'tl' || pos === 'tr' || pos === 'bl' || pos === 'br')) {
      // 对角等比缩放：固定对角为锚点，用距离比例作为单一缩放因子（fabric.js 方案）
      const fixedLX = -sx * init.w / 2
      const fixedLY = -sy * init.h / 2
      const d0 = Math.hypot(v0.x - fixedLX, v0.y - fixedLY)
      const d = Math.hypot(v.x - fixedLX, v.y - fixedLY)
      const scale = d0 > 0 ? d / d0 : 1
      w = Math.max(1, init.w * scale)
      h = Math.max(1, init.h * scale)
    } else {
      // 自由缩放：直接用鼠标增量
      if (sx !== 0) w = Math.max(1, init.w + deltaX * sx)
      if (sy !== 0) h = Math.max(1, init.h + deltaY * sy)
    }
    // 在本地坐标系中计算新的中心点（固定对应的边/角）
    let localCx = 0
    let localCy = 0
    if (sx === -1) {
      // 左侧手柄：右边固定，localCx = init.w/2 - w/2
      localCx = init.w / 2 - w / 2
    } else if (sx === 1) {
      // 右侧手柄：左边固定，localCx = -init.w/2 + w/2
      localCx = -init.w / 2 + w / 2
    }
    if (sy === -1) {
      // 上侧手柄：下边固定，localCy = init.h/2 - h/2
      localCy = init.h / 2 - h / 2
    } else if (sy === 1) {
      // 下侧手柄：上边固定，localCy = -init.h/2 + h/2
      localCy = -init.h / 2 + h / 2
    }
    // 将本地中心反变换回世界坐标
    const cos2 = Math.cos(rad)
    const sin2 = Math.sin(rad)
    const newCx = localCx * cos2 - localCy * sin2 + cx
    const newCy = localCx * sin2 + localCy * cos2 + cy
    const x = newCx - w / 2
    const y = newCy - h / 2
    editor.updateShape(init.id, { x, y, width: w, height: h })
  } else if (drag.mode === 'rotate' && drag.rotateCenter && drag.startShapes[0]) {
    const init = drag.startShapes[0]
    const ang = Math.atan2(p.y - drag.rotateCenter.y, p.x - drag.rotateCenter.x)
    let deg = ((ang - (drag.startAngle ?? 0)) * 180) / Math.PI + init.rot
    if (e.shiftKey) {
      deg = Math.round(deg / 15) * 15
    }
    deg = ((deg % 360) + 360) % 360
    editor.updateShape(init.id, { rotation: deg })
  }
}

function onMouseUp() {
  if (drag.mode) {
    editor.commit()
  }
  drag.mode = null
  drag.startShapes = []
  drag.handle = undefined
  drag.rotateCenter = undefined
  drag.startAngle = undefined
  document.body.style.cursor = ''
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

// ---------- 键盘 ----------
function focusViewport() {
  nextTick(() => viewportEl.value?.focus())
}
function onKey(e: KeyboardEvent) {
  const key = e.key
  const meta = e.metaKey || e.ctrlKey
  if (meta && key.toLowerCase() === 'z' && !e.shiftKey) {
    e.preventDefault()
    editor.undo()
    return
  }
  if ((meta && e.shiftKey && key.toLowerCase() === 'z') || (meta && key.toLowerCase() === 'y')) {
    e.preventDefault()
    editor.redo()
    return
  }
  if (meta && key.toLowerCase() === 'a') {
    e.preventDefault()
    editor.setSelected(editor.shapes.filter((s) => s.visible).map((s) => s.id))
    return
  }
  if (key === 'Delete' || key === 'Backspace') {
    const tgt = e.target as HTMLElement
    if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA')) return
    e.preventDefault()
    editor.deleteSelection()
    return
  }
  if (meta && key.toLowerCase() === 'd') {
    e.preventDefault()
    editor.duplicateSelection()
    return
  }
  // 方向键：移动选中 1px；Shift 移动 10px
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
    const tgt = e.target as HTMLElement
    if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA')) return
    if (editor.selectedShapes.length === 0) return
    e.preventDefault()
    const step = e.shiftKey ? 10 : 1
    let dx = 0,
      dy = 0
    if (key === 'ArrowUp') dy -= step
    else if (key === 'ArrowDown') dy += step
    else if (key === 'ArrowLeft') dx -= step
    else if (key === 'ArrowRight') dx += step
    for (const s of editor.selectedShapes) {
      editor.updateShape(s.id, { x: s.x + dx, y: s.y + dy })
    }
  }
}

// ---------- 拖放：从左侧图形库放进来 ----------
function onDragOver(e: DragEvent) {
  if (!e.dataTransfer) return
  if (e.dataTransfer.types.includes('application/x-pixel-shape')) {
    e.dataTransfer.dropEffect = 'copy'
  }
}
function onDrop(e: DragEvent) {
  if (!e.dataTransfer) return
  const shapeType = e.dataTransfer.getData('application/x-pixel-shape') as ShapeType
  if (!shapeType) return
  // 把 drop 点转换为 svg 坐标
  const p = svgPointFromEvent(e as any)
  editor.insertShapeAt(shapeType, p.x, p.y)
}

// ---------- 文字双击编辑 ----------
function onShapeDblClick(e: MouseEvent, s: Shape) {
  if (s.type !== 'text') return
  e.stopPropagation()
  
  // 先取消当前拖动状态
  if (drag.mode) {
    drag.mode = null
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }
  
  const textShape = s as import('@/types/shapes').TextShape
  editingTextId.value = s.id
  editingTextValue.value = textShape.text
  
  // 聚焦输入框，光标定位到文字末尾
  nextTick(() => {
    if (editingInputRef.value) {
      const el = editingInputRef.value
      el.focus()
      const len = el.value.length
      el.setSelectionRange(len, len)
    }
  })
}

function onInputBlur() {
  if (!editingTextId.value) return
  saveAndExitEdit()
}

function onInputKeyup(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    saveAndExitEdit()
  } else if (e.key === 'Escape') {
    // ESC 取消编辑，恢复原值
    cancelEdit()
  }
}

function saveAndExitEdit() {
  if (!editingTextId.value) return
  const newText = editingTextValue.value
  editor.updateShape(editingTextId.value, { text: newText })
  editor.commit()
  exitEdit()
}

function cancelEdit() {
  exitEdit()
}

function exitEdit() {
  editingTextId.value = null
  editingTextValue.value = ''
}

onMounted(() => {
  // 加载本地缓存
  editor.loadFromStorage()
  focusViewport()
})

// 当 shapes 变化时确保 viewport 仍可聚焦
watch(
  () => editor.shapes.length,
  () => focusViewport(),
)
</script>

<style scoped>
.canvas-viewport {
  position: relative;
  flex: 1;
  overflow: auto;
  background:
    radial-gradient(circle at 20% 20%, var(--primary-glow), transparent 60%),
    radial-gradient(circle at 80% 70%, color-mix(in srgb, var(--accent) 5%, transparent), transparent 60%),
    var(--bg);
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
}
.canvas-wrapper {
  position: relative;
  box-shadow: var(--shadow), 0 0 0 1px var(--border);
  border-radius: 2px;
  overflow: hidden;
}
.checker-bg {
  position: absolute;
  left: 0;
  top: 0;
  background-image:
    linear-gradient(45deg, var(--border) 25%, transparent 25%),
    linear-gradient(-45deg, var(--border) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--border) 75%),
    linear-gradient(-45deg, transparent 75%, var(--border) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  background-color: var(--surface-2);
}
.solid-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.canvas-svg {
  position: relative;
  display: block;
}
.shape-g {
  cursor: default;
}
.shape-g.locked {
  cursor: not-allowed;
}
.shape-g.hidden {
  opacity: 0.4;
  pointer-events: none;
}
.shape-g .shape-inner.editing-hidden {
  visibility: hidden;
}
.shape-g.selected .hit-area {
  /* visible only when dev needed */
}
.hit-area {
  pointer-events: fill;
}
.handle {
  vector-effect: non-scaling-stroke;
}
.sel-outline {
  pointer-events: none;
}

.canvas-hint {
  position: absolute;
  left: 50%;
  bottom: 30px;
  transform: translateX(-50%);
  color: var(--text-dim);
  font-size: 13px;
  background: color-mix(in srgb, var(--surface) 80%, transparent);
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  backdrop-filter: blur(4px);
  pointer-events: none;
}
.text-edit-input {
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  margin: 0;
  color: inherit;
  caret-color: currentColor;
  min-width: 0;
  box-sizing: border-box;
  z-index: 100;
}
.text-edit-input::selection {
  background: color-mix(in srgb, var(--primary) 30%, transparent);
}
</style>
