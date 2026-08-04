/**
 * 调用 Wails 后端方法的辅助封装。
 *
 * 两种运行模式：
 * 1) 桌面应用 (wails dev / wails build 启动)：window.go.main.App.* 存在，直接调用，返回 Promise
 * 2) 纯前端开发模式 (单独 `npm run dev` 启动 Vite)：window.go 不存在，使用 fallback：
 *    - 保存/打开：使用浏览器下载/文件选择对话框
 *    - 另：SavePngDataUrl 触发 <a download> 下载
 */

export interface BackendApi {
  SavePngDataUrl(dataUrl: string, suggestedName: string): Promise<string | null>
  SaveSvg(svgContent: string, suggestedName: string): Promise<string | null>
  SaveProjectJson(json: string, suggestedName: string): Promise<string | null>
  LoadProjectJson(): Promise<string | null>
  GetAppInfo(): Promise<Record<string, string>>
}

declare global {
  interface Window {
    go?: {
      main?: {
        App?: Partial<BackendApi>
      }
    }
  }
}

export function hasWailsBackend(): boolean {
  return !!(typeof window !== 'undefined' && window.go?.main?.App)
}

export async function callBackend<K extends keyof BackendApi>(
  method: K,
  ...args: Parameters<BackendApi[K]>
): Promise<Awaited<ReturnType<BackendApi[K]>>> {
  if (hasWailsBackend()) {
    const fn = window.go!.main!.App![method] as any
    if (typeof fn !== 'function') throw new Error(`后端未实现: ${method}`)
    return (fn as Function)(...(args as any[]))
  }
  return (fallback as any)[method](...args)
}

const fallback: BackendApi = {
  async SavePngDataUrl(dataUrl: string, name: string) {
    triggerDownload(dataUrl, ensureExt(name, 'png'))
    return name
  },
  async SaveSvg(svgContent: string, name: string) {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    try {
      triggerDownload(url, ensureExt(name, 'svg'))
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    }
    return name
  },
  async SaveProjectJson(json: string, name: string) {
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    try {
      triggerDownload(url, ensureExt(name, 'pixel.json'))
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    }
    return name
  },
  async LoadProjectJson(): Promise<string | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.pixel.json,application/json,.json'
      input.onchange = () => {
        const f = input.files?.[0]
        if (!f) {
          resolve(null)
          return
        }
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ''))
        reader.onerror = () => resolve(null)
        reader.readAsText(f, 'utf-8')
      }
      input.click()
    })
  },
  async GetAppInfo() {
    return { name: 'Pixel Logo Studio (Web)', version: '1.0.0', cwd: location.href }
  },
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => a.remove(), 0)
}

function ensureExt(name: string, ext: string): string {
  const dotExt = '.' + ext
  if (name.toLowerCase().endsWith(dotExt)) return name
  return name + dotExt
}
