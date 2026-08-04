package main

import (
	"bytes"
	"encoding/binary"
	"image"
	"image/color"
	"image/png"
	"math"
	"os"
)

// 生成与 CSS conic-gradient(from 220deg at 50% 50%, #6366f1, #ec4899, #f59e0b, #10b981, #06b6d4, #6366f1)
// + border-radius:8px(on 30px) 等价的 PNG 图标 + 多尺寸 ICO 文件。
func main() {
	// 1. 生成 1024x1024 PNG → build/appicon.png
	pngImg := renderIcon(1024)
	writePNG("build/appicon.png", pngImg)
	println("Generated: build/appicon.png")

	// 2. 生成多尺寸 ICO → build/windows/icon.ico
	sizes := []int{256, 128, 64, 48, 32, 16}
	images := make([][]byte, len(sizes))
	for i, s := range sizes {
		img := renderIcon(s)
		var buf bytes.Buffer
		png.Encode(&buf, img)
		images[i] = buf.Bytes()
	}
	writeICO("build/windows/icon.ico", sizes, images)
	println("Generated: build/windows/icon.ico")
}

func renderIcon(size int) *image.RGBA {
	img := image.NewRGBA(image.Rect(0, 0, size, size))
	cx := float64(size) / 2
	cy := float64(size) / 2
	cornerRadius := float64(size) * 8.0 / 30.0

	stops := []struct {
		pos     float64
		r, g, b float64
	}{
		{0.0, 0x63, 0x66, 0xf1},
		{0.2, 0xec, 0x48, 0x99},
		{0.4, 0xf5, 0x9e, 0x0b},
		{0.6, 0x10, 0xb9, 0x81},
		{0.8, 0x06, 0xb6, 0xd4},
		{1.0, 0x63, 0x66, 0xf1},
	}

	for y := 0; y < size; y++ {
		for x := 0; x < size; x++ {
			fx := float64(x) + 0.5
			fy := float64(y) + 0.5
			alpha := roundedRectAlpha(fx, fy, float64(size), cornerRadius)
			if alpha <= 0 {
				continue
			}
			dx := fx - cx
			dy := fy - cy
			cssAngleRad := math.Atan2(dx, -dy)
			if cssAngleRad < 0 {
				cssAngleRad += 2 * math.Pi
			}
			cssAngleDeg := cssAngleRad * 180 / math.Pi
			t := math.Mod(cssAngleDeg-220+360, 360) / 360
			r, g, b := interpolate(stops, t)
			a := uint8(alpha * 255)
			img.Set(x, y, color.RGBA{R: uint8(r), G: uint8(g), B: uint8(b), A: a})
		}
	}
	return img
}

func roundedRectAlpha(x, y, size, r float64) float64 {
	inLeft := x < r
	inRight := x > size-r
	inTop := y < r
	inBottom := y > size-r
	if (inLeft || inRight) && (inTop || inBottom) {
		cx := r
		if inRight {
			cx = size - r
		}
		cy := r
		if inBottom {
			cy = size - r
		}
		dx := x - cx
		dy := y - cy
		dist := math.Sqrt(dx*dx + dy*dy)
		if dist > r {
			return 0
		}
		if dist > r-1 {
			return r - dist
		}
		return 1
	}
	return 1
}

func interpolate(stops []struct {
	pos     float64
	r, g, b float64
}, t float64) (float64, float64, float64) {
	if t <= 0 {
		return stops[0].r, stops[0].g, stops[0].b
	}
	if t >= 1 {
		return stops[len(stops)-1].r, stops[len(stops)-1].g, stops[len(stops)-1].b
	}
	for i := 0; i < len(stops)-1; i++ {
		if t >= stops[i].pos && t <= stops[i+1].pos {
			local := (t - stops[i].pos) / (stops[i+1].pos - stops[i].pos)
			r := stops[i].r + (stops[i+1].r-stops[i].r)*local
			g := stops[i].g + (stops[i+1].g-stops[i].g)*local
			b := stops[i].b + (stops[i+1].b-stops[i].b)*local
			return r, g, b
		}
	}
	return stops[len(stops)-1].r, stops[len(stops)-1].g, stops[len(stops)-1].b
}

func writePNG(path string, img image.Image) {
	f, err := os.Create(path)
	if err != nil {
		panic(err)
	}
	defer f.Close()
	if err := png.Encode(f, img); err != nil {
		panic(err)
	}
}

// writeICO 写入 PNG-in-ICO 格式（Windows Vista+ 支持，Wails/WebView2 完全兼容）
func writeICO(path string, sizes []int, pngData [][]byte) {
	f, err := os.Create(path)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	count := uint16(len(sizes))
	headerSize := 6 + int(count)*16
	dataOffset := uint32(headerSize)

	// ICONDIR
	binary.Write(f, binary.LittleEndian, uint16(0)) // reserved
	binary.Write(f, binary.LittleEndian, uint16(1)) // type = icon
	binary.Write(f, binary.LittleEndian, count)     // image count

	// ICONDIRENTRY for each
	for i, s := range sizes {
		w := byte(s)
		h := byte(s)
		if s == 256 {
			w = 0 // 256 用 0 表示
			h = 0
		}
		dataSize := uint32(len(pngData[i]))
		f.Write([]byte{w})                       // width
		f.Write([]byte{h})                       // height
		f.Write([]byte{0})                       // color count (0 = >256)
		f.Write([]byte{0})                       // reserved
		binary.Write(f, binary.LittleEndian, uint16(1))  // planes
		binary.Write(f, binary.LittleEndian, uint16(32)) // bpp
		binary.Write(f, binary.LittleEndian, dataSize)   // data size
		binary.Write(f, binary.LittleEndian, dataOffset) // offset
		dataOffset += dataSize
	}

	// PNG data
	for _, d := range pngData {
		f.Write(d)
	}
}
