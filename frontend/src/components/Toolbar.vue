<template>
  <header class="toolbar">
    <div class="actions">
      <!-- 工具模式：选择 -->
      <button
        class="tb tool-btn"
        :class="{ active: editor.toolMode === 'select' }"
        @click="editor.setToolMode('select')"
        :title="t('toolbar.tool.select.tip')"
      >
        <svg class="tb-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
        </svg>
        {{ t('toolbar.tool.select') }}
      </button>
      <span class="sep"></span>

      <button class="tb" @click="undo" :disabled="!editor.canUndo" :title="t('toolbar.undo.tip')">{{ t('toolbar.undo') }}</button>
      <button class="tb" @click="redo" :disabled="!editor.canRedo" :title="t('toolbar.redo.tip')">{{ t('toolbar.redo') }}</button>
      <span class="sep"></span>
      <button class="tb" @click="duplicate" :disabled="editor.selectedShapes.length===0" :title="t('toolbar.duplicate.tip')">{{ t('toolbar.duplicate') }}</button>
      <button class="tb danger" @click="editor.deleteSelection()" :disabled="editor.selectedShapes.length===0" :title="t('toolbar.delete.tip')">
        <svg class="tb-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
          <path d="M10 11v6"></path>
          <path d="M14 11v6"></path>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
        </svg>
        {{ t('toolbar.delete') }}
      </button>
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
    editor.showAlert(t('msg.canvasEmpty'))
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
    editor.showAlert(t('msg.pngExportFail') + (e?.message ?? String(e)))
  } finally {
    busy.value = false
  }
}

async function exportSvg() {
  if (busy.value) return
  if (editor.shapeCount === 0) {
    editor.showAlert(t('msg.canvasEmpty'))
    return
  }
  busy.value = true
  try {
    const svg = editor.exportSvgString()
    const base = saveName()
    const result = await callBackend('SaveSvg', svg, base)
    if (result) toast(t('msg.svgExported') + result)
  } catch (e: any) {
    editor.showAlert(t('msg.svgExportFail') + (e?.message ?? String(e)))
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
    editor.showAlert(t('msg.projectSaveFail') + (e?.message ?? String(e)))
  }
}

async function openProject() {
  try {
    const json: string | null = await callBackend('LoadProjectJson')
    if (!json) return
    editor.loadProjectJSON(json)
  } catch (e: any) {
    if (String(e).includes(t('msg.cancelled'))) return
    editor.showAlert(t('msg.openFail') + (e?.message ?? String(e)))
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
  position: relative;
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
.tool-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
.tb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
.tb-icon {
  flex: none;
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
.tb.danger {
  color: #f87171;
}
.tb.danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.12);
  border-color: #ef4444;
  color: #ef4444;
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
