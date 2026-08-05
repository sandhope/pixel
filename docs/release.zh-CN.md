# 发版指南

Pixel Logo Studio 以跨平台桌面应用（Windows、macOS、Linux）形式发布。
发版流程由 [`Release` 工作流](../.github/workflows/release.yml) 全自动完成——只要推送匹配 `v*`
的标签就会触发，**无需**手动构建或上传二进制文件。

## 步骤

1. **更新版本号**（两处保持一致）：
   - `wails.json` → `info.productVersion`
   - `frontend/package.json` → `version`

2. **提交版本变更**（commit 信息用英文，例如 `v1.1.0`）：

   ```bash
   git add wails.json frontend/package.json
   git commit -m "v1.1.0"
   ```

3. **打标签并推送。** 标签必须是 `v` + 上面的版本号。先推分支，再推那个具体标签：

   ```bash
   git tag v1.1.0
   git push origin main
   git push origin v1.1.0
   ```

完成——推送标签即启动发版。

## 工作流会做什么

在 `v*` 标签推送后，CI 会在 3 个平台上并行运行 **5 个构建任务**：

| 平台 | Runner | 架构 |
|------|--------|------|
| Windows | `windows-latest` | amd64, arm64 |
| macOS | `macos-13` (Intel) + `macos-14` (Apple Silicon) | amd64, arm64 |
| Linux | `ubuntu-latest` | amd64 |

每个构建任务会：

1. 执行 `wails build -platform <platform>/<arch> -clean -o pixel`。
2. 打包产物：
   - **Windows：** 独立 `.exe` + `.zip` + `.sha256`
   - **macOS：** `.app` bundle → `.tar.gz` + `.sha256`
   - **Linux：** 原始二进制 → `.gz` + `.sha256`
3. 发布名为 `Pixel Logo Studio <tag>` 的 **GitHub Release**，附带全部产物；
   发布正文由双语下载指南与自动生成的 "What's Changed" 更新说明组合而成。
4. 含连字符的标签（如 `v1.1.0-beta.1`）会自动标记为 **预发布（pre-release）**。

## 注意事项

- 版本号、提交与标签三者必须一致，否则发布产物的命名会错乱。
- 无需配置任何密钥——工作流使用内置的 `GITHUB_TOKEN`。
- **Windows** 构建需要 WebView2 运行时（Win10/11 已内置）。
- **macOS** 构建首次运行可能被 Gatekeeper 拦截——右键 → "打开"，或运行：
  `xattr -d com.apple.quarantine /Applications/Pixel\ Logo\ Studio.app`
- **Linux** 构建需要 WebKitGTK（`libwebkit2gtk-4.1-0`）。
- 打标签前如需本地自测构建：

  ```bash
  wails build
  ```

  产物为 `build/bin/pixel`（Windows 下为 `pixel.exe`）。