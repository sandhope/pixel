<template>
  <div class="about-overlay" @click.self="close">
    <div class="about-card">
      <div class="about-header">
        <span class="about-title">{{ t('about.title') }}</span>
        <button class="close-btn" @click="close">✕</button>
      </div>
      <div class="about-body">
        <div class="brand">
          <div class="logo"></div>
          <div class="brand-text">
            <div class="brand-name">{{ t('app.title') }}</div>
            <div class="brand-tagline">{{ t('about.tagline') }}</div>
            <div class="brand-version">{{ t('about.version') }} {{ APP_VERSION }}</div>
          </div>
        </div>

        <div class="link-row" @click="openProject">
          <div class="link-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
            </svg>
          </div>
          <div class="link-info">
            <div class="link-name">{{ t('about.projectHome') }}</div>
            <div class="link-desc">{{ t('about.projectHomeDesc') }}</div>
          </div>
          <svg class="link-arrow" viewBox="0 0 24 24" width="16" height="16">
            <path d="M7 17L17 7M17 7H9M17 7v8" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>

        <!-- 中文：显示捐赠二维码 -->
        <div v-if="locale === 'zh-CN'" class="donate">
          <div class="donate-title">{{ t('about.donateTitle') }}</div>
          <div class="donate-desc">{{ t('about.donateDesc') }}</div>
          <div class="qr-grid">
            <div class="qr-item">
              <div class="qr-frame">
                <img
                  v-show="!alipayBroken"
                  :src="alipaySrc"
                  :alt="t('about.alipay')"
                  @error="alipayBroken = true"
                />
                <div v-if="alipayBroken" class="qr-missing">{{ t('about.qrMissing', { file: 'donate-alipay.jpg' }) }}</div>
              </div>
              <div class="qr-label alipay">{{ t('about.alipay') }}</div>
            </div>
            <div class="qr-item">
              <div class="qr-frame">
                <img
                  v-show="!wechatBroken"
                  :src="wechatSrc"
                  :alt="t('about.wechat')"
                  @error="wechatBroken = true"
                />
                <div v-if="wechatBroken" class="qr-missing">{{ t('about.qrMissing', { file: 'donate-wechat.jpg' }) }}</div>
              </div>
              <div class="qr-label wechat">{{ t('about.wechat') }}</div>
            </div>
          </div>
        </div>

        <!-- 英文：直接打开捐赠地址 -->
        <div v-else class="donate">
          <div class="donate-title">{{ t('about.donateTitle') }}</div>
          <div class="donate-desc">{{ t('about.donateDesc') }}</div>
          <button class="donate-btn" @click="openDonateUrl">
            ☕ {{ t('about.donateBtn') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { t, locale } from '@/i18n'
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime'

const emit = defineEmits<{ close: [] }>()

const APP_VERSION = '1.0.0'
const PROJECT_URL = 'https://github.com/user/pixel'
// 英文模式下的捐赠地址，按需修改
const DONATE_URL = 'https://opencollective.com/sandhope'

const alipayBroken = ref(false)
const wechatBroken = ref(false)
const alipaySrc = '/donate-alipay.jpg'
const wechatSrc = '/donate-wechat.jpg'

function openProject() {
  try {
    BrowserOpenURL(PROJECT_URL)
  } catch {
    window.open(PROJECT_URL, '_blank')
  }
}
function openDonateUrl() {
  try {
    BrowserOpenURL(DONATE_URL)
  } catch {
    window.open(DONATE_URL, '_blank')
  }
}
function close() {
  emit('close')
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.about-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  backdrop-filter: blur(4px);
  z-index: 9100;
  display: flex;
  align-items: center;
  justify-content: center;
}
.about-card {
  width: 400px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
  overflow: hidden;
}
.about-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border);
}
.about-title {
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
.about-body {
  padding: 20px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}
.logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  flex-shrink: 0;
  background:
    conic-gradient(from 220deg at 50% 50%, #6366f1, #ec4899, #f59e0b, #10b981, #06b6d4, #6366f1);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.06), 0 6px 20px -6px rgba(99, 102, 241, 0.8);
}
.brand-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--fg);
}
.brand-tagline {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}
.brand-version {
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 2px;
}

.link-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 16px;
}
.link-row:hover {
  border-color: var(--primary);
  background: var(--primary-glow);
}
.link-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}
.link-info {
  flex: 1;
}
.link-name {
  font-size: 13px;
  color: var(--fg);
  font-weight: 600;
}
.link-desc {
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 1px;
}
.link-arrow {
  color: var(--text-dim);
  flex-shrink: 0;
}

.donate {
  border-top: 1px solid var(--border);
  padding-top: 16px;
}
.donate-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--fg);
  margin-bottom: 4px;
}
.donate-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 14px;
}
.qr-grid {
  display: flex;
  gap: 16px;
  justify-content: center;
}
.qr-item {
  text-align: center;
}
.qr-frame {
  width: 140px;
  height: 140px;
  background: #fff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--border);
}
.qr-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.qr-missing {
  font-size: 10px;
  color: var(--text-dim);
  text-align: center;
  padding: 8px;
  line-height: 1.4;
}
.qr-label {
  font-size: 12px;
  margin-top: 6px;
  font-weight: 600;
}
.qr-label.alipay {
  color: #1678ff;
}
.qr-label.wechat {
  color: #2aae67;
}
.donate-btn {
  width: 100%;
  background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
  border: none;
  color: #fff;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.donate-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}
</style>
