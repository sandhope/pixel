<template>
  <div class="right-panel">
    <div class="section">
      <div class="section-title">
        <span>{{ t('panel.layers') }}</span>
        <span class="count">{{ editor.shapeCount }}</span>
      </div>
      <div class="layer-list" v-if="editor.shapes.length > 0">
        <div
          v-for="s in reversedShapes"
          :key="s.id"
          class="layer-row"
          :class="{
            active: editor.selectedIds.includes(s.id),
            hidden: !s.visible,
            locked: s.locked,
            'drop-before': dropTarget === s.id && dropPlace === 'before',
            'drop-after': dropTarget === s.id && dropPlace === 'after',
          }"
          @dragover.prevent="onRowDragOver($event, s.id)"
          @dragleave="onRowDragLeave(s.id)"
          @drop="onDrop($event, s.id)"
          @click="onClickLayer(s, $event)"
        >
          <span
            class="grip"
            draggable="true"
            @dragstart="onGripDragStart($event, s.id)"
            @dragend="onGripDragEnd"
            :title="t('layer.dragTip')"
          >
            <svg class="ico" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <circle cx="9" cy="6" r="1.6" />
              <circle cx="15" cy="6" r="1.6" />
              <circle cx="9" cy="12" r="1.6" />
              <circle cx="15" cy="12" r="1.6" />
              <circle cx="9" cy="18" r="1.6" />
              <circle cx="15" cy="18" r="1.6" />
            </svg>
          </span>
          <span class="thumb">
            <svg viewBox="0 0 24 24" width="18" height="18" v-html="thumbSvg(s)"></svg>
          </span>
          <span class="name" :title="s.name">{{ s.name }}</span>
          <div class="ops">
            <button
              class="op-btn"
              :class="{ off: !s.visible }"
              @click.stop="toggleVis(s)"
              :title="t('layer.visible.tip')"
            >
              <svg
                v-if="s.visible"
                class="ico"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                v-else
                class="ico"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
            <button
              class="op-btn"
              :class="{ on: s.locked }"
              @click.stop="toggleLock(s)"
              :title="t('layer.lock.tip')"
            >
              <svg
                v-if="s.locked"
                class="ico"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <svg
                v-else
                class="ico"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
            </button>
            <button class="op-btn danger" @click.stop="remove(s)" :title="t('layer.delete.tip')">
              <svg class="ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty">{{ t('layer.empty') }}</div>
    </div>

    <div class="section" v-if="editor.selectedShapes.length >= 2">
      <div class="section-title"><span>{{ t('panel.align') }}</span></div>
      <div class="align-grid">
        <button @click="editor.alignSelection('left')" :title="t('align.left')">⇤</button>
        <button @click="editor.alignSelection('hcenter')" :title="t('align.hcenter')">↔</button>
        <button @click="editor.alignSelection('right')" :title="t('align.right')">⇥</button>
        <button @click="editor.alignSelection('top')" :title="t('align.top')">⇡</button>
        <button @click="editor.alignSelection('vcenter')" :title="t('align.vcenter')">↕</button>
        <button @click="editor.alignSelection('bottom')" :title="t('align.bottom')">⇣</button>
      </div>
    </div>

    <div class="section" v-if="editor.activeShape">
      <div class="section-title"><span>{{ t('panel.properties') }}</span></div>
      <div class="props">
        <div class="field-row">
          <label>{{ t('prop.name') }}</label>
          <input type="text" :value="s!.name" @change="upd({ name: val($event) })" />
        </div>
        <div class="field-row two">
          <div>
            <label>X</label>
            <input type="number" :value="num(s!.x)" @change="upd({ x: numVal($event) })" />
          </div>
        </div>
        <div class="field-row">
          <label>Y</label>
          <input type="number" :value="num(s!.y)" @change="upd({ y: numVal($event) })" />
        </div>
        <div class="field-row two">
          <div>
            <label>{{ t('panel.width') }}</label>
            <input type="number" :value="num(s!.width)" min="1" @change="upd({ width: numVal($event) })" />
          </div>
        </div>
        <div class="field-row">
          <label>{{ t('panel.height') }}</label>
          <input type="number" :value="num(s!.height)" min="1" @change="upd({ height: numVal($event) })" />
        </div>
        <div class="field-row">
          <label>{{ t('prop.rotation') }}</label>
          <input
            type="number"
            :value="num(s!.rotation)"
            min="0"
            max="360"
            @change="upd({ rotation: ((numVal($event) % 360) + 360) % 360 })"
          />
        </div>
        <div class="field-row">
          <label>{{ t('prop.opacity') }}</label>
          <input
            type="number"
            :value="Math.round((s!.opacity as number) * 100)"
            min="0"
            max="100"
            @change="upd({ opacity: clamp01(numVal($event) / 100) })"
          />
        </div>

        <template v-if="s!.type === 'rect'">
          <div class="field-row">
            <label>{{ t('prop.cornerRadius') }}</label>
            <input
              type="number"
              :value="(s as any).radius"
              min="0"
              @change="updAny({ radius: Math.max(0, numVal($event)) })"
            />
          </div>
        </template>
        <template v-if="s!.type === 'star'">
          <div class="field-row two">
            <div>
              <label>{{ t('prop.points') }}</label>
              <input
                type="number"
                min="3"
                max="24"
                :value="(s as any).points"
                @change="updAny({ points: clampI(numVal($event), 3, 24) })"
              />
            </div>
          </div>
          <div class="field-row">
            <label>{{ t('prop.innerRatio') }}</label>
            <input
              type="number"
              min="0.1"
              max="0.95"
              step="0.05"
              :value="(s as any).innerRatio"
              @change="updAny({ innerRatio: clamp(numVal($event), 0.1, 0.95) })"
            />
          </div>
        </template>
        <template v-if="s!.type === 'polygon'">
          <div class="field-row">
            <label>{{ t('prop.sides') }}</label>
            <input
              type="number"
              min="3"
              max="24"
              :value="(s as any).sides"
              @change="updAny({ sides: clampI(numVal($event), 3, 24) })"
            />
          </div>
        </template>
        <template v-if="s!.type === 'text'">
          <div class="field-row">
            <label>{{ t('prop.text') }}</label>
            <input type="text" :value="(s as any).text" @change="updAny({ text: val($event) })" />
          </div>
          <div class="field-row">
            <label>{{ t('prop.fontSize') }}</label>
            <input
              type="number"
              min="8"
              :value="(s as any).fontSize"
              @change="updAny({ fontSize: Math.max(8, numVal($event)) })"
            />
          </div>
          <div class="field-row">
            <label>{{ t('prop.fontWeight') }}</label>
            <select :value="String((s as any).fontWeight)" @change="updAny({ fontWeight: parseWeight(val($event)) })">
              <option value="300">{{ t('font.weight300') }}</option>
              <option value="400">{{ t('font.weight400') }}</option>
              <option value="600">{{ t('font.weight600') }}</option>
              <option value="700">{{ t('font.weight700') }}</option>
              <option value="900">{{ t('font.weight900') }}</option>
            </select>
          </div>
          <div class="field-row">
            <label>{{ t('prop.fontFamily') }}</label>
            <select :value="(s as any).fontFamily" @change="updAny({ fontFamily: val($event) })">
              <option value='Inter, "PingFang SC", "Microsoft YaHei", sans-serif'>{{ t('font.default') }}</option>
              <option value='"PingFang SC", "Microsoft YaHei", sans-serif'>{{ t('font.pingfang') }}</option>
              <option value='"Songti SC", SimSun, serif'>{{ t('font.songti') }}</option>
              <option value='"Kaiti SC", "KaiTi", serif'>{{ t('font.kaiti') }}</option>
              <option value='"STHeiti", "Heiti SC", sans-serif'>{{ t('font.heiti') }}</option>
              <option value="Georgia, serif">Georgia</option>
              <option value='"Courier New", monospace'>Courier</option>
              <option value='"Hiragino Sans GB", sans-serif'>Hiragino</option>
            </select>
          </div>
          <div class="field-row">
            <label>{{ t('prop.align') }}</label>
            <div class="seg">
              <button
                v-for="a in aligns"
                :key="a.v"
                :class="{ on: (s as any).textAlign === a.v }"
                @click="updAny({ textAlign: a.v })"
              >
                {{ a.l }}
              </button>
            </div>
          </div>
        </template>

        <div class="field-row">
          <label>{{ t('prop.fill') }}</label>
          <div class="color-pick">
            <button
              class="none-btn"
              :class="{ on: s!.fill === 'none' }"
              @click="upd({ fill: 'none' })"
            >∅</button>
            <input
              type="color"
              :value="s!.fill === 'none' ? '#000000' : s!.fill"
              @input="upd({ fill: val($event) })"
            />
          </div>
        </div>
        <div class="field-row">
          <label>{{ t('prop.stroke') }}</label>
          <div class="color-pick">
            <button
              class="none-btn"
              :class="{ on: s!.stroke === 'none' }"
              @click="upd({ stroke: 'none', strokeWidth: s!.stroke === 'none' ? (s!.strokeWidth || 2) : s!.strokeWidth })"
            >∅</button>
            <input
              type="color"
              :value="s!.stroke === 'none' ? '#000000' : s!.stroke"
              @input="upd({ stroke: val($event), strokeWidth: s!.strokeWidth || 2 })"
            />
          </div>
        </div>
        <div class="field-row">
          <label>{{ t('prop.strokeWidth') }}</label>
          <input
            type="number"
            min="0"
            step="0.5"
            :value="s!.strokeWidth"
            @change="upd({ strokeWidth: Math.max(0, numVal($event)) })"
          />
        </div>


      </div>
    </div>
    <div v-else class="section empty-prop">
      {{ t('prop.selectEmpty') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/store/editor'
import { t, locale } from '@/i18n'
import type { Shape } from '@/types/shapes'

const editor = useEditorStore()
const s = computed(() => editor.activeShape)

const reversedShapes = computed(() => [...editor.shapes].reverse())

const aligns = computed(() => {
  if (locale.value === 'en') {
    return [
      { v: 'left', l: 'L' },
      { v: 'center', l: 'C' },
      { v: 'right', l: 'R' },
    ]
  }
  return [
    { v: 'left', l: '左' },
    { v: 'center', l: '中' },
    { v: 'right', l: '右' },
  ]
})

function toggleVis(sh: Shape) {
  editor.commit()
  editor.updateShape(sh.id, { visible: !sh.visible })
}
function toggleLock(sh: Shape) {
  editor.commit()
  editor.updateShape(sh.id, { locked: !sh.locked })
}
function remove(sh: Shape) {
  editor.setSelected([sh.id])
  editor.deleteSelection()
}
function onClickLayer(sh: Shape, e: MouseEvent) {
  const add = e.shiftKey || e.metaKey || e.ctrlKey
  editor.selectOne(sh.id, add)
}
let dragId: string | null = null
let dropTarget: string | null = null
let dropPlace: 'before' | 'after' = 'before'
function onGripDragStart(e: DragEvent, id: string) {
  dragId = id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
}
function onGripDragEnd() {
  dragId = null
  dropTarget = null
}
function onRowDragOver(e: DragEvent, targetId: string) {
  if (!dragId || dragId === targetId) return
  const list = [...editor.shapes].reverse()
  const ti = list.findIndex((x) => x.id === targetId)
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const before = e.clientY < rect.top + rect.height / 2
  dropTarget = targetId
  dropPlace = before ? 'before' : 'after'
}
function onRowDragLeave(targetId: string) {
  if (dropTarget === targetId) {
    dropTarget = null
  }
}
function onDrop(e: DragEvent, targetId: string) {
  if (!dragId || dragId === targetId) {
    dragId = null
    dropTarget = null
    return
  }
  editor.reorder(dragId, targetId, dropPlace)
  dragId = null
  dropTarget = null
  void e
}

function upd(patch: Partial<Shape>) {
  editor.updateActive(patch)
}
function updAny(patch: Record<string, any>) {
  editor.updateActive(patch as any)
}
function val(e: Event) {
  return (e.target as HTMLInputElement).value
}
function numVal(e: Event) {
  return parseFloat((e.target as HTMLInputElement).value) || 0
}
function num(v: any) {
  return typeof v === 'number' ? v : 0
}
function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}
function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v))
}
function clampI(v: number, a: number, b: number) {
  return Math.round(clamp(v, a, b))
}
function parseWeight(v: string): number | 'normal' | 'bold' {
  const n = parseInt(v)
  if (Number.isFinite(n)) return n
  return v as any
}
function thumbSvg(shape: Shape): string {
  const c = shape.fill === 'none' ? 'currentColor' : shape.fill
  switch (shape.type) {
    case 'rect':
      return `<rect x="4" y="6" width="16" height="12" rx="2" fill="${c}"/>`
    case 'circle':
      return `<circle cx="12" cy="12" r="7" fill="${c}"/>`
    case 'ellipse':
      return `<ellipse cx="12" cy="12" rx="9" ry="6" fill="${c}"/>`
    case 'line':
      return `<line x1="3" y1="20" x2="21" y2="4" stroke="${shape.stroke === 'none' ? 'currentColor' : shape.stroke}" stroke-width="2.5" stroke-linecap="round"/>`
    case 'triangle':
      return `<polygon points="12,3 22,21 2,21" fill="${c}"/>`
    case 'polygon':
      return `<polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="${c}"/>`
    case 'star':
      return `<polygon points="12,2 14.5,8.5 21,9.5 16.5,14 17.5,21 12,17.5 6.5,21 7.5,14 3,9.5 9.5,8.5" fill="${c}"/>`
    case 'path':
      // 绘制工具产生的 path 使用与左侧面板一致的图标；基础图形 path 仍用心形
      if (shape.source === 'brush') {
        return `<path d="M12 19l7-7 3 3-7 7-3-3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 2l7.586 7.586" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="11" cy="11" r="2" fill="none" stroke="currentColor" stroke-width="2"/>`
      }
      if (shape.source === 'polygon') {
        return `<path d="M12 2l9 6.5v9L12 22 3 17.5v-9L12 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
      }
      if (shape.source === 'curve') {
        return `<path d="M3 18C7 18 7 6 12 6s5 12 9 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="3" cy="18" r="1.6" fill="currentColor"/><circle cx="21" cy="18" r="1.6" fill="currentColor"/>`
      }
      return `<path d="M12 20 C3 14 2 8 6 4 C9 1 11 3 12 7 C13 3 15 1 18 4 C22 8 21 14 12 20 Z" fill="${c}"/>`
    case 'text':
      return `<text x="12" y="14" dominant-baseline="middle" text-anchor="middle" font-family="Inter, sans-serif" font-size="13" font-weight="700" fill="${c}">Aa</text>`
    default:
      return `<rect x="4" y="4" width="16" height="16" fill="${c}"/>`
  }
}
</script>

<style scoped>
.right-panel {
  flex-shrink: 0;
  width: 280px;
  min-width: 260px;
  background: var(--surface);
  border-left: 1px solid var(--border);
  overflow-y: auto;
  padding: 14px 14px 20px;
  color: var(--fg);
}
.section {
  margin-bottom: 20px;
}
.section-title {
  font-size: 12px;
  letter-spacing: 1px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-title .count {
  background: var(--surface-2);
  border-radius: 999px;
  padding: 1px 8px;
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0;
}
.section-title.sub {
  margin-top: 18px;
}
.empty {
  color: var(--text-dim);
  font-size: 12px;
  text-align: center;
  padding: 14px 4px;
  background: var(--surface-2);
  border-radius: 8px;
  border: 1px dashed var(--border);
}
.empty-prop {
  color: var(--text-dim);
  font-size: 13px;
  text-align: center;
  padding: 30px 10px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  margin-top: 30px;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.layer-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: var(--surface-2);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
}
.layer-row:hover {
  border-color: var(--border);
}
.layer-row.active {
  border-color: var(--primary);
  background: var(--primary-glow);
  box-shadow: 0 0 0 2px var(--primary-glow);
}
.layer-row.hidden {
  opacity: 0.5;
}
.layer-row.locked .name {
  color: var(--text-muted);
}
.grip {
  color: var(--text-dim);
  cursor: grab;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}
.grip:active {
  cursor: grabbing;
}
.drop-before {
  border-top-color: var(--primary) !important;
  box-shadow: inset 0 2px 0 var(--primary);
}
.drop-after {
  border-bottom-color: var(--primary) !important;
  box-shadow: inset 0 -2px 0 var(--primary);
}
.thumb {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--text);
}
.name {
  flex: 1;
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ops {
  display: flex;
  gap: 2px;
}
.op-btn {
  background: transparent;
  color: var(--text-muted);
  border: none;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}
.op-btn:hover {
  background: var(--border);
  color: var(--fg);
}
.op-btn.off {
  color: #f87171;
  opacity: 0.7;
}
.op-btn.on {
  color: #fbbf24;
}
.op-btn.danger:hover {
  color: #f87171;
}
.ico {
  display: block;
}

.align-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}
.align-grid button {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: 6px;
  padding: 6px 0;
  font-size: 14px;
  cursor: pointer;
}
.align-grid button:hover {
  border-color: var(--primary);
  background: var(--primary-glow);
  color: var(--fg);
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.field-row.two {
  gap: 10px;
}
.field-row.two > div {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.field-row label {
  font-size: 12px;
  color: var(--text-muted);
  min-width: 44px;
}
.field-row input[type='text'],
.field-row input[type='number'],
.field-row select {
  flex: 1;
  background: var(--input-bg);
  border: 1px solid var(--border);
  color: var(--fg);
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 12px;
  min-width: 0;
}
.field-row input:focus,
.field-row select:focus {
  outline: none;
  border-color: var(--primary);
}
.color-pick {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}
.none-btn {
  width: 30px;
  height: 28px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}
.none-btn.on {
  border-color: #f87171;
  color: #f87171;
  background: color-mix(in srgb, #f87171 15%, var(--surface-2));
}
.color-pick input[type='color'] {
  width: 32px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.seg {
  flex: 1;
  display: inline-flex;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}
.seg button {
  flex: 1;
  background: var(--surface-2);
  color: var(--text-muted);
  border: none;
  padding: 5px 0;
  font-size: 12px;
  cursor: pointer;
  border-right: 1px solid var(--border);
}
.seg button:last-child {
  border-right: none;
}
.seg button.on {
  background: var(--primary);
  color: #fff;
}
</style>
