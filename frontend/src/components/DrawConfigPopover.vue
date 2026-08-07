<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="draw-config-pop"
      :style="posStyle"
    >
      <div class="cfg-row">
        <span class="cfg-label">{{ t('toolbar.brush.color') }}</span>
        <input type="color" :value="editor.brush.color" @input="onBrushColor" class="cfg-color" />
      </div>
      <div class="cfg-row">
        <span class="cfg-label">{{ t('toolbar.brush.width') }}</span>
        <input type="range" min="1" max="60" step="1" :value="editor.brush.width" @input="onBrushWidth" class="cfg-range" />
        <span class="cfg-val">{{ editor.brush.width }}</span>
      </div>
      <div class="cfg-row">
        <span class="cfg-label">{{ t('toolbar.brush.opacity') }}</span>
        <input type="range" min="0.1" max="1" step="0.05" :value="editor.brush.opacity" @input="onBrushOpacity" class="cfg-range" />
        <span class="cfg-val">{{ Math.round(editor.brush.opacity * 100) }}%</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useEditorStore } from '@/store/editor'
import { t } from '@/i18n'

const editor = useEditorStore()

const pos = ref({ left: 0, top: 0 })

const visible = computed(() => {
  const m = editor.toolMode
  return m === 'brush' || m === 'polygon' || m === 'curve'
})

const posStyle = computed(() => ({
  left: `${pos.value.left}px`,
  top: `${pos.value.top}px`,
}))

function updatePos() {
  if (!visible.value) return
  nextTick(() => {
    const btn = document.querySelector('.draw-btn.active') as HTMLElement | null
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const popW = 210
    const top = 190
    let left = r.left
    if (left + popW > window.innerWidth - 12) {
      left = window.innerWidth - popW - 12
    }
    if (left < 12) left = 12
    pos.value = { left, top }
  })
}

watch(visible, (v) => {
  if (v) updatePos()
})

watch(() => editor.toolMode, () => {
  if (visible.value) updatePos()
})

let rafId = 0
function onScrollOrResize() {
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(updatePos)
}

onMounted(() => {
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})

function onBrushColor(e: Event) {
  editor.setBrush({ color: (e.target as HTMLInputElement).value })
}
function onBrushWidth(e: Event) {
  const v = parseFloat((e.target as HTMLInputElement).value)
  if (!isNaN(v)) editor.setBrush({ width: v })
}
function onBrushOpacity(e: Event) {
  const v = parseFloat((e.target as HTMLInputElement).value)
  if (!isNaN(v)) editor.setBrush({ opacity: v })
}
</script>

<style scoped>
.draw-config-pop {
  position: fixed;
  width: 210px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--surface);
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 8px 28px -8px rgba(0, 0, 0, 0.35);
  z-index: 200;
  animation: draw-pop-in 0.15s ease;
}
@keyframes draw-pop-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.cfg-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.cfg-label {
  width: 42px;
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
}
.cfg-color {
  width: 28px;
  height: 24px;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}
.cfg-range {
  flex: 1;
  min-width: 0;
  accent-color: var(--primary);
  cursor: pointer;
}
.cfg-val {
  font-size: 11px;
  color: var(--text-muted);
  min-width: 32px;
  text-align: right;
  flex-shrink: 0;
}
</style>
