<div align="center">

# Pixel Logo Studio

**A drag-and-drop, block-stacking logo editor for the desktop.**  
Build logos from primitive shapes, keep a transparent background, and export crisp PNG & SVG.

[简体中文](./README.zh-CN.md) · English

</div>

---

## ✨ Features

- **Block-stacking design** — Drag (or click) 9 primitive shapes from the left library onto the canvas: rectangle, circle, ellipse, line, triangle, polygon, star, heart (path), and text.
- **Full transform** — Click to select, drag to move; 8-direction scaling handles; a top stem handle for rotation (Shift snaps to 15°); arrow keys nudge 1 px (Shift = 10 px).
- **Layer panel** — Reorder by drag-and-drop, toggle visibility (👁), lock (🔒), delete; four-step z-order buttons (to bottom / down / up / to top).
- **Property panel** — Name, X/Y, width/height, rotation, opacity, corner radius (rect), point count & inner ratio (star), side count (polygon), text / font size / weight / family / align, fill color, stroke color & width.
- **Multi-select alignment** — With ≥ 2 shapes selected: one-click left / horizontal-center / right / top / vertical-center / bottom.
- **Transparent background** — Checkerboard preview in the UI; on export the PNG keeps its alpha channel and the SVG omits any background rect.
- **Export**
  - **PNG** — rendered via an in-browser Canvas at 1× / 2× / 3× / 4× supersampling, then handed to the Go backend which shows a native save dialog and writes the file (with PNG magic-byte validation).
  - **SVG** — serialized straight from the in-memory shape tree; vector, lossless, infinitely scalable.
- **Project persistence** — Save / open `.pixel.json` project files for later editing; the editor state is also auto-cached in `localStorage`.
- **Undo / redo** — 50-step history stack (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y).
- **Canvas presets** — 512², 1024², 1920×1080, 1200×630, 800×600, plus custom width/height and a transparent / solid-color background toggle.
- **Dual runtime** — Ships as a Wails desktop app; the frontend can also run standalone via `npm run dev` with a browser-download fallback when the Go backend is absent.

## 🧱 Tech stack

| Layer | Technology |
|------|------|
| Desktop shell | [Wails v2](https://wails.io) v2.13.0 (Go 1.22+) |
| Native dialogs / file I/O | Go (`runtime.SaveFileDialog`, `os.WriteFile`) |
| Frontend | Vue 3.5 + TypeScript + Vite 6 |
| State | Pinia 2 |
| Rendering | SVG DOM (editable) → Canvas (PNG export) |

## 📁 Project structure

```
pixel/
├── main.go                 # Wails entry (embed frontend/dist, window config)
├── app.go                  # Go backend: SavePngDataUrl / SaveSvg / SaveProjectJson / LoadProjectJson
├── go.mod / go.sum
├── wails.json              # Product name & build config
├── build/bin/pixel.exe     # Build output
└── frontend/
    ├── package.json        # Vue 3.5 + Pinia 2.3 + nanoid 5 + Vite 6
    ├── vite.config.ts      # @ -> src alias
    └── src/
        ├── main.ts / App.vue / styles/main.css   # dark-theme three-column layout
        ├── types/shapes.ts                       # Shape union type (9 kinds)
        ├── store/editor.ts                       # Pinia: 50-step undo/redo, align, import/export
        ├── utils/
        │   ├── shapeFactory.ts    # createShape (default params & color rotation per type)
        │   ├── svgRender.ts       # shape -> SVG fragment (polygon/star/path auto-generated points)
        │   ├── exportSvg.ts       # assemble a complete valid SVG (xmlns + viewBox + optional bg rect)
        │   └── svgToPng.ts        # SVG Blob -> Image -> Canvas.toDataURL('image/png'), natively transparent
        ├── wails/bindings.ts      # uses window.go.main.App when present, falls back to browser download
        └── components/
            ├── Toolbar.vue        # undo/redo, duplicate/delete, open/save project, clear, 1-4x scale, PNG/SVG export
            ├── ShapePanel.vue     # 3-column icon grid (click or drag); canvas size / bg / presets
            ├── EditorCanvas.vue   # SVG canvas: hit-area click / move / 8-way scale / rotate / keyboard / drop
            └── RightPanel.vue     # layer list (drag-to-reorder) + multi-select align + property panel
```

## 🚀 Getting started

### Prerequisites

- [Go](https://go.dev/dl/) 1.22+
- [Node.js](https://nodejs.org/) 18+ (tested on v26)
- [Wails CLI](https://wails.io/docs/gettingstarted/installation) v2 — `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- Windows: WebView2 runtime (preinstalled on Windows 11)

### Install & run (desktop dev)

```bash
# from the project root
$env:GOPROXY = "https://goproxy.cn,direct"   # Windows PowerShell; use export on *nix
wails dev
```

### Frontend-only dev (browser preview)

```bash
cd frontend
npm install
npm run dev
# open http://127.0.0.1:5173
```

When the Go backend is unavailable the editor auto-falls back to browser file dialogs: exports trigger an `<a download>` and "Open project" uses an `<input type="file">`.

### Production build

```bash
$env:GOPROXY = "https://goproxy.cn,direct"
wails build
# output: build/bin/pixel.exe
```

## ⌨️ Keyboard shortcuts

| Action | Shortcut |
|------|------|
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Shift+Z` / `Ctrl+Y` |
| Select all | `Ctrl+A` |
| Duplicate | `Ctrl+D` |
| Delete | `Delete` / `Backspace` |
| Nudge 1 px | `↑` `↓` `←` `→` |
| Nudge 10 px | `Shift` + arrow |
| Rotation snap 15° | `Shift` + drag rotate handle |
| Proportional scale | `Shift` + drag corner handle |
| Add to selection | `Shift` / `Ctrl` / `⌘` + click |

## 🎯 How transparency is preserved

1. **UI** — A CSS checkerboard behind the SVG canvas hints at transparency; the SVG itself has no background element when `canvas.background === 'transparent'`.
2. **SVG export** — A background `<rect>` is only appended when the user picks a solid color; otherwise the SVG stays transparent.
3. **PNG export** — `new Image()` loads the SVG blob, `ctx.clearRect` zeroes the canvas (= transparent), `drawImage` rasterizes, `toDataURL('image/png')` produces a transparent RGBA PNG.
4. **Validation** — The Go backend checks the 8-byte PNG magic (`89 50 4E 47 0D 0A 1A 0A`) before writing, so corrupt payloads can never reach disk.

## 📄 License

MIT — use it, fork it, ship logos.
