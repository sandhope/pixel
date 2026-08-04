<template>
  <header class="toolbar">
    <div class="actions">
      <button class="tb" @click="undo" :disabled="!editor.canUndo" :title="t('toolbar.undo.tip')">{{ t('toolbar.undo') }}</button>
      <button class="tb" @click="redo" :disabled="!editor.canRedo" :title="t('toolbar.redo.tip')">{{ t('toolbar.redo') }}</button>
      <span class="sep"></span>
      <button class="tb" @click="duplicate" :disabled="editor.selectedShapes.length===0" :title="t('toolbar.duplicate.tip')">{{ t('toolbar.duplicate') }}</button>
      <button class="tb danger" @click="editor.deleteSelection()" :disabled="editor.selectedShapes.length===0" :title="t('toolbar.delete.tip')">{{ t('toolbar.delete') }}</button>
      <span class="sep"></span>
      <button class="tb" @click="openProject" :title="t('toolbar.open.tip')">{{ t('toolbar.open') }}</button>
      <button class="tb" @click="saveProject" :title="t('toolbar.save.tip')">{{ t('toolbar.save') }}</button>
      <button class="tb" @click="editor.resetAll()" :title="t('toolbar.clear.tip')">{{ t('toolbar.clear') }}</button>
      <span class="sep"></span>
      <div class="export-group">
        <label class="scale-label">@{{ exportScale }}x</label>
        <select v-model.number="exportScale">
          <option :value="1">1x</option>
          <option :value="2" selected>2x</option>
          <option :value="3">3x</option>
          <option :value="4">4x</option>
        </select>
        <button class="tb primary" @click="exportPng" :disabled="busy" :title="t('toolbar.exportPng.tip')">📤 PNG</button>
        <button class="tb accent" @click="exportSvg" :disabled="busy" :title="t('toolbar.exportSvg.tip')">📐 SVG</button>
      </div>
      <span class="sep"></span>
    </div>
    <div class="status">
      <span>{{ editor.canvas.width }} × {{ editor.canvas.height }}</span>
      <span class="dot"></span>
      <span>{{ editor.shapeCount }} {{ t('toolbar.layers') }}</span>
      <span v-if="busy" class="busy">{{ t('toolbar.processing') }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '@/store/editor'
import { svgToPngDataUrl } from '@/utils/svgToPng'
import { callBackend } from '@/wails/bindings'
import { t } from '@/i18n'

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
    alert(t('msg.canvasEmpty'))
    return
  }
  busy.value = true
  try {
    const svg = editor.exportSvgString()
    const { dataUrl } = await svgToPngDataUrl(svg, exportScale.value)
    const base = saveName() + '.png'
    const result = await callBackend('SavePngDataUrl', dataUrl, base)
    if (result) toast(t('msg.pngExported') + result)
  } catch (e: any) {
    alert(t('msg.pngExportFail') + (e?.message ?? String(e)))
  } finally {
    busy.value = false
  }
}

async function exportSvg() {
  if (busy.value) return
  if (editor.shapeCount === 0) {
    alert(t('msg.canvasEmpty'))
    return
  }
  busy.value = true
  try {
    const svg = editor.exportSvgString()
    const base = saveName()
    const result = await callBackend('SaveSvg', svg, base)
    if (result) toast(t('msg.svgExported') + result)
  } catch (e: any) {
    alert(t('msg.svgExportFail') + (e?.message ?? String(e)))
  } finally {
    busy.value = false
  }
}

async function saveProject() {
  try {
    const json = editor.toProjectJSON()
    const result = await callBackend('SaveProjectJson', json, saveName())
    if (result) toast(t('msg.projectSaved') + result)
  } catch (e: any) {
    alert(t('msg.projectSaveFail') + (e?.message ?? String(e)))
  }
}

async function openProject() {
  try {
    const json: string | null = await callBackend('LoadProjectJson')
    if (!json) return
    editor.loadProjectJSON(json)
  } catch (e: any) {
    if (String(e).includes(t('msg.cancelled'))) return
    alert(t('msg.openFail') + (e?.message ?? String(e)))
  }
}

function saveName() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `logo-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

let toastTimer: any = null
function toast(msg: string) {
  const el = document.createElement('div')
  el.textContent = msg
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--surface)',
    color: 'var(--fg)',
    padding: '10px 18px',
    borderRadius: '999px',
    border: '1px solid var(--border)',
    fontSize: '13px',
    zIndex: '9999',
    boxShadow: 'var(--shadow)',
    backdropFilter: 'blur(6px)',
  })
  document.body.appendChild(el)
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.remove(), 2800)
}
</script>

<style scoped>
.toolbar {
  height: 48px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--fg);
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
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.tb:hover:not(:disabled) {
  border-color: var(--primary);
  background: var(--primary-glow);
  color: var(--fg);
  transform: translateY(-1px);
}
.tb:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.tb.primary {
  background: linear-gradient(180deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 80%, #000) 100%);
  border-color: color-mix(in srgb, var(--primary) 60%, #000);
  color: #fff;
  font-weight: 600;
}
.tb.primary:hover:not(:disabled) {
  filter: brightness(1.08);
}
.tb.accent {
  background: linear-gradient(180deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 80%, #000) 100%);
  border-color: color-mix(in srgb, var(--accent) 60%, #000);
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
  background: var(--border);
  margin: 0 6px;
}
.export-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface);
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-left: 6px;
}
.scale-label {
  font-size: 11px;
  color: var(--text-muted);
}
.export-group select {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
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
  color: var(--text-muted);
}
.status .dot {
  width: 3px;
  height: 3px;
  background: var(--border);
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
