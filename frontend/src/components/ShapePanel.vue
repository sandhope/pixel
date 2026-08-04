<template>
  <div class="shape-panel">
    <div class="panel-title">图形库</div>
    <div class="shape-grid">
      <div
        v-for="item in items"
        :key="item.type"
        class="shape-item"
        draggable="true"
        @click="onClick(item.type)"
        @dragstart="onDragStart($event, item.type)"
      >
        <div class="shape-icon" v-html="item.icon"></div>
        <div class="shape-name">{{ item.name }}</div>
      </div>
    </div>

    <div class="panel-title" style="margin-top: 20px">画布</div>
    <div class="field-row">
      <label>宽</label>
      <input type="number" :value="editor.canvas.width" @change="setW" />
    </div>
    <div class="field-row">
      <label>高</label>
      <input type="number" :value="editor.canvas.height" @change="setH" />
    </div>
    <div class="field-row">
      <label>背景</label>
      <div class="bg-picker">
        <button
          class="bg-transparent"
          :class="{ active: editor.canvas.background === 'transparent' }"
          @click="setBg('transparent')"
          title="透明背景"
        >
          <span class="checker-bg"></span>
          <span class="lbl">透明</span>
        </button>
        <input
          type="color"
          :value="editor.canvas.background === 'transparent' ? '#ffffff' : editor.canvas.background"
          @input="setBgFromColor"
          title="自定义背景色"
        />
      </div>
    </div>
    <div class="preset-sizes">
      <button v-for="p in presets" :key="p.name" @click="applyPreset(p)">
        {{ p.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/store/editor'
import type { ShapeType } from '@/types/shapes'

const editor = useEditorStore()

interface ShapeDef {
  type: ShapeType
  name: string
  icon: string
}

const items: ShapeDef[] = [
  { type: 'rect', name: '矩形', icon: rectIcon('#45B7D1') },
  { type: 'circle', name: '圆形', icon: circleIcon('#FF6B6B') },
  { type: 'ellipse', name: '椭圆', icon: ellipseIcon('#F4A261') },
  { type: 'line', name: '直线', icon: lineIcon('#22D3EE') },
  { type: 'triangle', name: '三角形', icon: triangleIcon('#A78BFA') },
  { type: 'polygon', name: '多边形', icon: hexIcon('#F472B6') },
  { type: 'star', name: '星形', icon: starIcon('#FFE66D') },
  { type: 'path', name: '心形', icon: heartIcon('#EF4444') },
  { type: 'text', name: '文字', icon: textIcon('#0f172a') },
]

function rectIcon(c: string) {
  return `<svg viewBox="0 0 48 48" width="36" height="36"><rect x="6" y="10" width="36" height="28" rx="4" fill="${c}"/></svg>`
}
function circleIcon(c: string) {
  return `<svg viewBox="0 0 48 48" width="36" height="36"><circle cx="24" cy="24" r="16" fill="${c}"/></svg>`
}
function ellipseIcon(c: string) {
  return `<svg viewBox="0 0 48 48" width="36" height="36"><ellipse cx="24" cy="24" rx="18" ry="12" fill="${c}"/></svg>`
}
function lineIcon(c: string) {
  return `<svg viewBox="0 0 48 48" width="36" height="36"><line x1="6" y1="36" x2="42" y2="12" stroke="${c}" stroke-width="4" stroke-linecap="round"/></svg>`
}
function triangleIcon(c: string) {
  return `<svg viewBox="0 0 48 48" width="36" height="36"><polygon points="24,8 42,40 6,40" fill="${c}"/></svg>`
}
function hexIcon(c: string) {
  return `<svg viewBox="0 0 48 48" width="36" height="36"><polygon points="24,6 42,16 42,32 24,42 6,32 6,16" fill="${c}"/></svg>`
}
function starIcon(c: string) {
  return `<svg viewBox="0 0 48 48" width="36" height="36"><polygon points="24,4 30,18 46,20 34,30 38,46 24,38 10,46 14,30 2,20 18,18" fill="${c}"/></svg>`
}
function heartIcon(c: string) {
  return `<svg viewBox="0 0 48 48" width="36" height="36"><path d="M24 42 C6 30 4 18 10 10 C16 4 22 6 24 14 C26 6 32 4 38 10 C44 18 42 30 24 42 Z" fill="${c}"/></svg>`
}
function textIcon(c: string) {
  return `<svg viewBox="0 0 48 48" width="36" height="36" font-family="Arial, sans-serif" font-weight="800" font-size="26" fill="${c}"><text x="24" y="32" text-anchor="middle">Aa</text></svg>`
}

function onClick(t: ShapeType) {
  editor.addShapeByType(t, 120 + Math.random() * 100, 100 + Math.random() * 100)
}
function onDragStart(e: DragEvent, t: ShapeType) {
  if (!e.dataTransfer) return
  e.dataTransfer.setData('application/x-pixel-shape', t)
  e.dataTransfer.effectAllowed = 'copy'
}

function setW(e: Event) {
  const v = parseInt((e.target as HTMLInputElement).value)
  if (v > 0) editor.setCanvas({ width: v })
}
function setH(e: Event) {
  const v = parseInt((e.target as HTMLInputElement).value)
  if (v > 0) editor.setCanvas({ height: v })
}
function setBg(v: string) {
  editor.setCanvas({ background: v as any })
}
function setBgFromColor(e: Event) {
  const v = (e.target as HTMLInputElement).value
  editor.setCanvas({ background: v })
}
function applyPreset(p: { w: number; h: number; name: string }) {
  editor.setCanvas({ width: p.w, height: p.h })
}
const presets = [
  { name: '512x512', w: 512, h: 512 },
  { name: '1024x1024', w: 1024, h: 1024 },
  { name: '1920x1080', w: 1920, h: 1080 },
  { name: '1200x630', w: 1200, h: 630 },
  { name: '800x600', w: 800, h: 600 },
]
</script>

<style scoped>
.shape-panel {
  padding: 14px 14px 20px;
  overflow-y: auto;
}
.panel-title {
  font-size: 12px;
  letter-spacing: 1px;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 10px;
  font-weight: 600;
}
.shape-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.shape-item {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 6px 8px;
  text-align: center;
  cursor: grab;
  user-select: none;
  transition: all 0.15s;
}
.shape-item:hover {
  border-color: #6366f1;
  background: #1e2540;
  transform: translateY(-1px);
}
.shape-item:active {
  cursor: grabbing;
}
.shape-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
  pointer-events: none;
}
.shape-name {
  font-size: 12px;
  color: #cbd5e1;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.field-row label {
  width: 36px;
  color: #94a3b8;
  font-size: 12px;
}
.field-row input[type='number'] {
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  color: #e2e8f0;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 12px;
}
.field-row input[type='number']:focus {
  outline: none;
  border-color: #6366f1;
}
.bg-picker {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}
.bg-transparent {
  position: relative;
  width: 38px;
  height: 28px;
  border: 1px solid #334155;
  border-radius: 6px;
  overflow: hidden;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.bg-transparent.active {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
}
.checker-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(45deg, #475569 25%, transparent 25%),
    linear-gradient(-45deg, #475569 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #475569 75%),
    linear-gradient(-45deg, transparent 75%, #475569 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
  background-color: #1e293b;
}
.bg-transparent .lbl {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f1f5f9;
  font-size: 10px;
  font-weight: 600;
  mix-blend-mode: difference;
}
.bg-picker input[type='color'] {
  width: 28px;
  height: 28px;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.preset-sizes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.preset-sizes button {
  background: #1e293b;
  border: 1px solid #334155;
  color: #cbd5e1;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
}
.preset-sizes button:hover {
  border-color: #6366f1;
  background: #1e2540;
}
</style>
