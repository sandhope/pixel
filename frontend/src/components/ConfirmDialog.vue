<template>
  <div v-if="visible" class="confirm-overlay" @click.self="onCancel">
    <div class="confirm-dialog">
      <div class="confirm-body">
        <div class="confirm-message">{{ message }}</div>
      </div>
      <div class="confirm-actions">
        <button class="btn-cancel" @click="onCancel">{{ t('msg.confirmCancel') }}</button>
        <button class="btn-confirm" @click="onConfirm">{{ t('msg.confirmOk') }}</button>
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
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  backdrop-filter: blur(4px);
  z-index: 9200;
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirm-dialog {
  width: 340px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
  overflow: hidden;
}
.confirm-body {
  padding: 24px 20px 20px;
}
.confirm-message {
  font-size: 14px;
  color: var(--fg);
  line-height: 1.5;
  text-align: center;
}
.confirm-actions {
  display: flex;
  border-top: 1px solid var(--border);
}
.btn-cancel,
.btn-confirm {
  flex: 1;
  background: transparent;
  border: none;
  padding: 12px 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-cancel {
  color: var(--text-muted);
  border-right: 1px solid var(--border);
}
.btn-cancel:hover {
  background: var(--surface-2);
  color: var(--fg);
}
.btn-confirm {
  color: var(--primary);
}
.btn-confirm:hover {
  background: var(--primary-glow);
}
</style>
