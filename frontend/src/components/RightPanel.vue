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
          }"
          draggable="true"
          @dragstart="onDragStart($event, s.id)"
          @dragover.prevent
          @drop="onDrop($event, s.id)"
          @click="onClickLayer(s, $event)"
        >
          <span class="grip">⋮⋮</span>
          <span class="thumb" :style="{ background: thumbBg(s) }"></span>
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
            <button class="op-btn" @click.stop="editor.moveLayer(s.id, 'up')" :title="t('layer.up')">
              <svg class="ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
            <button class="op-btn" @click.stop="editor.moveLayer(s.id, 'down')" :title="t('layer.down')">
              <svg class="ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </button>
            <button class="op-btn danger" @click.stop="remove(s)" :title="t('layer.delete.tip')">
              <svg class="ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
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
          <div class="field-row two">
            <div>
              <label>{{ t('prop.fontSize') }}</label>
              <input
                type="number"
                min="8"
                :value="(s as any).fontSize"
                @change="updAny({ fontSize: Math.max(8, numVal($event)) })"
              />
            </div>
            <div>
              <label>{{ t('prop.fontWeight') }}</label>
              <select :value="String((s as any).fontWeight)" @change="updAny({ fontWeight: parseWeight(val($event)) })">
                <option value="300">{{ t('font.weight300') }}</option>
                <option value="400">{{ t('font.weight400') }}</option>
                <option value="600">{{ t('font.weight600') }}</option>
                <option value="700">{{ t('font.weight700') }}</option>
                <option value="900">{{ t('font.weight900') }}</option>
              </select>
            </div>
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
function onDragStart(e: DragEvent, id: string) {
  dragId = id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
}
function onDrop(e: DragEvent, targetId: string) {
  if (!dragId || dragId === targetId) return
  const list = [...editor.shapes].reverse()
  const di = list.findIndex((x) => x.id === dragId)
  const ti = list.findIndex((x) => x.id === targetId)
  const place: 'before' | 'after' = di < ti ? 'after' : 'before'
  editor.reorder(dragId, targetId, place)
  dragId = null
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
function thumbBg(shape: Shape): string {
  if (shape.fill && shape.fill !== 'none') return shape.fill as string
  if (shape.stroke && shape.stroke !== 'none') return shape.stroke as string
  return '#475569'
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
  font-size: 10px;
  letter-spacing: -1px;
  cursor: grab;
}
.thumb {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid var(--border);
  flex-shrink: 0;
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
