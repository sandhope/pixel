<template>
  <header
    class="title-bar"
    style="--wails-draggable:drag"
    @dblclick="toggleMax"
  >
    <div class="title-bar-left">
      <div class="app-logo"></div>
      <span class="title-bar-text">{{ t('app.title') }} · {{ t('app.subtitle') }}</span>
    </div>
    <div class="window-controls" style="--wails-draggable:no-drag">
      <button
        class="win-btn"
        :aria-label="t('titlebar.about')"
        :title="t('titlebar.about')"
        @click="$emit('openAbout')"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" />
          <path d="M12 11v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <circle cx="12" cy="8" r="1" fill="currentColor" />
        </svg>
      </button>
      <button
        class="win-btn"
        :aria-label="t('titlebar.settings')"
        :title="t('titlebar.settings')"
        @click="$emit('openSettings')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
          />
        </svg>
      </button>
      <span class="ctrl-sep"></span>
      <button class="win-btn" :aria-label="t('titlebar.minimize')" :title="t('titlebar.minimize')" @click="onMinimize">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect y="5" width="12" height="1.5" fill="currentColor" />
        </svg>
      </button>
      <button class="win-btn" :aria-label="t('titlebar.maximize')" :title="t('titlebar.maximize')" @click="toggleMax">
        <svg v-if="!isMax" width="12" height="12" viewBox="0 0 12 12">
          <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5" fill="none" />
        </svg>
        <svg v-else width="12" height="12" viewBox="0 0 12 12">
          <rect x="3" y="1" width="8" height="8" rx="1.2" stroke="currentColor" stroke-width="1.4" fill="none" />
          <rect x="1" y="3" width="8" height="8" rx="1.2" stroke="currentColor" stroke-width="1.4" fill="var(--surface)" />
        </svg>
      </button>
      <button class="win-btn close" :aria-label="t('titlebar.close')" :title="t('titlebar.close')" @click="onClose">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { t } from '@/i18n'
import { WindowMinimise, WindowToggleMaximise, WindowIsMaximised, Quit } from '../../wailsjs/runtime/runtime'

defineEmits<{ openSettings: [], openAbout: [] }>()

// 跟踪窗口最大化状态，切换「最大化 / 还原」图标
const isMax = ref(false)

function syncMax() {
  try {
    WindowIsMaximised().then((v) => {
      isMax.value = !!v
    }).catch(() => {
      /* 浏览器预览时无 wails runtime，忽略 */
    })
  } catch (e) {
    /* 浏览器预览时 window.runtime 不存在，忽略 */
  }
}

// 双击标题栏切换最大化/还原
function toggleMax() {
  try {
    WindowToggleMaximise()
    setTimeout(syncMax, 60)
  } catch (e) {
    /* 浏览器预览时忽略 */
  }
}

function onMinimize() {
  try {
    WindowMinimise()
  } catch (e) {
    /* 浏览器预览时忽略 */
  }
}

function onClose() {
  try {
    Quit()
  } catch (e) {
    /* 浏览器预览时忽略 */
  }
}

onMounted(() => syncMax())
</script>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 8px 0 12px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  user-select: none;
  flex-shrink: 0;
}

.title-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  /* 让左侧占据可用空间，使双击命中区域更大 */
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.app-logo {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  flex-shrink: 0;
  background:
    conic-gradient(from 220deg at 50% 50%, #6366f1, #ec4899, #f59e0b, #10b981, #06b6d4, #6366f1);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06), 0 2px 8px -2px rgba(99, 102, 241, 0.8);
}

.title-bar-text {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.ctrl-sep {
  width: 1px;
  height: 16px;
  background: var(--border);
  margin: 0 4px;
}

.win-btn {
  width: 36px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s, color 0.15s;
}

.win-btn:hover {
  background: color-mix(in srgb, var(--fg) 10%, transparent);
  color: var(--fg);
}

.win-btn.close:hover {
  background: #e81123;
  color: #fff;
}
</style>
