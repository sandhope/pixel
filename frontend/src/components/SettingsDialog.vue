<template>
  <div v-if="visible" class="settings-overlay" @click.self="close">
    <div class="settings-dialog">
      <div class="settings-header">
        <span class="settings-title">{{ t('settings.title') }}</span>
        <button class="close-btn" @click="close">✕</button>
      </div>
      <div class="settings-body">
        <div class="setting-row">
          <label>{{ t('settings.language') }}</label>
          <div class="seg-switch">
            <button
              :class="{ on: locale === 'zh-CN' }"
              @click="changeLang('zh-CN')"
            >简体中文</button>
            <button
              :class="{ on: locale === 'en' }"
              @click="changeLang('en')"
            >English</button>
          </div>
        </div>
        <div class="setting-row">
          <label>{{ t('settings.theme') }}</label>
          <div class="seg-switch">
            <button
              v-for="th in themes"
              :key="th.id"
              :class="{ on: current === th.id }"
              @click="apply(th.id)"
            >{{ t(th.labelKey) }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t, locale, setLocale } from '@/i18n'
import type { Locale } from '@/i18n'
import { useTheme } from '@/composables/useTheme'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { current, themes, apply } = useTheme()

function close() {
  emit('close')
}
function changeLang(l: Locale) {
  setLocale(l)
}
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  backdrop-filter: blur(4px);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.settings-dialog {
  width: 380px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
  overflow: hidden;
}
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border);
}
.settings-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--fg);
}
.close-btn {
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
}
.close-btn:hover {
  background: var(--surface-2);
  color: var(--fg);
}
.settings-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.setting-row label {
  font-size: 13px;
  color: var(--text-muted);
}
.seg-switch {
  display: inline-flex;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.seg-switch button {
  background: var(--surface-2);
  color: var(--text-muted);
  border: none;
  padding: 7px 14px;
  font-size: 12px;
  cursor: pointer;
  border-right: 1px solid var(--border);
}
.seg-switch button:last-child {
  border-right: none;
}
.seg-switch button.on {
  background: var(--primary);
  color: #fff;
}

</style>
