declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

/// <reference types="vite/client" />

// 全局常量，由 vite.config.ts 在构建时从 wails.json 的 productVersion 注入
declare const __APP_VERSION__: string
