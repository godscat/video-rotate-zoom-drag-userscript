# 多平台视频增强：缩放 / 旋转 / 拖拽

为任意网页的视频播放器添加 **缩放、双向旋转、拖拽平移、滚轮缩放**，并配有一个跟随视频的玻璃风悬浮工具条。

**零平台适配**：不依赖任何站点 CSS 选择器，自动发现页面中的 `<video>`，在所有站点生效（`@match *://*/*`）。

## ✨ 功能特性

- 🎯 **零平台适配**：自动发现 `<video>`，B站 / YouTube / 任意站点通用
- 🚀 **两阶段懒启动**：无视频页面仅极轻量探测，发现视频才创建工具条与绑定交互；指定站点可加入黑名单完全不启动
- 🔍 **缩放**：50% – 300%，步长 5%（按钮 / 键盘 / 滚轮）
- 🔄 **双向旋转**：90° 增量，左旋 / 右旋；90°/270° 自动按 contain 反推缩放，无黑边
- 🖱️ **拖拽平移**：按修饰键拖拽视频；可按站点配置修饰键组合
- 🖲️ **滚轮缩放**：按修饰键 + 滚轮缩放
- 🧭 **悬浮工具条**：跟随视频位置的玻璃浮层；**自动避让原生控制栏**（相对视频底边定位），鼠标移入显示、移出自动隐藏
- ▶ **展开面板**：方向按钮（↑↓←→，长按连发）+ A-B 循环 + 配置 + 帮助
- ⏱ **A-B 循环**：设置起点/终点，区间内自动回跳（快捷键 `[` / `]` / `\`）
- ⚡ **倍速播放**：0.5× / 0.75× / 1× / 1.25× / 1.5× / 2× 下拉选择
- ⚙ **每站点配置**：拖拽/滚轮修饰键按站点独立保存（IndexedDB），可组合 alt/ctrl/shift
- 🛡 **Trusted Types 兼容**：YouTube 等启用 TT 的站点正常工作
- 🚫 **不误触**：尺寸过小的视频（如信息流 hover 预览）不激活

## 🚀 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)
2. 打开 `dist/video-rotate-zoom-drag.user.js`（或 `src/video-rotate-zoom-drag.user.js` 开发版）复制全部内容
3. Tampermonkey 新建脚本并粘贴，保存
4. 或，如果你使用 VS Code 开发，可以安装 scriptcat 插件
5. 或，你用的是别的工具，也可以安装 [scriptcat-sync](https://github.com/zerobiubiu/scriptcat-sync) 帮助你开发
6. 打开任意视频页面即可

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

**A-B 循环与面板**（裸键，输入框内不触发，无激活视频时不拦截）：

| 快捷键 | 功能 |
|--------|------|
| `[` / `]` | 设置起点 A / 终点 B |
| `\` | 开关 A-B 循环 |
| `Shift+[` / `Shift+]` | 清空起点 A / 终点 B |
| `H` | 帮助面板（开/关） |
| `,` | 配置面板（开/关） |
| `.` | 展开 / 收起次级面板 |

## 🖱️ 鼠标操作

| 操作 | 功能 |
|------|------|
| `修饰键 + 拖拽视频` | 移动视频位置 |
| `修饰键 + 滚轮` | 缩放视频（滚轮向上放大、向下缩小） |

修饰键默认为 **Shift**，可按站点在配置面板中改为 alt / ctrl / shift 的任意组合。

## 🧰 工具条

```
次级：[↑][↓][←][→] │ [A][B][L] │ [⚙][?][«]
      方向(长按连发)   A-B 循环    配置/帮助/缩回
主栏：[−][100%▾][+][1×▾] │ [↺][↻] │ [还原][»]
      缩放档位/倍速下拉      左右旋转     还原/展开
```

- 鼠标移入视频区域显示，移出约 3 秒后隐藏；暂停时常驻
- **垂直定位**：相对视频底边定位，自动避开站点原生控制栏；视频容器塌陷时回退到视频本身的位置
- 所有按钮 hover 显示提示（动作 + 快捷键）

## ⚙ 配置面板

点击工具条的 **⚙** 打开：

**修饰键**（按站点独立，存 IndexedDB）——配置「鼠标拖拽」与「滚轮缩放」的前置修饰键：

- **启用/禁用** 切换：禁用时该功能完全关闭
- **alt / ctrl / shift** 多选：启用时可选任意组合（如选 alt+ctrl，则需同时按下两者）
- **至少保留 1 个**：取消最后一个会被阻止并提示（避免无修饰键时与点击暂停冲突）
- 配置按 `location.hostname` 存入 IndexedDB，每个站点独立保存

**显示选项**（全局，跨站点一致）：

- **暂停时常驻**：开启后视频暂停时工具条常驻显示；关闭则暂停后自动隐藏（默认）。经 `GM_setValue` 全局保存

配置经 GM_setValue 保存（Tampermonkey 脚本存储）。F12 → Tampermonkey 仪表盘 → 脚本设置可查看。

## 📁 项目结构

```
src/
├── video-rotate-zoom-drag.user.js   # 主入口（IIFE：日志初始化 + 黑名单 + 启动 App）
└── modules/
    ├── ab-loop.js                  # A-B 循环（起点/终点/自动回跳）
    ├── app.js                      # 协调器：两阶段懒启动 + 视频发现/SPA/位置同步/显隐/清理
    ├── config.js                   # 全局配置：参数/修饰键/快捷键/阈值/黑名单/日志/ui.bottomBase/playbackSpeeds/db.*
    ├── constants.js                # 技术映射表：修饰键→键名、win/mac 显示（CONSTANTS.VALID_MODS*）
    ├── transform-engine.js         # 变换状态源：apply()/calculateScale()/zoom/rotate/move
    ├── ui-overlay.js               # 悬浮工具条（相对 video 底边定位，formatTime/formatText）
    ├── drag-handler.js             # 拖拽（document 级，util.checkModifiers）
    ├── wheel-handler.js            # 滚轮缩放（document 级，util.checkModifiers）
    ├── keyboard-shortcuts.js       # 键盘快捷键（e.code 匹配，无视频不拦截）
    ├── site-config.js              # 运行时站点配置（GM_setValue，key vrz-site:{host}）
    ├── config-panel.js             # 配置面板：修饰键（按站点）+ 显示选项（全局）
    ├── help-panel.js               # 快捷键只读浮层（util.setHTML 注入）
    ├── styles.js                   # 玻璃浮层 CSS（静态字符串，<style> 注入）
    ├── logger.js                   # 日志单例（[vrz]@[host] 格式，createChild/use）
    └── util.js                     # 工具函数：checkModifiers/formatTime/formatText/setHTML（+TT 策略）

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

`build-simple.js` 自动发现 `src/modules/*.js`，按文件名字典序拼接（剥离 import/export），再拼主入口；并在 `@description` 末尾注入构建时间戳。

### 架构要点

- **两阶段懒启动**：加载后仅 `play` + MutationObserver 探测；首次激活视频才创建 UI/交互处理器。无视频站点零监听开销
- **站点黑名单**：`config.js` 的 `blacklist`（hostname 精确匹配），主入口命中即不启动
- **零平台选择器**：`document.querySelector('video')` + `play` 事件 + MutationObserver（SPA）
- **变换作用于 `<video>`**：动态 `<style>` 标签 + `video[data-vrz-active]` 选择器，不污染 inline style
- **位置跟随**：浮层 `position:fixed`，`reposition(stageRect, videoRect)` 相对 **video 底边**定位避开原生控制栏；容器塌陷时回退 video rect
- **Trusted Types 兼容**：`setHTML()` + `vrz-html` 策略（YouTube 等 TT 站点）
- **尺寸门槛**：渲染尺寸 < 400×225 的视频不激活（过滤信息流预览）
- **全局事件**：Drag/Wheel/Keyboard 在 document 监听一次（阶段二绑定），经 `app.activeVideo` 取当前视频

调试：看控制台 `[vrz]@[host] [级别] ...`（如 `[vrz]@www.youtube.com [INFO] 已激活视频`）。

## 🌐 兼容性

- Chrome / Firefox / Edge / Safari + Tampermonkey
- 现代浏览器（ES module、IndexedDB、ResizeObserver）
- Trusted Types 站点（YouTube 等）

## 📄 许可证

本项目基于 **GPL-3.0-or-later** 发布。

部分代码（悬浮浮层架构、`calculateScale`、`shouldSwitchVideo`、动态 `<style>` 应用变换等）衍生自 ryu-dayo 的 [chimo-chimo-loop](https://github.com/ryu-dayo/chimo-chimo-loop)（GPL-3.0），原始思路来自浮云里的浮云。故整体采用 GPL，详见 [LICENSE](./LICENSE)。

## 🙏 致谢 / Credits

本项目站在以下作者与项目的肩膀上：

- **浮云里的浮云** — 原始版本（缩放/旋转/拖拽功能）
  - 主页：https://space.bilibili.com/1531643081
  - 源码（B站专栏）：https://www.bilibili.com/opus/1078276575030411266

- **ryu-dayo** — 悬浮工具条架构灵感（chimo-chimo-loop，GPL-3.0）
  - 本项目的悬浮架构与部分函数（calculateScale / shouldSwitchVideo 等）直接源自该项目
  - 源码：https://github.com/ryu-dayo/chimo-chimo-loop

- **CC11001100** — UserScript 工程模板（JSREI/userscript-template）
  - GitHub：https://github.com/CC11001100
  - 源码：https://github.com/JSREI/userscript-template
