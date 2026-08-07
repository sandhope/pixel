<template>
  <div v-if="visible" class="lib-overlay" @click.self="close" @keydown.esc="close">
    <div class="lib-dialog" tabindex="-1">
      <!-- 头部 -->
      <div class="lib-header">
        <div class="lib-title">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
          {{ t('panel.shapeLibrary') }}
        </div>
        <button class="close-btn" @click="close" :title="t('settings.close')">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- 分类标签 -->
      <div class="lib-cats">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="lib-cat"
          :class="{ active: activeCat === cat.id }"
          @click="activeCat = cat.id"
        >
          {{ cat.label }}
        </div>
      </div>

      <!-- 搜索框 -->
      <div class="lib-search">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('panel.search.placeholder')"
          class="search-input"
        />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">✕</button>
      </div>

      <!-- 图形网格 -->
      <div class="lib-body">
        <div v-if="filteredShapes.length === 0" class="lib-empty">
          {{ t('panel.search.empty') }}
        </div>
        <div class="lib-grid">
          <div
            v-for="(s, idx) in filteredShapes"
            :key="s.id"
            class="lib-item"
            @click="onClickLib(s)"
            :title="s.name"
          >
            <div class="lib-item-icon" v-html="makeShapeIcon(s.d, 44, getColorForIndex(idx), s.sourceSize)"></div>
            <div class="lib-item-name">{{ s.name }}</div>
          </div>
        </div>
      </div>

      <!-- 底部提示 -->
      <div class="lib-footer">
        <span>{{ filteredShapes.length }} {{ t('panel.shapesCount') }}</span>
        <span class="lib-hint">{{ t('panel.libHint') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useEditorStore } from '@/store/editor'
import { t } from '@/i18n'
import {
  getShapeLibCategories,
  getShapesByCategory,
  makeShapeIcon,
  type ShapeLibShape,
} from '@/utils/shapeLibrary'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: [] }>()

const editor = useEditorStore()

const categories = getShapeLibCategories()
const activeCat = ref<string>('basic')
const searchQuery = ref('')

// 切换分类时清空搜索
watch(activeCat, () => {
  searchQuery.value = ''
})

const currentShapes = computed(() => getShapesByCategory(activeCat.value))

const filteredShapes = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return currentShapes.value
  return currentShapes.value.filter((s) => s.name.toLowerCase().includes(q))
})

// 循环调色盘色（用于缩略图）
const _palette = ['#45B7D1', '#FF6B6B', '#F4A261', '#22D3EE', '#A78BFA', '#F472B6', '#FFE66D', '#4ECDC4', '#96CEB4', '#EF4444', '#34D399', '#818CF8']
function getColorForIndex(idx: number): string {
  return _palette[idx % _palette.length]
}

function onClickLib(s: ShapeLibShape) {
  editor.addLibraryShape({ d: s.d, name: s.name, sourceSize: s.sourceSize })
}

function close() {
  emit('close')
}
</script>

<style scoped>
.lib-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 9200;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: lib-fade-in 0.18s ease-out;
}

@keyframes lib-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.lib-dialog {
  width: 860px;
  max-width: calc(100vw - 40px);
  height: 620px;
  max-height: calc(100vh - 60px);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: lib-slide-up 0.22s ease-out;
}

@keyframes lib-slide-up {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.lib-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.lib-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--fg);
}

.lib-title svg {
  color: var(--primary);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  transition: all 0.15s;
}
.close-btn:hover {
  background: var(--surface-2);
  color: var(--fg);
}

.lib-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px 20px 8px;
  flex-shrink: 0;
}

.lib-cat {
  flex-shrink: 0;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  user-select: none;
}
.lib-cat:hover {
  color: var(--fg);
  border-color: var(--primary);
}
.lib-cat.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  box-shadow: 0 2px 8px -2px color-mix(in srgb, var(--primary) 60%, transparent);
}

.lib-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 20px 10px;
  padding: 6px 10px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  flex-shrink: 0;
}
.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--fg);
  font-size: 13px;
  outline: none;
}
.search-input::placeholder {
  color: var(--text-dim);
}
.search-clear {
  background: transparent;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  font-size: 12px;
  padding: 0 4px;
}
.search-clear:hover {
  color: var(--fg);
}

.lib-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 20px 12px;
  scrollbar-width: thin;
}
.lib-body::-webkit-scrollbar {
  width: 6px;
}
.lib-body::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

.lib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 8px;
}

.lib-item {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 6px 8px;
  text-align: center;
  cursor: grab;
  user-select: none;
  transition: all 0.15s;
}
.lib-item:hover {
  border-color: var(--primary);
  background: var(--primary-glow);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px -4px color-mix(in srgb, var(--primary) 50%, transparent);
}
.lib-item:active {
  cursor: grabbing;
}

.lib-item-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  margin-bottom: 4px;
  pointer-events: none;
}

.lib-item-name {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lib-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: var(--text-dim);
  font-size: 13px;
}

.lib-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-dim);
  flex-shrink: 0;
}
.lib-hint {
  color: var(--text-dim);
  font-style: italic;
}
</style>
