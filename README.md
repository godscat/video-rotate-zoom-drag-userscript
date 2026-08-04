# 多平台视频增强：缩放 / 旋转 / 拖拽

为任意网页的视频播放器添加 **缩放、双向旋转、拖拽平移、滚轮缩放**，并配有一个跟随视频的玻璃风悬浮工具条。

**零平台适配**：不依赖任何站点 CSS 选择器，自动发现页面中的 `<video>`，在所有站点生效（`@match *://*/*`）。

## ✨ 功能特性

- 🎯 **零平台适配**：自动发现 `<video>`，B站 / YouTube / 任意站点通用
- 🔍 **缩放**：50% – 300%，步长 5%（按钮 / 键盘 / 滚轮）
- 🔄 **双向旋转**：90° 增量，左旋 / 右旋；90°/270° 自动按 contain 反推缩放，无黑边
- 🖱️ **拖拽平移**：按修饰键拖拽视频；可按站点配置修饰键组合
- 🖲️ **滚轮缩放**：按修饰键 + 滚轮缩放
- 🧭 **悬浮工具条**：跟随视频位置的玻璃浮层，鼠标移入显示、移出自动隐藏
- ▶ **展开面板**：方向按钮（↑↓←→，长按连发）+ 配置 + 帮助
- ⚙ **每站点配置**：拖拽/滚轮修饰键按站点独立保存（IndexedDB），可组合 alt/ctrl/shift
- 🚫 **不误触**：尺寸过小的视频（如信息流 hover 预览）不激活

## 🚀 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)
2. 打开 `dist/video-rotate-zoom-drag.user.js`（或 `src/video-rotate-zoom-drag.user.js` 开发版）复制全部内容
3. Tampermonkey 新建脚本并粘贴，保存
4. 打开任意视频页面即可

> 自行构建：`node build-simple.js` → 产出 `dist/video-rotate-zoom-drag.user.js`

## ⌨️ 快捷键

默认全部以 **Shift** 为修饰键：

| 快捷键 | 功能 |
|--------|------|
| `Shift + +` | 放大 |
| `Shift + -` | 缩小 |
| `Shift + L` | 向左旋转 90° |
| `Shift + R` | 向右旋转 90° |
| `Shift + 0` | 还原 |
| `Shift + ↑ / ↓ / ← / →` | 上/下/左/右移动 |
| `Shift + Space` | 全屏切换 |

> 使用 `e.code` 匹配，不受 Shift 改变字符的影响。

## 🖱️ 鼠标操作

| 操作 | 功能 |
|------|------|
| `修饰键 + 拖拽视频` | 移动视频位置 |
| `修饰键 + 滚轮` | 缩放视频（滚轮向上放大、向下缩小） |

修饰键默认为 **Shift**，可按站点在配置面板中改为 alt / ctrl / shift 的任意组合。

## 🧰 工具条

```
主栏：[−][100%][+] │ [↺][↻] │ [还原] [»展开]
                                         ↓ 展开
次级：[↑][↓][←][→] │ [⚙配置] [?帮助] [«缩回]
       (长按连发)     (修饰键) (快捷键)
```

- 鼠标移入视频区域显示，移出约 3 秒后隐藏；暂停时常驻
- 所有按钮 hover 显示提示（动作 + 快捷键）

## ⚙ 配置面板（每站点独立）

点击工具条的 **⚙** 打开，分别配置「鼠标拖拽」与「滚轮缩放」的前置修饰键：

- **启用/禁用** 切换：禁用时该功能完全关闭
- **alt / ctrl / shift** 多选：启用时可选任意组合（如选 alt+ctrl，则需同时按下两者）
- **至少保留 1 个**：取消最后一个会被阻止并提示（避免无修饰键时与点击暂停冲突）
- 配置按 `location.hostname` 存入 IndexedDB，每个站点独立保存

查看存储：F12 → Application → IndexedDB → `vrz-config`（含 `siteConfig` 与 `meta` 两个 store）。

## 📁 项目结构

```
src/
├── video-rotate-zoom-drag.user.js   # 主入口（IIFE，启动 App）
└── modules/
    ├── app.js                      # 协调器：视频发现/SPA/位置同步/显隐/清理
    ├── config.js                   # 全局默认配置（参数/修饰键/e.code 快捷键/激活阈值）
    ├── transform-engine.js         # 变换状态源：apply()/calculateScale()/zoom/rotate/move
    ├── ui-overlay.js               # 悬浮工具条 + 展开面板 + 方向连发 + hover 显隐
    ├── drag-handler.js             # 拖拽（document 级，读 site-config）
    ├── wheel-handler.js            # 滚轮缩放（document 级，读 site-config）
    ├── keyboard-shortcuts.js       # 键盘快捷键（e.code 匹配）
    ├── site-config.js              # 运行时站点配置 + IndexedDB 加载/合并 + checkModifiers
    ├── storage.js                  # IndexedDB 封装（siteConfig + meta）
    ├── config-panel.js             # 修饰键配置模态（min-1 校验）
    ├── help-panel.js               # 快捷键只读浮层
    ├── styles.js                   # 玻璃浮层 CSS（静态字符串）
    └── logger.js                   # 日志单例

dist/
└── video-rotate-zoom-drag.user.js  # 构建产物
```

## 🛠 开发

### 环境

- Node.js 16+
- pnpm 10.18.1+（推荐）

### 构建

```bash
pnpm install
node build-simple.js          # 构建到 dist/
node --check dist/video-rotate-zoom-drag.user.js   # 语法校验
```

`build-simple.js` 自动发现 `src/modules/*.js`，按文件名字典序拼接（剥离 import/export），再拼主入口。

### 架构要点

- **零平台选择器**：`document.querySelector('video')` + `play` 事件 + MutationObserver（SPA）
- **变换作用于 `<video>`**：动态 `<style>` 标签 + `video[data-vrz-active]` 选择器，不污染 inline style
- **位置跟随**：浮层 `position:fixed`，`getBoundingClientRect()` 同步到视频父元素（stage）
- **尺寸门槛**：渲染尺寸 < 400×225 的视频不激活（过滤信息流预览）
- **全局事件**：Drag/Wheel/Keyboard 在 document 监听一次，经 `app.activeVideo` 取当前视频

调试：看控制台 `[时间] [VideoController:模块] [级别] ...`。

## 🌐 兼容性

- Chrome / Firefox / Edge / Safari + Tampermonkey
- 现代浏览器（ES module、IndexedDB、ResizeObserver）

## 📄 许可证

MIT License

## 🙏 致谢 / Credits

本项目站在以下作者与项目的肩膀上：

- **浮云里的浮云** — 原始版本（缩放/旋转/拖拽功能）
  - 主页：https://space.bilibili.com/1531643081
  - 源码（B站专栏）：https://www.bilibili.com/opus/1078276575030411266

- **ryu-dayo** — 悬浮工具条架构灵感（chimo-chimo-loop）
  - 源码：https://github.com/ryu-dayo/chimo-chimo-loop

- **CC11001100** — UserScript 工程模板（JSREI/userscript-template）
  - GitHub：https://github.com/CC11001100
  - 源码：https://github.com/JSREI/userscript-template
