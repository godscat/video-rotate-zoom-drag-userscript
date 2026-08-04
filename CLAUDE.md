# CLAUDE.md

本文件为 AI 助手（Claude Code / opencode 等）在本仓库工作时提供指引。`AGENTS.md` 是指向本文件的符号链接。

## 项目概览

多平台视频增强用户脚本：为视频播放器添加 **缩放 / 双向旋转 / 拖拽平移 / 滚轮缩放**，并提供一个跟随视频的玻璃风悬浮工具条。

**核心架构特点（参考 chimo-chimo-loop，重写于 v2）**：

- **零平台选择器**：不依赖任何站点 CSS 选择器，直接 `document.querySelector('video')` + `play` 事件发现视频，`@match *://*/*` 通配所有站点。
- **悬浮浮层 UI**：控制条为 `position:fixed` 容器挂到 `body`，通过 `getBoundingClientRect()` 实时跟随视频父元素（stage）位置——而非塞进平台自己的控制栏。
- **变换作用于 `<video>` 本身**：通过动态 `<style>` 标签 + `video[data-vrz-active]` 属性选择器注入 `transform`，不污染 inline style。
- **90° 旋转无黑边**：`calculateScale()` 按 `object-fit:contain` 反推缩放比例。
- **每站点配置**：拖拽/滚轮的修饰键组合按 `location.hostname` 存入 IndexedDB。
- **尺寸门槛**：渲染尺寸 < 400×225 的视频（如信息流 hover 预览）不激活，避免误触。

## 构建系统

### 命令

```bash
pnpm run build    # 生产构建
pnpm run watch    # 监听模式
pnpm run dev      # 开发提示
node build-simple.js   # 直接构建（等价 build）
```

### 包管理器

- **pnpm**（package.json 已声明，版本 10.18.1+）

### 构建产物

- **入口**：`src/video-rotate-zoom-drag.user.js`（IIFE，`import { App }`）
- **构建工具**：自定义 `build-simple.js`——自动发现 `src/modules/*.js`，**按文件名字典序拼接**，剥离 `import/export`，再拼上主入口。
- **开发态**：可直接在 Tampermonkey 加载 `src/video-rotate-zoom-drag.user.js`（需 ES module 支持）。
- **生产态**：输出可读、未压缩的 `dist/video-rotate-zoom-drag.user.js`。

> ⚠️ 拼接顺序由文件名字典序决定。跨模块引用必须满足：(1) 函数声明会被提升，可跨文件用；(2) `const/class` 存在 TDZ，**禁止在模块顶层引用其它模块的 const/class**，只能在构造函数/方法内（运行期）引用——因为 `new App()` 在主入口（最后）才执行。

## 架构

### 模块清单（src/modules/，共 13 个）

| 文件 | 职责 |
|------|------|
| `config.js` | 全局默认配置：缩放/旋转/移动参数、激活尺寸阈值、拖拽/滚轮默认修饰键（`modifiers` 数组）、`e.code` 快捷键 |
| `logger.js` | 日志单例（`getLogger()`），带时间戳与模块前缀，支持 `createChild()` |
| `styles.js` | 玻璃浮层 CSS（静态字符串），通过 `<style>` 注入 |
| `transform-engine.js` | **唯一状态源**：持有 zoom/rotation/offset；`apply()` 用动态 `<style>` 应用变换；`calculateScale()` 处理 90°；ResizeObserver 监听尺寸重算；提供 zoomIn/zoomOut/rotateLeft/rotateRight/move/reset |
| `video-scanner`（合并于 app） | 视频发现由 `App.scan()` 承担 |
| `ui-overlay.js` | 悬浮控制条：主栏（缩放/旋转/还原/展开）+ 次级面板（方向组↑↓←→长按连发 / 配置 / 帮助 / 缩回）；`reposition()` 跟随；hover 显隐 |
| `drag-handler.js` | document 级 mousedown/move/up；读 `site-config` 修饰键；在 stage 内拖拽，排除按钮等控件；拖拽时关过渡保证跟手 |
| `wheel-handler.js` | document 级 wheel（capture）；读 `site-config` 修饰键；仅视频区域内触发 |
| `keyboard-shortcuts.js` | `e.code` 匹配（规避 Shift 改字符问题）；缩放/旋转/移动/还原/全屏 |
| `site-config.js` | 运行时站点配置：默认值 + IndexedDB 异步加载合并 + `subscribe()`；`checkModifiers()` 组合判定（所选键全部按下）；`getDragConfig()`/`getZoomConfig()`；min-1 强制 |
| `storage.js` | IndexedDB 封装。DB `vrz-config`（v1），两个 store：`siteConfig`（keyPath=host）+ `meta`（keyPath=key，库说明） |
| `config-panel.js` | 修饰键配置模态：拖拽区 + 缩放区，各为「启用/禁用 + alt/ctrl/shift 多选」；min-1 校验（取消最后一个会抖动提示）；写回 site-config |
| `help-panel.js` | 快捷键只读浮层 |
| `app.js` | **协调器**（取代旧 Initializer）：视频发现/SPA 监听/位置同步/显隐控制/清理；装配所有模块 |

### 模块依赖

```
App（协调器）
├── Styles（样式注入）
├── SiteConfig（站点配置，异步 IndexedDB）
│   └── storage.js（IndexedDB）
├── TransformEngine（核心状态，变换应用）
├── UIOverlay（悬浮 UI，回调 onConfig/onHelp）
│   └── ConfigPanel / HelpPanel
├── DragHandler    → 读 SiteConfig + 写 TransformEngine
├── WheelHandler   → 读 SiteConfig + 写 TransformEngine
└── KeyboardShortcuts → 写 TransformEngine
```

### 关键设计模式

- **单一职责**：每个模块只管一件事。
- **TransformEngine 是唯一真相源**：所有状态变更经它，`onChange` 回调通知 UI 刷新。
- **事件驱动 + 全局监听**：Drag/Wheel/Keyboard 在 document 上监听一次，通过 `app.activeVideo` 取当前视频，无需随视频切换重绑。
- **生命周期**：各模块提供 `destroy()`；App 提供 `stop()` 统一清理。
- **SPA 感知**：MutationObserver 监听 body，防抖后 `scan()`；`play` 事件即时激活。
- **平台无关**：完全不用平台选择器；差异化需求（如拖拽修饰键）通过每站点配置实现。

## 用户脚本配置

### @match

`*://*/*` —— 通配所有站点。脚本自动发现 `<video>`，按站点独立保存配置。

### @grant

- `GM_addStyle`（保留，实际用 `<style>` 标签注入亦可）

### @run-at

`document-start` —— 主入口在 `load` 后执行 `new App()`，保证 `body` 就绪。

## 数据持久化（IndexedDB）

```
DB: vrz-config (version 1)
├── store: siteConfig   keyPath: host
│     { host, drag:{enabled,modifiers}, zoom:{enabled,modifiers} }
└── store: meta         keyPath: key
      { key:'about', purpose, detail, stores, createdAt }   ← 库说明，devtools 可见
```

- 按 `location.hostname` 做 key，天然每站点隔离。
- `site-config.js` 加载失败时优雅降级到默认值（`modifiers: ['shift']`）。
- **重要**：`onupgradeneeded` 内不可 `db.transaction()` 另起新事务（会抛 `InvalidStateError`），必须复用 `req.transaction` 或 `createObjectStore` 返回的句柄。

## 配置与快捷键默认值

- **缩放**：50%–300%，步长 5%
- **旋转**：90° 双向
- **移动**：步长 20px
- **激活尺寸门槛**：`minActivateWidth=400, minActivateHeight=225`
- **拖拽/滚轮默认修饰键**：`['shift']`（可组合 alt/ctrl/shift，min-1）
- **快捷键**（`e.code`）：
  - `Shift + Equal/Minus` 缩放
  - `Shift + KeyL/KeyR` 旋转
  - `Shift + Digit0` 还原
  - `Shift + Space` 全屏
  - `Shift + Arrow*` 移动

## 开发流程

### 新增功能

1. 在 `src/modules/` 新建/修改模块，正确 `import`。
2. 如需协调，在 `app.js` 装配，并在 `stop()` 加入清理。
3. 用全局 logger：`getLogger().createChild('ModuleName')`。
4. 注意拼接顺序约束（见上文 ⚠️）。
5. `node build-simple.js` 构建，`node --check dist/video-rotate-zoom-drag.user.js` 校验语法。

### 文件组织

- **主入口**：`src/video-rotate-zoom-drag.user.js`
- **模块**：`src/modules/*.js`
- **构建产物**：`dist/video-rotate-zoom-drag.user.js`
- **用户脚本头模板**：`userscript-headers.js`（含致谢）
- **参考来源**：`example-source/chimo-chimo-loop.js`、`origin-source/video.util.js`

## 测试

1. **开发**：Tampermonkey 直接加载 `src/video-rotate-zoom-drag.user.js`。
2. **生产**：`node build-simple.js` 后用 `dist/` 版本。
3. **重点验证**：视频发现、旋转 90° 无黑边、拖拽/滚轮修饰键、配置面板持久化、信息流预览不被激活。
4. 看控制台日志：`[时间] [VideoController:模块] [级别] ...`。

## 浏览器兼容性

- 现代浏览器（ES module、IndexedDB、ResizeObserver、`requestVideoFrameCallback` 可选）
- Tampermonkey / Greasemonkey
- 标准 DOM API + CSS transform
