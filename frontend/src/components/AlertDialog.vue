<template>
  <div v-if="visible" class="alert-overlay" @click.self="onClose">
    <div class="alert-dialog">
      <div class="alert-body">
        <div class="alert-message">{{ message }}</div>
      </div>
      <div class="alert-actions">
        <button class="btn-ok" @click="onClose">{{ t('msg.confirmOk') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t } from '@/i18n'

defineProps<{
  visible: boolean
  message: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function onClose() {
  emit('close')
}
</script>

<style scoped>
.alert-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  backdrop-filter: blur(4px);
  z-index: 9200;
  display: flex;
  align-items: center;
  justify-content: center;
}
.alert-dialog {
  width: 340px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
  overflow: hidden;
}
.alert-body {
  padding: 24px 20px 20px;
}
.alert-message {
  font-size: 14px;
  color: var(--fg);
  line-height: 1.5;
  text-align: center;
  white-space: pre-wrap;
  word-break: break-word;
}
.alert-actions {
  border-top: 1px solid var(--border);
}
.btn-ok {
  width: 100%;
  background: transparent;
  border: none;
  padding: 12px 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  color: var(--primary);
  transition: background 0.15s;
}
.btn-ok:hover {
  background: var(--primary-glow);
}
</style>
