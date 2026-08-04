import { computed, ref, watch } from 'vue'
import type { Locale, LocaleMessages } from './types'
import zhCN from './zh-CN'
import en from './en'

const STORAGE_KEY = 'pixel-language'

const messages: Record<Locale, LocaleMessages> = {
  'zh-CN': zhCN,
  en,
}

function detectLocale(): Locale {
  // 1. 读取持久化
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'zh-CN' || saved === 'en') return saved
  } catch {}
  // 2. 浏览器语言自动检测
  const navLang = (navigator.language || 'zh-CN').toLowerCase()
  if (navLang.startsWith('zh')) return 'zh-CN'
  return 'en'
}

const locale = ref<Locale>(detectLocale())

function setLocale(l: Locale) {
  locale.value = l
  try {
    localStorage.setItem(STORAGE_KEY, l)
  } catch {}
}

function t(key: keyof LocaleMessages): string {
  return messages[locale.value][key] ?? messages['zh-CN'][key] ?? key
}

// 全局响应式 t，方便在模板内直接用 t('key')
export function useI18n() {
  return {
    locale: computed(() => locale.value),
    t: computed(() => t),
    setLocale,
  }
}

export { locale, setLocale, t }
export type { Locale, LocaleMessages }
