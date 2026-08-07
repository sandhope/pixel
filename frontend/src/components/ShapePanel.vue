<template>
  <div class="shape-panel">
    <!-- 绘制工具 -->
    <div class="panel-title">{{ t('panel.drawTools') }}</div>
    <div class="draw-tools">
      <button
        class="draw-btn"
        :class="{ active: editor.toolMode === 'brush' }"
        @click="editor.setToolMode('brush')"
        :title="t('toolbar.tool.brush.tip')"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
          <path d="M2 2l7.586 7.586"></path>
          <circle cx="11" cy="11" r="2"></circle>
        </svg>
        <span>{{ t('toolbar.tool.brush') }}</span>
      </button>
      <button
        class="draw-btn"
        :class="{ active: editor.toolMode === 'polygon' }"
        @click="editor.setToolMode('polygon')"
        :title="t('toolbar.tool.polygon.tip')"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2l9 6.5v9L12 22 3 17.5v-9L12 2z"></path>
        </svg>
        <span>{{ t('toolbar.tool.polygon') }}</span>
      </button>
      <button
        class="draw-btn"
        :class="{ active: editor.toolMode === 'curve' }"
        @click="editor.setToolMode('curve')"
        :title="t('toolbar.tool.curve.tip')"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 18C7 18 7 6 12 6s5 12 9 12"></path>
          <circle cx="3" cy="18" r="1.6" fill="currentColor"></circle>
          <circle cx="21" cy="18" r="1.6" fill="currentColor"></circle>
        </svg>
        <span>{{ t('toolbar.tool.curve') }}</span>
      </button>
    </div>

    <!-- 基础图形 -->
    <div class="panel-title" style="margin-top: 18px">{{ t('panel.shapes') }}</div>
    <div class="shape-grid">
      <div
        v-for="item in items"
        :key="item.type"
        class="shape-item"
        draggable="true"
        @click="onClick(item.type)"
        @dragstart="onDragStartBasic($event, item.type)"
      >
        <div class="shape-icon" v-html="item.icon"></div>
        <div class="shape-name">{{ t(item.labelKey) }}</div>
      </div>
    </div>

    <!-- 分类图形库入口按钮 -->
    <div class="lib-entry">
      <button class="lib-entry-btn" @click="$emit('open-lib')">
        <div class="lib-entry-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
        </div>
        <div class="lib-entry-text">
          <span class="lib-entry-title">{{ t('panel.shapeLibrary') }}</span>
          <span class="lib-entry-desc">{{ t('panel.shapeLibrary.desc') }}</span>
        </div>
        <div class="lib-entry-arrow">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </button>
    </div>

    <div class="panel-title" style="margin-top: 20px">{{ t('panel.canvas') }}</div>
    <div class="field-row">
      <label>{{ t('panel.width') }}</label>
      <input type="number" :value="editor.canvas.width" @change="setW" />
    </div>
    <div class="field-row">
      <label>{{ t('panel.height') }}</label>
      <input type="number" :value="editor.canvas.height" @change="setH" />
    </div>
    <div class="field-row">
      <label>{{ t('panel.background') }}</label>
      <div class="bg-picker">
        <button
          class="bg-transparent"
          :class="{ active: editor.canvas.background === 'transparent' }"
          @click="setBg('transparent')"
          :title="t('panel.transparent.tip')"
        >
          <span class="checker-bg"></span>
        </button>
        <input
          type="color"
          :value="editor.canvas.background === 'transparent' ? '#ffffff' : editor.canvas.background"
          @input="setBgFromColor"
          :title="t('panel.bgColor.tip')"
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
import { t } from '@/i18n'
import type { LocaleMessages } from '@/i18n/types'
import type { ShapeType } from '@/types/shapes'

defineEmits<{ 'open-lib': [] }>()

const editor = useEditorStore()

interface ShapeDef {
  type: ShapeType
  labelKey: keyof LocaleMessages
  icon: string
}

const items: ShapeDef[] = [
  { type: 'rect', labelKey: 'shape.rect', icon: rectIcon('#45B7D1') },
  { type: 'circle', labelKey: 'shape.circle', icon: circleIcon('#FF6B6B') },
  { type: 'ellipse', labelKey: 'shape.ellipse', icon: ellipseIcon('#F4A261') },
  { type: 'line', labelKey: 'shape.line', icon: lineIcon('#22D3EE') },
  { type: 'triangle', labelKey: 'shape.triangle', icon: triangleIcon('#A78BFA') },
  { type: 'polygon', labelKey: 'shape.polygon', icon: hexIcon('#F472B6') },
  { type: 'star', labelKey: 'shape.star', icon: starIcon('#FFE66D') },
  { type: 'path', labelKey: 'shape.path', icon: heartIcon('#EF4444') },
  { type: 'text', labelKey: 'shape.text', icon: textIcon('currentColor') },
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

function onClick(t2: ShapeType) {
  editor.addShapeByType(t2, 120 + Math.random() * 100, 100 + Math.random() * 100)
}
function onDragStartBasic(e: DragEvent, t2: ShapeType) {
  if (!e.dataTransfer) return
  e.dataTransfer.setData('application/x-pixel-shape', t2)
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
  { name: '512×512', w: 512, h: 512 },
  { name: '1024×1024', w: 1024, h: 1024 },
  { name: '1920×1080', w: 1920, h: 1080 },
  { name: '1200×630', w: 1200, h: 630 },
  { name: '800×600', w: 800, h: 600 },
]
</script>

<style scoped>
.shape-panel {
  padding: 14px 14px 20px;
  overflow-y: auto;
}

/* 绘制工具 */
.draw-tools {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.draw-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px 8px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
}
.draw-btn:hover {
  border-color: var(--primary);
  background: var(--primary-glow);
  color: var(--fg);
  transform: translateY(-1px);
}
.draw-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.panel-title {
  font-size: 12px;
  letter-spacing: 1px;
  color: var(--text-muted);
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
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 6px 8px;
  text-align: center;
  cursor: grab;
  user-select: none;
  transition: all 0.15s;
}
.shape-item:hover {
  border-color: var(--primary);
  background: var(--primary-glow);
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
  color: var(--fg);
}
.shape-name {
  font-size: 12px;
  color: var(--text-muted);
}

/* 图形库入口 */
.lib-entry {
  margin-top: 16px;
}
.lib-entry-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: linear-gradient(135deg, var(--primary-glow) 0%, var(--surface-2) 100%);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--fg);
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: left;
}
.lib-entry-btn:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px -6px color-mix(in srgb, var(--primary) 40%, transparent);
}
.lib-entry-btn:active {
  transform: translateY(0);
}
.lib-entry-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: white;
  border-radius: 8px;
}
.lib-entry-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.lib-entry-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--fg);
}
.lib-entry-desc {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lib-entry-arrow {
  color: var(--text-dim);
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.field-row label {
  width: 36px;
  color: var(--text-muted);
  font-size: 12px;
}
.field-row input[type='number'] {
  flex: 1;
  background: var(--input-bg);
  border: 1px solid var(--border);
  color: var(--fg);
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 12px;
}
.field-row input[type='number']:focus {
  outline: none;
  border-color: var(--primary);
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
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.bg-transparent.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-glow);
}
.checker-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(45deg, var(--text-dim) 25%, transparent 25%),
    linear-gradient(-45deg, var(--text-dim) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--text-dim) 75%),
    linear-gradient(-45deg, transparent 75%, var(--text-dim) 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
  background-color: var(--surface-2);
}
.bg-picker input[type='color'] {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
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
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
}
.preset-sizes button:hover {
  border-color: var(--primary);
  background: var(--primary-glow);
}
</style>
