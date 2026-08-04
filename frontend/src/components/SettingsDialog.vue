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
          <div class="lang-switch">
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
      </div>
      <div class="settings-footer">
        <button class="about-btn" @click="$emit('openAbout')">{{ t('settings.about') }}</button>
        <button class="done-btn" @click="close">{{ t('settings.close') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t, locale, setLocale } from '@/i18n'
import type { Locale } from '@/i18n'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: [], openAbout: [] }>()

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
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.settings-dialog {
  width: 380px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
  overflow: hidden;
}
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #1e293b;
}
.settings-title {
  font-size: 15px;
  font-weight: 700;
  color: #e2e8f0;
}
.close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
}
.close-btn:hover {
  background: #1e293b;
  color: #e2e8f0;
}
.settings-body {
  padding: 20px;
}
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.setting-row label {
  font-size: 13px;
  color: #94a3b8;
}
.lang-switch {
  display: inline-flex;
  border: 1px solid #334155;
  border-radius: 8px;
  overflow: hidden;
}
.lang-switch button {
  background: #1e293b;
  color: #94a3b8;
  border: none;
  padding: 7px 14px;
  font-size: 12px;
  cursor: pointer;
  border-right: 1px solid #334155;
}
.lang-switch button:last-child {
  border-right: none;
}
.lang-switch button.on {
  background: #6366f1;
  color: #fff;
}
.settings-footer {
  padding: 14px 20px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #1e293b;
}
.about-btn {
  background: transparent;
  border: 1px solid #334155;
  color: #94a3b8;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}
.about-btn:hover {
  border-color: #6366f1;
  color: #e2e8f0;
}
.done-btn {
  background: #6366f1;
  border: none;
  color: #fff;
  padding: 7px 20px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.done-btn:hover {
  filter: brightness(1.1);
}
</style>
