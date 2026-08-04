package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"image/png"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// SavePngDataUrl 接收前端通过 canvas 导出的 PNG data:image/png;base64,xxx 字符串，弹保存对话框写入文件
func (a *App) SavePngDataUrl(dataUrl string, suggestedName string) (string, error) {
	if strings.TrimSpace(dataUrl) == "" {
		return "", errors.New("导出数据为空")
	}
	raw, err := dataUrlToBytes(dataUrl)
	if err != nil {
		return "", err
	}
	savePath, err := a.pickSavePath(suggestedName, "png", "PNG 图片 (*.png)")
	if err != nil {
		return "", err
	}
	if savePath == "" {
		return "", errors.New("用户取消")
	}
	if err := os.WriteFile(savePath, raw, 0644); err != nil {
		return "", fmt.Errorf("写入文件失败: %w", err)
	}
	return savePath, nil
}

// SaveSvg 将 SVG 文本保存为 .svg 文件
func (a *App) SaveSvg(svgContent string, suggestedName string) (string, error) {
	if strings.TrimSpace(svgContent) == "" {
		return "", errors.New("画布为空，无法导出")
	}
	savePath, err := a.pickSavePath(suggestedName, "svg", "SVG 矢量图 (*.svg)")
	if err != nil {
		return "", err
	}
	if savePath == "" {
		return "", errors.New("用户取消")
	}
	if err := os.WriteFile(savePath, []byte(svgContent), 0644); err != nil {
		return "", fmt.Errorf("写入文件失败: %w", err)
	}
	return savePath, nil
}

// SaveProjectJson 保存项目文件（.pixel.json），方便以后重新编辑
func (a *App) SaveProjectJson(json string, suggestedName string) (string, error) {
	if strings.TrimSpace(json) == "" {
		return "", errors.New("项目数据为空")
	}
	savePath, err := a.pickSavePath(suggestedName, "pixel.json", "Pixel Project (*.pixel.json)")
	if err != nil {
		return "", err
	}
	if savePath == "" {
		return "", errors.New("用户取消")
	}
	if err := os.WriteFile(savePath, []byte(json), 0644); err != nil {
		return "", fmt.Errorf("写入文件失败: %w", err)
	}
	return savePath, nil
}

// LoadProjectJson 打开项目文件
func (a *App) LoadProjectJson() (string, error) {
	paths, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "打开 Pixel 项目",
		Filters: []runtime.FileFilter{
			{DisplayName: "Pixel Project (*.pixel.json)", Pattern: "*.pixel.json"},
			{DisplayName: "JSON 文件 (*.json)", Pattern: "*.json"},
			{DisplayName: "所有文件", Pattern: "*.*"},
		},
	})
	if err != nil {
		return "", err
	}
	if paths == "" {
		return "", errors.New("用户取消")
	}
	raw, err := os.ReadFile(paths)
	if err != nil {
		return "", fmt.Errorf("读取文件失败: %w", err)
	}
	return string(raw), nil
}

// ValidatePngBytes 辅助：检查 base64 解码出的字节是不是有效 PNG
func ValidatePngBytes(b []byte) bool {
	return len(b) > 8 &&
		b[0] == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G' &&
		b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A
}

func (a *App) pickSavePath(suggestedName string, ext string, filterLabel string) (string, error) {
	dotExt := "." + ext
	name := strings.TrimSpace(suggestedName)
	if name == "" {
		name = "untitled" + dotExt
	} else if !strings.HasSuffix(strings.ToLower(name), dotExt) {
		name += dotExt
	}
	return runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: name,
		Title:           "导出 " + strings.ToUpper(ext),
		Filters: []runtime.FileFilter{
			{DisplayName: filterLabel, Pattern: "*" + dotExt},
		},
	})
}

func dataUrlToBytes(dataUrl string) ([]byte, error) {
	// 允许两种形式： data:image/png;base64,xxxx  或  纯 base64
	payload := dataUrl
	if comma := strings.Index(dataUrl, ","); comma >= 0 {
		prefix := dataUrl[:comma]
		if !strings.Contains(prefix, "image/png") {
			return nil, errors.New("仅支持 PNG dataURL")
		}
		payload = dataUrl[comma+1:]
	}
	payload = strings.TrimSpace(payload)
	raw, err := base64.StdEncoding.DecodeString(payload)
	if err != nil {
		// 尝试 URL-safe base64
		safe := strings.ReplaceAll(strings.ReplaceAll(payload, "-", "+"), "_", "/")
		switch len(safe) % 4 {
		case 2:
			safe += "=="
		case 3:
			safe += "="
		}
		raw, err = base64.StdEncoding.DecodeString(safe)
		if err != nil {
			return nil, fmt.Errorf("base64 解码失败: %w", err)
		}
	}
	// 验证 PNG 魔数，避免前端传错
	if !ValidatePngBytes(raw) {
		return nil, errors.New("导出数据不是有效 PNG")
	}
	return raw, nil
}

// PreviewPngBase64 可选：若前端需要后端转 canvas（现在前端自己做更可靠，此函数仅保留占位）
// 为了保持向后兼容，这里直接返回传入 dataUrl 的 payload 部分（不做转换）
func (a *App) PreviewPngBase64(svgContent string, width int, height int) (string, error) {
	// 返回占位，前端使用自身的 canvas 转换逻辑
	_ = svgContent
	_ = width
	_ = height
	return "", errors.New("请使用前端 Canvas 导出 PNG 预览；此接口保留未启用")
}

// PngBytesDataUrl 纯字节 PNG => dataURL（备用）
func PngBytesDataUrl(b []byte) string {
	if len(b) == 0 {
		return ""
	}
	_ = png.Encode // keep import
	_ = bytes.Buffer{}
	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(b)
}

func (a *App) GetAppInfo() map[string]string {
	return map[string]string{
		"name":    "Pixel Logo Studio",
		"version": "1.0.0",
		"cwd":     mustCwd(),
	}
}

func mustCwd() string {
	cwd, _ := os.Getwd()
	if cwd == "" {
		cwd = filepath.Dir(os.Args[0])
	}
	return cwd
}
