# 多平台视频增强：缩放 / 旋转 / 拖拽

为任意网页的视频播放器添加 **缩放、双向旋转、拖拽平移、滚轮缩放**，并配有一个跟随视频的玻璃风悬浮工具条。

**零平台适配**：不依赖任何站点 CSS 选择器，自动发现页面中的 `<video>`，在所有站点生效（`@match *://*/*`）。

## ✨ 功能特性

- 🎯 **零平台适配**：自动发现 `<video>`，B站 / YouTube / 任意站点通用
- 🚀 **两阶段懒启动**：无视频页面仅极轻量探测，发现视频才创建工具条与绑定交互
- 🛡 **黑白名单**：支持站点黑名单/白名单（互斥），通过 Tampermonkey 菜单「管理黑白名单」懒加载管理面板，实时扫描 iframe 域名快捷加入
- 🔍 **缩放**：50% – 300%，步长 5%（按钮 / 键盘 / 滚轮）
- 🔄 **双向旋转**：90° 增量，左旋 / 右旋；90°/270° 自动按 contain 反推缩放，无黑边
- 🖱️ **拖拽平移**：按修饰键拖拽视频；可按站点配置修饰键组合
- 🖲️ **滚轮缩放**：按修饰键 + 滚轮缩放
- 🧭 **悬浮工具条**：定位在视频区域**左上角**的玻璃浮层，鼠标移动超过阈值（默认 8px）显示、停止移动 2s（可配）隐藏；缩放/倍速/移动/AB 微调弹出层打开时不隐藏
- ▶ **展开面板**：方向移动（四向箭头图标，点击弹出）+ A-B 循环 + 配置 + 帮助
- ⏱ **A-B 循环**：仅设置终点 B 即可循环（A 默认 0）；A/B 悬停微调（±5s / ±1s / ±0.1s）（快捷键 `[` / `]` / `\`）
- 🖥 **全屏支持**：全屏时工具条跟随显示；全局唤醒键 Alt+反引号（默认开启，不依赖快捷键总开关）在「固定显示 / 隐藏」间切换，固定显示时高对比度
- 📐 **工具条偏移**：垂直 / 水平偏移可配置（配置面板 ±2px，全局持久化）
- ⚡ **倍速播放**：0.5× / 0.75× / 1× / 1.25× / 1.5× / 2× 下拉选择
- ⌨ **键盘快捷键**：默认禁用，可在配置面板中启用全部或按分组独立开关
- ⚙ **每站点配置**：拖拽/滚轮修饰键按站点独立保存，可组合 alt/ctrl/shift
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

> **默认禁用**：键盘快捷键开箱即用为关闭状态。需要在配置面板（⚙ → 键盘快捷键）中启用总开关，可选择全部启用或按分组独立开关（缩放/旋转/全屏/还原/移动/A-B循环/面板）。

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
| `Alt + 反引号` | 切换工具条固定显示 / 隐藏（默认开启，全屏可用） |

## 🖱️ 鼠标操作

| 操作 | 功能 |
|------|------|
| `修饰键 + 拖拽视频` | 移动视频位置 |
| `修饰键 + 滚轮` | 缩放视频（滚轮向上放大、向下缩小） |

修饰键默认为 **Shift**，可按站点在配置面板中改为 alt / ctrl / shift 的任意组合。

## 🧰 工具条

工具条定位在视频区域**左上角**：

```
次级：[✛] │ [A][B][L] │ [⚙][?][«]
      方向移动   A-B 循环    配置/帮助/缩回
      (点击弹出十字方向菜单，长按连发)

主栏：[−][100%▾][+][1×▾] │ [↺][↻] │ [还原][»]
      缩放档位/倍速下拉      左右旋转     还原/展开
```

- 鼠标移动超过阈值（默认 8px，`ui.pointerWakeThreshold`）显示；停止移动 2s（`ui.hideDelay`）后隐藏；缩放/倍速/移动/AB 微调弹出层打开时不隐藏；暂停时常驻
- 垂直 / 水平偏移可在配置面板 ±2px 微调；Alt+反引号 固定显示时背景高对比（`ui.wakeBgAlpha`）
- 缩放档位、倍速、方向移动的下拉/弹出菜单**向下展开**
- 所有按钮 hover 显示提示（动作 + 快捷键）

## ⚙ 配置面板

点击工具条的 **⚙** 打开：

**修饰键**（按站点独立，存 GM_setValue）——配置「鼠标拖拽」与「滚轮缩放」的前置修饰键：

- **启用/禁用** 切换：禁用时该功能完全关闭
- **alt / ctrl / shift** 多选：启用时可选任意组合（如选 alt+ctrl，则需同时按下两者）
- **至少保留 1 个**：取消最后一个会被阻止并提示（避免无修饰键时与点击暂停冲突）
- 配置按 `location.hostname` 存入 GM_setValue（key 格式 `vrz:site:{host}`），每个站点独立保存

**键盘快捷键**（全局）：

- **总开关**：启用/禁用全部键盘快捷键（默认禁用）
- **分组独立开关**：启用后可按分组单独控制——缩放 / 旋转 / 全屏 / 还原 / 移动 / A-B循环 / 面板
- 经 `GM_setValue` 全局保存（`vrz:shortcuts.enabled` / `vrz:shortcuts.groups`）

**显示选项**（全局，跨站点一致）：

- **暂停时常驻**：开启后视频暂停时工具条常驻显示；关闭则暂停后自动隐藏（默认）。经 `GM_setValue` 全局保存
- **全局唤醒键**：Alt+反引号 固定显示 / 隐藏工具条（默认开启，不依赖快捷键总开关）
- **工具条垂直 / 水平偏移**：±2px 微调（默认 4px，全局持久化）

配置经 GM_setValue 保存（Tampermonkey 脚本存储）。F12 → Tampermonkey 仪表盘 → 脚本设置可查看。

## 🛡 黑白名单管理

通过 **Tampermonkey 菜单**（浏览器扩展图标 → 「VRZ: 管理黑白名单」）打开管理面板，即使站点被拦截也能操作。

**面板功能**：

- **本页发现的域名**：实时扫描页面 iframe 的 hostname，每个域名旁有 `黑`/`白` 圆形标签按钮，一键切换（互斥：加入一个列表自动从另一个移除）
- **黑名单 / 白名单**：各含启禁用开关 + 当前站点快捷加入/移出 + 站点列表（×移除）+ hostname 输入添加（Enter 提交）
- **刷新按钮**：默认禁用；列表变更后启用「列表已修改，刷新生效」，点击刷新页面使变更生效

**规则**：

- 黑名单命中 → 脚本不启动；白名单启用且未命中 → 脚本不启动
- 黑白名单**互斥**：同一站点不能同时存在于两个列表
- 配置经 `GM_setValue` 全局保存（key `vrz:block`），仅主框架注册菜单（iframe 不重复）

## 📁 项目结构

```
src/
├── video-rotate-zoom-drag.user.js   # 主入口（IIFE：黑白名单拦截 + GM 菜单 + 启动 App）
└── modules/
    ├── ab-loop.js                  # A-B 循环（仅设 B 即可循环，A/B 悬停微调）
    ├── app.js                      # 协调器：两阶段懒启动 + 视频发现/SPA/位置同步/显隐（idle 隐藏/弹出层感知/唤醒固定/全屏）/清理
    ├── block-menu.js               # 黑白名单 GM 菜单 + 懒加载管理面板（iframe 域名扫描、互斥）
    ├── config.js                   # 全局配置 + Proxy(config) 统一读写（vrz: 前缀持久化、旧键迁移）
    ├── constants.js                # 技术映射表：修饰键→键名、win/mac 显示（CONSTANTS.VALID_MODS*）
    ├── transform-engine.js         # 变换状态源：apply()/calculateScale()/zoom/rotate/move
    ├── ui-overlay.js               # 悬浮工具条（左上角定位，方向移动菜单，缩放/倍速下拉，AB 微调，全屏跟随，唤醒高对比）
    ├── drag-handler.js             # 拖拽（document 级，util.checkModifiers）
    ├── wheel-handler.js            # 滚轮缩放（document 级，util.checkModifiers）
    ├── keyboard-shortcuts.js       # 键盘快捷键（e.code 匹配，默认禁用，分组开关，Alt+反引号 唤醒 toggle）
    ├── site-config.js              # 运行时站点配置（config.site，key vrz:site:{host}）
    ├── config-panel.js             # 配置面板：修饰键（按站点）+ 快捷键开关 + 显示选项（唤醒键/偏移，全局）
    ├── help-panel.js               # 快捷键只读浮层（util.setHTML 注入）
    ├── styles.js                   # 玻璃浮层 CSS（含 AB 微调器、唤醒高对比；<style> 注入）
    ├── logger.js                   # 日志单例（[vrz]@[host] 格式，createChild/use）
    └── util.js                     # 工具函数：checkModifiers/formatTime/formatText/setHTML/getPref/setPref（+TT 策略）

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
- **黑白名单**：`config.js` 的 `block` 对象（`useBlacklist`/`useWhitelist`/`blacklist`/`whitelist`），经 `GM_setValue` 持久化；主入口入口级拦截；`BlockMenu` 提供 GM 菜单 + 懒加载管理面板；黑白名单互斥
- **零平台选择器**：`document.querySelector('video')` + `play` 事件 + MutationObserver（SPA）
- **变换作用于 `<video>`**：动态 `<style>` 标签 + `video[data-vrz-active]` 选择器，不污染 inline style
- **位置跟随**：浮层 `position:fixed`，`reposition(stageRect)` 跟随视频父元素位置；SPA MutationObserver 在 DOM 变化引发布局位移时同步修正（解决 B 站导航栏延迟出现导致的位置偏移）
- **Trusted Types 兼容**：`setHTML()` + `vrz-html` 策略（YouTube 等 TT 站点）
- **尺寸门槛**：渲染尺寸 < 400×225 的视频不激活（过滤信息流预览）
- **全局事件**：Drag/Wheel/Keyboard 在 document 监听一次（阶段二绑定），经 `app.activeVideo` 取当前视频
- **统一配置存取**：`config.js` 导出 `Proxy(config)` 统一读写，持久化键 `vrz:<路径>`（旧键自动迁移）；模块内不直接 `getPref/setPref`
- **全屏 + 唤醒**：`fullscreenchange` 时工具条容器移入/移出全屏元素；Alt+反引号 toggle 固定显示（高对比）
- **显隐控制**：鼠标停止移动 `ui.hideDelay` 后隐藏（持续移动不隐藏）；弹出菜单操作中不隐藏

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
