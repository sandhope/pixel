# Releasing

Pixel Logo Studio ships as a cross-platform desktop app (Windows, macOS, Linux).
Releases are fully automated by the [`Release` workflow](../.github/workflows/release.yml),
which triggers whenever a tag matching `v*` is pushed. You do **not** build or upload
binaries by hand.

## Steps

1. **Bump the version** in both files (keep them in sync):
   - `wails.json` → `info.productVersion`
   - `frontend/package.json` → `version`

2. **Commit the bump** (English commit message, e.g. `v1.1.0`):

   ```bash
   git add wails.json frontend/package.json
   git commit -m "v1.1.0"
   ```

3. **Tag and push.** The tag must be `v` + the version above. Push the branch
   first, then the specific tag:

   ```bash
   git tag v1.1.0
   git push origin main
   git push origin v1.1.0
   ```

That's it — pushing the tag starts the release.

## What the workflow does

On a `v*` tag push, CI runs **5 parallel builds** across 3 platforms:

| Platform | Runner | Architectures |
|----------|--------|---------------|
| Windows | `windows-latest` | amd64, arm64 |
| macOS | `macos-13` (Intel) + `macos-14` (Apple Silicon) | amd64, arm64 |
| Linux | `ubuntu-latest` | amd64 |

For each build the workflow will:

1. Run `wails build -platform <platform>/<arch> -clean -o pixel`.
2. Package the artifact:
   - **Windows:** standalone `.exe` + `.zip` + `.sha256`
   - **macOS:** `.app` bundle → `.tar.gz` + `.sha256`
   - **Linux:** raw binary → `.gz` + `.sha256`
3. Publish a **GitHub Release** named `Pixel Logo Studio <tag>`, attaching all
   artifacts. The release body combines a bilingual download guide with the
   auto-generated "What's Changed" notes.
4. Tags containing a hyphen (e.g. `v1.1.0-beta.1`) are published as a
   **pre-release** automatically.

## Notes

- Version numbers, the commit, and the tag must all match, or the release
  artifacts will be misnamed.
- No secrets are required — the workflow uses the built-in `GITHUB_TOKEN`.
- **Windows** builds require the WebView2 runtime (pre-installed on Win10/11).
- **macOS** builds may be blocked by Gatekeeper on first run — right-click →
  "Open", or run: `xattr -d com.apple.quarantine /Applications/Pixel\ Logo\ Studio.app`
- **Linux** builds require WebKitGTK (`libwebkit2gtk-4.1-0`).
- To sanity-check a build locally before tagging:

  ```bash
  wails build
  ```

  The output is `build/bin/pixel` (or `pixel.exe` on Windows).