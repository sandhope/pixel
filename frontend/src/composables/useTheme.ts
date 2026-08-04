import { ref } from 'vue'

export type ThemeId = 'dark' | 'light'

export interface ThemeDef {
  id: ThemeId
  labelKey: 'theme.dark' | 'theme.light'
  cls: string
  gradient: string
}

export const THEMES: ThemeDef[] = [
  {
    id: 'dark',
    labelKey: 'theme.dark',
    cls: 'dark',
    gradient: 'linear-gradient(135deg, #6366f1, #0b1220)',
  },
  {
    id: 'light',
    labelKey: 'theme.light',
    cls: 'light',
    gradient: 'linear-gradient(135deg, #f1f5f9, #6366f1)',
  },
]

const STORAGE_KEY = 'pixel-theme'

const current = ref<ThemeId>('dark')

function apply(theme: ThemeId) {
  current.value = theme
  const root = document.documentElement
  if (theme === 'dark') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', theme)
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {}
}

export function init() {
  let saved: ThemeId = 'dark'
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark') saved = v
  } catch {}
  apply(saved)
}

export function useTheme() {
  return { current, themes: THEMES, apply, init }
}
