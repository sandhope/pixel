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
          <g class="shape-inner" v-html="shapeInnerSvg(s)"></g>
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
              style="cursor: grab"
              @mousedown.stop="onRotateHandleDown"
            />
          </g>
        </template>
      </svg>
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
const scaleHandles = computed(() => {
  if (!box.value) return []
  const { w, h } = box.value
  return [
    { pos: 'tl', x: 0, y: 0, cursor: 'nwse-resize' },
    { pos: 'tc', x: w / 2, y: 0, cursor: 'ns-resize' },
    { pos: 'tr', x: w, y: 0, cursor: 'nesw-resize' },
    { pos: 'ml', x: 0, y: h / 2, cursor: 'ew-resize' },
    { pos: 'mr', x: w, y: h / 2, cursor: 'ew-resize' },
    { pos: 'bl', x: 0, y: h, cursor: 'nesw-resize' },
    { pos: 'bc', x: w / 2, y: h, cursor: 'ns-resize' },
    { pos: 'br', x: w, y: h, cursor: 'nwse-resize' },
  ]
})

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
  const { mode: _m, ...rest } = drag as any
  void _m
  void rest
  // 允许开始框选（先不实现多框选，仅清除选择）
  void e
}

function onShapeMouseDown(e: MouseEvent, s: Shape) {
  if (!s.visible) return
  const additive = e.shiftKey || e.metaKey || e.ctrlKey
  if (s.locked && !editor.selectedIds.includes(s.id)) {
    // 锁的图形不允许首次被选（已选中则仍可被操作？这里统一禁止操作锁定）
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
    // 旋转后再缩放比较复杂，这里仅对 rotation===0 的图形做精确缩放，其他情况先降维（保持宽度/高度变换）
    const dx = p.x - drag.startMouse.x
    const dy = p.y - drag.startMouse.y
    let x = init.x
    let y = init.y
    let w = init.w
    let h = init.h
    const pos = drag.handle
    const keepRatio = e.shiftKey || pos === 'br' || pos === 'tl' || pos === 'tr' || pos === 'bl'
    const ratio = init.w / init.h
    if (pos.includes('r')) w = Math.max(1, init.w + dx)
    if (pos.includes('b')) h = Math.max(1, init.h + dy)
    if (pos.includes('l')) {
      w = Math.max(1, init.w - dx)
      x = init.x + (init.w - w)
    }
    if (pos.includes('t')) {
      h = Math.max(1, init.h - dy)
      y = init.y + (init.h - h)
    }
    if (keepRatio) {
      // 取变化较大的那个维度，另一维按比例
      if (pos === 'tl' || pos === 'tr' || pos === 'bl' || pos === 'br') {
        if (Math.abs(w - init.w) / Math.max(1, init.w) > Math.abs(h - init.h) / Math.max(1, init.h)) {
          h = Math.max(1, w / ratio)
          if (pos.includes('t')) y = init.y + (init.h - h)
        } else {
          w = Math.max(1, h * ratio)
          if (pos.includes('l')) x = init.x + (init.w - w)
        }
      }
    }
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
  cursor: move;
}
.shape-g.locked {
  cursor: not-allowed;
}
.shape-g.hidden {
  opacity: 0.4;
  pointer-events: none;
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
.scale-handle:active,
.rotate-handle:active {
  cursor: grabbing !important;
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
</style>
