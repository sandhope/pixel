<template>
  <header class="toolbar">
    <div class="brand">
      <div class="logo"></div>
      <div class="brand-text">
        <div class="title">Pixel Logo Studio</div>
        <div class="sub">搭积木式 Logo 编辑器</div>
      </div>
    </div>
    <div class="actions">
      <button class="tb" @click="undo" :disabled="!editor.canUndo" title="撤销 (Ctrl+Z)">↶ 撤销</button>
      <button class="tb" @click="redo" :disabled="!editor.canRedo" title="重做 (Ctrl+Y)">↷ 重做</button>
      <span class="sep"></span>
      <button class="tb" @click="duplicate" :disabled="editor.selectedShapes.length===0" title="复制 (Ctrl+D)">⧉ 复制</button>
      <button class="tb danger" @click="editor.deleteSelection()" :disabled="editor.selectedShapes.length===0" title="删除 (Del)">🗑 删除</button>
      <span class="sep"></span>
      <button class="tb" @click="openProject" title="打开项目 (.pixel.json)">📂 打开</button>
      <button class="tb" @click="saveProject" title="保存项目">💾 存项目</button>
      <button class="tb" @click="editor.resetAll()" title="清空画布">✕ 清空</button>
      <span class="sep"></span>
      <div class="export-group">
        <label class="scale-label">@{{ exportScale }}x</label>
        <select v-model.number="exportScale">
          <option :value="1">1x</option>
          <option :value="2" selected>2x</option>
          <option :value="3">3x</option>
          <option :value="4">4x</option>
        </select>
        <button class="tb primary" @click="exportPng" :disabled="busy" title="导出透明 PNG">📤 PNG</button>
        <button class="tb accent" @click="exportSvg" :disabled="busy" title="导出矢量 SVG">📐 SVG</button>
      </div>
    </div>
    <div class="status">
      <span>{{ editor.canvas.width }} × {{ editor.canvas.height }}</span>
      <span class="dot"></span>
      <span>{{ editor.shapeCount }} 个图层</span>
      <span v-if="busy" class="busy">处理中…</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '@/store/editor'
import { svgToPngDataUrl } from '@/utils/svgToPng'
import { callBackend } from '@/wails/bindings'

const editor = useEditorStore()
const exportScale = ref(2)
const busy = ref(false)

function undo() {
  editor.undo()
}
function redo() {
  editor.redo()
}
function duplicate() {
  editor.duplicateSelection()
}

async function exportPng() {
  if (busy.value) return
  if (editor.shapeCount === 0) {
    alert('画布还是空的，先添加一些图形吧 ~')
    return
  }
  busy.value = true
  try {
    const svg = editor.exportSvgString()
    const { dataUrl } = await svgToPngDataUrl(svg, exportScale.value)
    const base = saveName() + '.png'
    const result = await callBackend('SavePngDataUrl', dataUrl, base)
    if (result) toast(`PNG 已导出：${result}`)
  } catch (e: any) {
    alert('导出 PNG 失败：' + (e?.message ?? String(e)))
  } finally {
    busy.value = false
  }
}

async function exportSvg() {
  if (busy.value) return
  if (editor.shapeCount === 0) {
    alert('画布还是空的，先添加一些图形吧 ~')
    return
  }
  busy.value = true
  try {
    const svg = editor.exportSvgString()
    const base = saveName()
    const result = await callBackend('SaveSvg', svg, base)
    if (result) toast(`SVG 已导出：${result}`)
  } catch (e: any) {
    alert('导出 SVG 失败：' + (e?.message ?? String(e)))
  } finally {
    busy.value = false
  }
}

async function saveProject() {
  try {
    const json = editor.toProjectJSON()
    const result = await callBackend('SaveProjectJson', json, saveName())
    if (result) toast(`项目已保存：${result}`)
  } catch (e: any) {
    alert('保存失败：' + (e?.message ?? String(e)))
  }
}

async function openProject() {
  try {
    const json: string | null = await callBackend('LoadProjectJson')
    if (!json) return
    editor.loadProjectJSON(json)
  } catch (e: any) {
    if (String(e).includes('取消')) return
    alert('打开失败：' + (e?.message ?? String(e)))
  }
}

function saveName() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `logo-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

let toastTimer: any = null
function toast(msg: string) {
  const t = document.createElement('div')
  t.textContent = msg
  Object.assign(t.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(15,23,42,0.95)',
    color: '#e2e8f0',
    padding: '10px 18px',
    borderRadius: '999px',
    border: '1px solid #334155',
    fontSize: '13px',
    zIndex: '9999',
    boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
    backdropFilter: 'blur(6px)',
  })
  document.body.appendChild(t)
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => t.remove(), 2800)
}
</script>

<style scoped>
.toolbar {
  height: 56px;
  background: linear-gradient(180deg, #111827 0%, #0f172a 100%);
  border-bottom: 1px solid #1e293b;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: #e2e8f0;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}
.logo {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background:
    conic-gradient(from 220deg at 50% 50%, #6366f1, #ec4899, #f59e0b, #10b981, #06b6d4, #6366f1);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.06), 0 6px 20px -6px rgba(99, 102, 241, 0.8);
}
.brand-text .title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.brand-text .sub {
  font-size: 11px;
  color: #94a3b8;
}

.actions {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}
.actions::-webkit-scrollbar {
  display: none;
}
.tb {
  background: #1e293b;
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.tb:hover:not(:disabled) {
  border-color: #6366f1;
  background: #1e2540;
  color: #fff;
  transform: translateY(-1px);
}
.tb:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.tb.primary {
  background: linear-gradient(180deg, #6366f1 0%, #4f46e5 100%);
  border-color: #4338ca;
  color: #fff;
  font-weight: 600;
}
.tb.primary:hover:not(:disabled) {
  filter: brightness(1.08);
}
.tb.accent {
  background: linear-gradient(180deg, #ec4899 0%, #db2777 100%);
  border-color: #be185d;
  color: #fff;
  font-weight: 600;
}
.tb.accent:hover:not(:disabled) {
  filter: brightness(1.08);
}
.tb.danger:hover:not(:disabled) {
  border-color: #ef4444;
  color: #fecaca;
}
.sep {
  width: 1px;
  height: 22px;
  background: #334155;
  margin: 0 6px;
}
.export-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #0f172a;
  padding: 4px 8px;
  border: 1px solid #334155;
  border-radius: 10px;
  margin-left: 6px;
}
.scale-label {
  font-size: 11px;
  color: #94a3b8;
}
.export-group select {
  background: #1e293b;
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 12px;
}

.status {
  min-width: 180px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  font-size: 12px;
  color: #94a3b8;
}
.status .dot {
  width: 3px;
  height: 3px;
  background: #334155;
  border-radius: 999px;
}
.busy {
  color: #fbbf24;
  animation: blink 1s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
