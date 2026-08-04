<template>
  <div class="right-panel">
    <!-- 图层列表 -->
    <div class="section">
      <div class="section-title">
        <span>图层</span>
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
              title="显示/隐藏"
            >
              {{ s.visible ? '👁' : '—' }}
            </button>
            <button
              class="op-btn"
              :class="{ on: s.locked }"
              @click.stop="toggleLock(s)"
              title="锁定/解锁"
            >
              {{ s.locked ? '🔒' : '🔓' }}
            </button>
            <button class="op-btn danger" @click.stop="remove(s)" title="删除">✕</button>
          </div>
        </div>
      </div>
      <div v-else class="empty">暂无图层，从左侧添加图形吧～</div>
    </div>

    <!-- 对齐工具（≥2 选中时启用） -->
    <div class="section" v-if="editor.selectedShapes.length >= 2">
      <div class="section-title"><span>对齐</span></div>
      <div class="align-grid">
        <button @click="editor.alignSelection('left')" title="左对齐">⇤</button>
        <button @click="editor.alignSelection('hcenter')" title="水平居中">↔</button>
        <button @click="editor.alignSelection('right')" title="右对齐">⇥</button>
        <button @click="editor.alignSelection('top')" title="顶对齐">⇡</button>
        <button @click="editor.alignSelection('vcenter')" title="垂直居中">↕</button>
        <button @click="editor.alignSelection('bottom')" title="底对齐">⇣</button>
      </div>
    </div>

    <!-- 属性面板 -->
    <div class="section" v-if="editor.activeShape">
      <div class="section-title"><span>属性</span></div>
      <div class="props">
        <div class="field-row">
          <label>名称</label>
          <input type="text" :value="s!.name" @change="upd({ name: val($event) })" />
        </div>
        <div class="field-row two">
          <div>
            <label>X</label>
            <input type="number" :value="num(s!.x)" @change="upd({ x: numVal($event) })" />
          </div>
          <div>
            <label>Y</label>
            <input type="number" :value="num(s!.y)" @change="upd({ y: numVal($event) })" />
          </div>
        </div>
        <div class="field-row two">
          <div>
            <label>宽</label>
            <input type="number" :value="num(s!.width)" min="1" @change="upd({ width: numVal($event) })" />
          </div>
          <div>
            <label>高</label>
            <input type="number" :value="num(s!.height)" min="1" @change="upd({ height: numVal($event) })" />
          </div>
        </div>
        <div class="field-row two">
          <div>
            <label>旋转°</label>
            <input
              type="number"
              :value="num(s!.rotation)"
              min="0"
              max="360"
              @change="upd({ rotation: ((numVal($event) % 360) + 360) % 360 })"
            />
          </div>
          <div>
            <label>透明度</label>
            <input
              type="number"
              :value="Math.round((s!.opacity as number) * 100)"
              min="0"
              max="100"
              @change="upd({ opacity: clamp01(numVal($event) / 100) })"
            />
          </div>
        </div>

        <!-- 类型特有：rect 圆角 -->
        <template v-if="s!.type === 'rect'">
          <div class="field-row">
            <label>圆角</label>
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
              <label>角数</label>
              <input
                type="number"
                min="3"
                max="24"
                :value="(s as any).points"
                @change="updAny({ points: clampI(numVal($event), 3, 24) })"
              />
            </div>
            <div>
              <label>内径比</label>
              <input
                type="number"
                min="0.1"
                max="0.95"
                step="0.05"
                :value="(s as any).innerRatio"
                @change="updAny({ innerRatio: clamp(numVal($event), 0.1, 0.95) })"
              />
            </div>
          </div>
        </template>
        <template v-if="s!.type === 'polygon'">
          <div class="field-row">
            <label>边数</label>
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
            <label>文字</label>
            <input type="text" :value="(s as any).text" @change="updAny({ text: val($event) })" />
          </div>
          <div class="field-row two">
            <div>
              <label>字号</label>
              <input
                type="number"
                min="8"
                :value="(s as any).fontSize"
                @change="updAny({ fontSize: Math.max(8, numVal($event)) })"
              />
            </div>
            <div>
              <label>字重</label>
              <select :value="String((s as any).fontWeight)" @change="updAny({ fontWeight: parseWeight(val($event)) })">
                <option value="300">轻 300</option>
                <option value="400">常规 400</option>
                <option value="600">半粗 600</option>
                <option value="700">粗 700</option>
                <option value="900">超粗 900</option>
              </select>
            </div>
          </div>
          <div class="field-row">
            <label>字体</label>
            <select :value="(s as any).fontFamily" @change="updAny({ fontFamily: val($event) })">
              <option value='Inter, "PingFang SC", "Microsoft YaHei", sans-serif'>默认无衬线</option>
              <option value='"PingFang SC", "Microsoft YaHei", sans-serif'>苹方 / 雅黑</option>
              <option value='"Songti SC", SimSun, serif'>宋体</option>
              <option value='"Kaiti SC", "KaiTi", serif'>楷体</option>
              <option value='"STHeiti", "Heiti SC", sans-serif'>黑体</option>
              <option value="Georgia, serif">Georgia</option>
              <option value='"Courier New", monospace'>等宽 Courier</option>
              <option value='"Hiragino Sans GB", sans-serif'>冬青黑</option>
            </select>
          </div>
          <div class="field-row">
            <label>对齐</label>
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

        <!-- 通用：填充 / 描边 -->
        <div class="field-row">
          <label>填充</label>
          <div class="color-pick">
            <button
              class="none-btn"
              :class="{ on: s!.fill === 'none' }"
              @click="upd({ fill: 'none' })"
              title="不填充"
            >∅</button>
            <input
              type="color"
              :value="s!.fill === 'none' ? '#000000' : s!.fill"
              @input="upd({ fill: val($event) })"
            />
          </div>
        </div>
        <div class="field-row two">
          <div>
            <label>描边</label>
            <div class="color-pick">
              <button
                class="none-btn"
                :class="{ on: s!.stroke === 'none' }"
                @click="upd({ stroke: 'none', strokeWidth: s!.stroke === 'none' ? (s!.strokeWidth || 2) : s!.strokeWidth })"
                title="无描边"
              >∅</button>
              <input
                type="color"
                :value="s!.stroke === 'none' ? '#000000' : s!.stroke"
                @input="upd({ stroke: val($event), strokeWidth: s!.strokeWidth || 2 })"
              />
            </div>
          </div>
          <div>
            <label>描边宽</label>
            <input
              type="number"
              min="0"
              step="0.5"
              :value="s!.strokeWidth"
              @change="upd({ strokeWidth: Math.max(0, numVal($event)) })"
            />
          </div>
        </div>

        <!-- 图层顺序 -->
        <div class="section-title sub"><span>图层顺序</span></div>
        <div class="seg order-seg">
          <button @click="move('bottom')">到底层</button>
          <button @click="move('down')">下移</button>
          <button @click="move('up')">上移</button>
          <button @click="move('top')">到顶层</button>
        </div>
      </div>
    </div>
    <div v-else class="section empty-prop">
      选中一个图形以编辑属性
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/store/editor'
import type { Shape } from '@/types/shapes'

const editor = useEditorStore()
const s = computed(() => editor.activeShape)

// 图层顺序：数组末尾 = 顶层
const reversedShapes = computed(() => [...editor.shapes].reverse())

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
// 拖拽排序
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
  // 判定前后：target 在 reversedShapes 中的索引 vs dragId 的索引
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
const aligns = [
  { v: 'left', l: '左' },
  { v: 'center', l: '中' },
  { v: 'right', l: '右' },
]
function move(dir: 'up' | 'down' | 'top' | 'bottom') {
  if (editor.activeShape) editor.moveLayer(editor.activeShape.id, dir)
}
function thumbBg(shape: Shape): string {
  if (shape.fill && shape.fill !== 'none') return shape.fill as string
  if (shape.stroke && shape.stroke !== 'none') return shape.stroke as string
  return '#475569'
}
</script>

<style scoped>
.right-panel {
  width: 280px;
  min-width: 280px;
  border-left: 1px solid #1e293b;
  background: #0f172a;
  overflow-y: auto;
  padding: 14px 14px 20px;
  color: #e2e8f0;
}
.section {
  margin-bottom: 20px;
}
.section-title {
  font-size: 12px;
  letter-spacing: 1px;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-title .count {
  background: #1e293b;
  border-radius: 999px;
  padding: 1px 8px;
  font-size: 11px;
  color: #94a3b8;
  letter-spacing: 0;
}
.section-title.sub {
  margin-top: 18px;
}
.empty {
  color: #64748b;
  font-size: 12px;
  text-align: center;
  padding: 14px 4px;
  background: #1e293b;
  border-radius: 8px;
  border: 1px dashed #334155;
}
.empty-prop {
  color: #64748b;
  font-size: 13px;
  text-align: center;
  padding: 30px 10px;
  border: 1px dashed #334155;
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
  background: #1e293b;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
}
.layer-row:hover {
  border-color: #334155;
}
.layer-row.active {
  border-color: #6366f1;
  background: #1e2540;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.18);
}
.layer-row.hidden {
  opacity: 0.5;
}
.layer-row.locked .name {
  color: #94a3b8;
}
.grip {
  color: #475569;
  font-size: 10px;
  letter-spacing: -1px;
  cursor: grab;
}
.thumb {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}
.name {
  flex: 1;
  font-size: 12px;
  color: #cbd5e1;
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
  color: #94a3b8;
  border: none;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}
.op-btn:hover {
  background: #334155;
  color: #e2e8f0;
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

.align-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}
.align-grid button {
  background: #1e293b;
  border: 1px solid #334155;
  color: #cbd5e1;
  border-radius: 6px;
  padding: 6px 0;
  font-size: 14px;
  cursor: pointer;
}
.align-grid button:hover {
  border-color: #6366f1;
  background: #1e2540;
  color: #fff;
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
  color: #94a3b8;
  min-width: 44px;
}
.field-row input[type='text'],
.field-row input[type='number'],
.field-row select {
  flex: 1;
  background: #0b1220;
  border: 1px solid #334155;
  color: #e2e8f0;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 12px;
  min-width: 0;
}
.field-row input:focus,
.field-row select:focus {
  outline: none;
  border-color: #6366f1;
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
  background: #1e293b;
  border: 1px solid #334155;
  color: #94a3b8;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}
.none-btn.on {
  border-color: #f87171;
  color: #f87171;
  background: #2a1a1a;
}
.color-pick input[type='color'] {
  width: 32px;
  height: 28px;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.seg {
  flex: 1;
  display: inline-flex;
  border: 1px solid #334155;
  border-radius: 6px;
  overflow: hidden;
}
.seg button {
  flex: 1;
  background: #1e293b;
  color: #94a3b8;
  border: none;
  padding: 5px 0;
  font-size: 12px;
  cursor: pointer;
  border-right: 1px solid #334155;
}
.seg button:last-child {
  border-right: none;
}
.seg button.on {
  background: #6366f1;
  color: #fff;
}
.order-seg button {
  font-size: 11px;
  padding: 6px 0;
}
</style>
