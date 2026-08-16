# CLAUDE.md

本文件为 AI 助手（Claude Code / opencode 等）在本仓库工作时提供指引。`AGENTS.md` 是指向本文件的符号链接。

## 项目概览

多平台视频增强用户脚本：为视频播放器添加 **缩放 / 双向旋转 / 拖拽平移 / 滚轮缩放**，并提供一个跟随视频的玻璃风悬浮工具条。

**核心架构特点（参考 chimo-chimo-loop，重写于 v2）**：

- **零平台选择器**：不依赖任何站点 CSS 选择器，直接 `document.querySelector('video')` + `play` 事件发现视频，`@match *://*/*` 通配所有站点。
- **两阶段懒启动**：脚本加载后仅绑定 `play` + MutationObserver（阶段一，轻量探测）；首次发现达标视频才由 `_ensureHandlers()` 创建 UI / 交互处理器并绑定显隐监听（阶段二）。无视频站点零监听开销。
- **黑白名单**：`config.js` 的 `block` 对象（`useBlacklist`/`useWhitelist`/`blacklist`/`whitelist`），经 `GM_setValue` 持久化（key `block`）；主入口入口级拦截，命中黑名单或未命中白名单即**完全不构造 App**；黑白名单**互斥**（加入一个自动从另一个移除）；`BlockMenu` 类提供 GM 菜单 + 懒加载管理面板（点击才注入 DOM）；仅主框架注册菜单。
- **悬浮浮层 UI**：控制条为 `position:fixed` 容器挂到 `body`，定位在视频区域**左上角**（CSS `top/left`），通过 `getBoundingClientRect()` 实时跟随视频父元素（stage）位置——而非塞进平台自己的控制栏。
- **位置同步**：`reposition(stageRect)` 跟随 stage 位置；SPA MutationObserver 在 DOM 变化引发布局位移时同步修正（解决 B 站导航栏延迟出现导致 container 偏移）；rAF 轮询 1500ms 覆盖初始布局稳定。
- **变换作用于 `<video>` 本身**：通过动态 `<style>` 标签 + `video[data-vrz-active]` 属性选择器注入 `transform`，不污染 inline style。
- **Trusted Types 兼容**：`util.setHTML()` + 单例 `vrz-html` 策略，兼容 YouTube 等启用 TT 的站点；无 TT 环境降级为直接赋值。
- **90° 旋转无黑边**：`calculateScale()` 按 `object-fit:contain` 反推缩放比例。
- **统一配置存取**：`config.js` 导出 `Proxy(config)` 统一读写接口，持久化键对齐 `vrz:<配置路径>`（如 `vrz:shortcuts.enabled`、`vrz:block`、`vrz:site:{host}`），旧键一次性自动迁移；模块内不直接 `getPref/setPref`。
- **每站点配置**：拖拽/滚轮的修饰键组合按 `location.hostname` 经 `config.site[host]` 读写（key `vrz:site:{host}`）；`siteConfig.load()` 推迟到阶段二，无视频站点不读写。
- **键盘快捷键默认禁用**：`shortcuts.enabled=false`，分组开关 `shortcuts.groups`（默认全开）；经 `vrz:shortcuts.enabled`/`vrz:shortcuts.groups` 持久化。
- **全局唤醒键**：Alt + 反引号键（`ui.wakeKeyEnabled` 默认开启，不依赖快捷键总开关）toggle 工具条「固定显示 / 隐藏」，固定时高对比（`ui.wakeBgAlpha`）；全屏时容器随 `fullscreenchange` 移入/移出全屏元素。
- **显隐控制**：鼠标停止移动满 `ui.hideDelay` 才隐藏；唤醒灵敏度 `ui.pointerWakeThreshold`；缩放/倍速/移动/AB 微调弹出层打开时不隐藏。
- **尺寸门槛**：渲染尺寸 < 400×225 的视频（如信息流 hover 预览）不激活，避免误触。

## 构建系统

### 命令

```bash
pnpm run build    # 生产构建
pnpm run watch    # 监听模式
pnpm run dev      # 开发提示
node build-simple.js   # 直接构建干净版本（等价 build）
```

### 包管理器

- **pnpm**（package.json 已声明，版本 10.18.1+）

### 构建产物

- **入口**：`src/video-rotate-zoom-drag.user.js`（IIFE，`import { App }`）
- **构建工具**：自定义 `build-simple.js`——自动发现 `src/modules/*.js`，**按文件名字典序拼接**，剥离 `import/export`，再拼上主入口；并在 `@description` 末尾注入构建时间戳。
- **开发态**：可直接在 Tampermonkey 加载 `src/video-rotate-zoom-drag.user.js`（需 ES module 支持）。
- **生产态**：输出可读、未压缩的 `dist/video-rotate-zoom-drag.user.js`。

> ⚠️ 拼接顺序由文件名字典序决定。跨模块引用必须满足：(1) 函数声明会被提升，可跨文件用；(2) `const/class` 存在 TDZ，**禁止在模块顶层引用其它模块的 const/class**，只能在构造函数/方法内（运行期）引用——因为 `new App()` 在主入口（最后）才执行。

### 关于构建的常见误解

- **这不是传统 webpack / Node 项目**：仓库里虽有 webpack 配置与 `package.json`，但默认构建走自定义的 `build-simple.js`。它存在的目的正是为了**规避 webpack 产物里 `__webpack_require__` / `__webpack_modules__` 等运行时模板代码**，产出干净、可读、未压缩的单文件用户脚本。**不要**把 `dist/` 当作 webpack bundle 来分析，也**不要**用 webpack 思路理解模块加载——这里没有 chunk、没有运行时清单，只有「按文件名字典序拼接 + 剥离 `import/export`」的纯文本拼接。
- **AI 助手的测试约定**：代码改动后，AI 只需运行 `node --check dist/video-rotate-zoom-drag.user.js` 验证**语法**通过即可；**功能正确性（浏览器行为、站点兼容、控制台日志格式、IndexedDB 行为等）一律由用户在浏览器实测确认**。AI 不应也不必尝试用 Node 运行脚本片段来推断浏览器里的运行结果——脚本依赖 `document` / `window` / `location` 等浏览器宿主，Node 环境无法还原。

## 架构

### 启动流程（两阶段）

```
主入口 main()
  ├─ getLogger({ enabled: config.log.enabled })  ← 首次初始化全局日志器（单例）
  ├─ 黑名单检查（命中即 return，不构造 App）
  ├─ new App()
  │    └─ 构造期：仅创建 SiteConfig / TransformEngine / ABLoop（均无全局副作用）
  └─ app.start()                                  ← 阶段一：play + MutationObserver + scan()
       └─ 首次 activate(video)
            └─ _ensureHandlers()                  ← 阶段二：Styles/UI/Drag/Wheel/Keyboard + pause/scroll/resize/pointermove/fullscreenchange + siteConfig.load()
```

> 删除过 `export const defaultLogger = getLogger();`——它会在模块顶层提前用默认值初始化单例，导致主入口的 `getLogger({enabled})` 被忽略。

### 模块清单（src/modules/，共 15 个，按文件名字典序）

模块职责分三层：**config.js**（业务参数）/ **constants.js**（类型化技术映射）/ **util.js**（工具函数）是基础设施；其余为功能模块。

#### `ab-loop.js`
A-B 循环：仅设置终点 B 即可开始循环（起点 A 默认为 0）；`timeupdate` 监听回跳；A/B 悬停弹出微调器（`nudgeStart/nudgeEnd`，±5s/±1s/±0.1s）；`clearA/B()` Shift+点击清空；状态纯内存、视频切换自动清零。时间显示用 `util.formatTime`。

#### `app.js`
**协调器**：两阶段启动——构造期仅创建无副作用模块（SiteConfig/TransformEngine/ABLoop）；`start()` 仅绑定 play+MutationObserver（阶段一）；首次 `activate()` 由 `_ensureHandlers()` 创建 UI/交互处理器（阶段二，幂等）；视频发现/SPA/位置同步（stage 塌陷回退 videoRect）/显隐/清理。显隐：鼠标停止移动满 `ui.hideDelay` 隐藏（`showAndTimer` 按 `_lastPointerMove` 重新计时）、弹出菜单打开时不隐藏（`ui.hasOpenPopup()`）、唤醒键固定显示（`_wakePinned`）；监听 fullscreenchange 同步全屏。

#### `block-menu.js`
黑白名单 GM 菜单 + 懒加载管理面板。`BlockMenu` 类：GM 菜单仅注册一项「管理黑白名单」，点击后才 `_build()` 注入样式（`Styles.inject()`）+ 创建 DOM + 绑定事件。面板含：本页发现的域名（`_scanHosts()` 实时扫描 iframe src，MutationObserver 异步刷新）、黑白名单启禁用开关 + 站点列表 + 添加输入框。黑白名单互斥（`_addToBlacklist`/`_addToWhitelist` 加入一个自动从另一个移除）。`_save()` 经 `config.block = this.block`（Proxy）持久化 + 标记 `_dirty` 启用刷新按钮。

#### `config.js`
全局默认配置（业务参数）：缩放/旋转/移动/AB循环参数、激活尺寸阈值、黑白名单（`block.useBlacklist`/`useWhitelist`/`blacklist`/`whitelist`）、拖拽/滚轮默认修饰键、`e.code` 快捷键（`shortcuts.enabled` 默认 false + `shortcuts.groups` 分组开关）、快捷键分组（`shortcutGroups`）、日志开关、UI 偏移（`ui.verticalOffset`/`horizontalOffset`）、唤醒键（`ui.wakeKeyEnabled`/`wakeBgAlpha`/`pointerWakeThreshold`）、倍速档位（`playbackSpeeds`）。
默认导出 `config`（Proxy 统一读写：持久化路径自动经 GM 存储，key = `vrz:<路径>`；站点配置虚拟路径 `config.site[host]`），另导出 `CONFIG`（仅供初始化 / Proxy handler 内部使用）。

#### `config-panel.js`
配置模态：修饰键区（拖拽/缩放，按站点存 GM_setValue）+ 键盘快捷键区（总开关+分组独立开关，全局）+ 显示选项区（暂停时常驻 / 全局唤醒键 / 工具条垂直水平偏移，全局）；min-1 校验；DOM 经 `util.setHTML()` 注入；全部经 `config` Proxy 读写；`onPersistOnChange`/`onUiChange` 回调即时应用。

#### `constants.js`
**技术映射表**（带 `@typedef`）：`CONSTANTS.VALID_MODS` / `VALID_MODS_KEYNAMES`（修饰键→KeyboardEvent 键名）/ `VALID_MODS_KEYDISPLAY`（Windows/Mac 显示名）。仅放类型化的基础设施常量，业务数值参数归 `config.js`。

#### `drag-handler.js`
document 级 **pointerdown**/pointermove/pointerup（比 mousedown 更早拦截）；读 `site-config` 修饰键（经 `util.checkModifiers`）；在 stage 内拖拽，排除按钮等控件；拖拽时关过渡保证跟手；拖拽结束后 `click` 守卫防止平台误触暂停。

#### `help-panel.js`
快捷键只读浮层（含 A-B 与面板快捷键）；DOM 经 `util.setHTML()` 注入。

#### `keyboard-shortcuts.js`
`e.code` 匹配（规避 Shift 改字符问题）；**默认禁用**（`_isGloballyEnabled()` 读 `config.shortcuts.enabled`）；**无激活视频时不拦截**；按分组检查 `_isGroupEnabled()`（读 `config.shortcuts.groups`）；缩放/旋转/移动/还原/全屏；A-B 设置清空开关；H/逗号/句号面板操作；**全局唤醒键 Alt + 反引号键**（`ui.wakeKeyEnabled` 默认开启，不依赖总开关）→ `app.toggleWakePinned()` toggle 固定显示/隐藏。

#### `logger.js`
日志单例（`getLogger(options)`）。格式 `[vrz]@[host] [级别]`（`timePrefix` 控制是否加 `[HH:MM:SS]`）；`createChild(module, timePrefix?)` 派生子 logger 并继承配置；`use()` 返回自身；`module` 字段保留但当前不输出。

#### `site-config.js`
运行时站点配置：默认值 + 经 `config.site[host]` 加载合并（key `vrz:site:{host}`；`load()` 由 App 在阶段二调用）+ `subscribe()`；`normModifiers()` 经 `CONSTANTS.VALID_MODS` 过滤；`getDragConfig()`/`getZoomConfig()`；min-1 强制。`checkModifiers` 已移至 `util.js`。

#### `styles.js`
玻璃浮层 CSS（静态字符串），通过 `<style>` 注入。含主/次面板、模态、缩放/倍速/方向移动弹出菜单、AB 悬停微调器、唤醒高对比（`.vrz-container.vrz-wake`）、帮助浮层样式。

#### `transform-engine.js`
**唯一状态源**：持有 zoom/rotation/offset；`apply()` 用动态 `<style>` 应用变换；`calculateScale()` 处理 90°；ResizeObserver 监听尺寸重算；提供 zoomIn/zoomOut/rotateLeft/rotateRight/move/reset。

#### `ui-overlay.js`
悬浮控制条：主栏（缩放/倍速下拉/旋转/还原/展开）+ 次级面板（方向移动图标按钮弹出十字菜单 / A-B 按钮（悬停微调）/ 配置 / 帮助 / 缩回）；`reposition(stageRect)` 跟随 stage **左上角**定位（偏移 `ui.verticalOffset`/`horizontalOffset`）；`syncFullscreen()` 全屏移入/移出容器；`setWake()` 唤醒高对比；`hasOpenPopup()` 弹出层感知；`ratechange` 同步倍速显示；倍速档位读 `config.playbackSpeeds`；时间显示用 `util.formatTime`，缩放% 用 `util.formatText`。

#### `util.js`
**工具函数集**（函数声明，跨模块提升可用）：`checkModifiers`（修饰键匹配，读 `CONSTANTS.VALID_MODS_KEYNAMES`）、`formatTime`（固定 0.1s 精度，始终带一位小数）、`formatText`（`{value}` 占位替换）、`fillPrefixWith`、`setHTML`（安全 innerHTML，兼容 Trusted Types，单例 `vrz-html` 策略）、`getPref/setPref`（全局偏好，封装 GM_getValue/GM_setValue；**主要供 config Proxy 内部使用**）。

#### `wheel-handler.js`
document 级 wheel（capture）；读 `site-config` 修饰键（经 `util.checkModifiers`）；仅视频区域内触发。

> `video-scanner` 合并于 `app.js`，视频发现由 `App.scan()` 承担。

### 模块依赖

```
主入口（黑名单 + logger 初始化）
  └─ App（协调器）
       ├─ SiteConfig（站点配置，GM_setValue 持久化）
       ├─ TransformEngine（核心状态）
       ├─ ABLoop（A-B 循环，纯内存）
       └─ [阶段二 _ensureHandlers]
            ├─ Styles（样式注入）
            ├─ UIOverlay（悬浮 UI，回调 onConfig/onHelp）
            │    └── ConfigPanel / HelpPanel
            ├─ DragHandler    → 读 SiteConfig + 写 TransformEngine
            ├─ WheelHandler   → 读 SiteConfig + 写 TransformEngine
            └─ KeyboardShortcuts → 写 TransformEngine / 调 ABLoop / 开关面板

基础设施（被多模块依赖）：
  config.js（CONFIG 默认值 + Proxy(config) 统一存取）· constants.js（CONSTANTS 修饰键映射）· util.js（checkModifiers/formatTime/formatText/setHTML/getPref/setPref）
```

### 关键设计模式

- **单一职责**：每个模块只管一件事。
- **三层基础设施**：`config.js`（业务参数）/ `constants.js`（类型化映射）/ `util.js`（工具函数）分离，边界清晰不重合。
- **两阶段懒初始化**：交互处理器推迟到首次激活视频才创建，无视频站点仅 2 个轻量监听（play + MutationObserver）。
- **TransformEngine 是唯一真相源**：所有状态变更经它，`onChange` 回调通知 UI 刷新。
- **事件驱动 + 全局监听**：Drag/Wheel/Keyboard 在 document 上监听一次（阶段二绑定），通过 `app.activeVideo` 取当前视频，无需随视频切换重绑。
- **生命周期**：各模块提供 `destroy()`；App 提供 `stop()` 统一清理（对懒加载对象用 `?.` 保护）。
- **SPA 感知**：MutationObserver 监听 body，防抖后 `scan()` + `updateRectAndPosition()`（DOM 变化引发布局位移时同步修正浮层位置）；`play` 事件即时激活。
- **平台无关**：完全不用平台选择器；差异化需求（如拖拽修饰键）通过每站点配置实现。
- **统一配置代理**：所有模块经 `config`（Proxy）读写配置，持久化路径自动落 GM 存储（key `vrz:<路径>`）；初始化与 Proxy handler 内部除外，不直接操作 `CONFIG`/`getPref`/`setPref`。
- **显隐状态机**：指针移动记录 `_lastPointerMove`/`_lastWakeX/Y`；隐藏计时按「鼠标停止移动 `hideDelay`」+「弹出层打开不隐藏」+「唤醒固定常驻」三层控制。

## 用户脚本配置

### @match

`*://*/*` —— 通配所有站点。脚本自动发现 `<video>`，按站点独立保存配置。

### @grant

- `GM_addStyle`（保留，实际用 `<style>` 标签注入亦可）
- `GM_setValue` / `GM_getValue`（全局偏好存储，跨站点；如暂停时常驻开关、黑白名单）
- `GM_registerMenuCommand`（黑白名单管理菜单入口）

### @run-at

`document-start` —— 主入口在 `load` 后执行：先读取黑白名单配置、注册 GM 菜单、做拦截检查，再 `new App()` + `start()`，保证 `body` 就绪。

## 数据持久化（GM_setValue / GM_getValue）

所有配置统一经 Tampermonkey 的 `GM_setValue`/`GM_getValue` API 存储（跨 origin 的脚本全局空间）。

- **统一读写入口**：模块一律经 `config`（Proxy）读写；持久化路径自动经 GM_setValue/GM_getValue，key 对齐配置路径（`vrz:<路径>`）。旧键（`vrz-persist-on-pause`/`vrz-kb-enabled`/`vrz-kb-groups`/`block`/`vrz-site:{host}`）首次运行自动迁移到新键。
- **黑白名单配置**：key `vrz:block`，值为 `{ useBlacklist, useWhitelist, blacklist[], whitelist[] }`。主入口读取（深拷贝 + 清理交集），`BlockMenu._save()` 经 `config.block = ...` 写入。黑白名单互斥。
- **站点修饰键配置**：key 格式 `vrz:site:{host}`（如 `vrz:site:www.bilibili.com`），值为 `{ drag:{enabled,modifiers}, zoom:{enabled,modifiers} }`。`site-config.js` 经 `config.site[host]` 读写。
- **全局偏好**：key 如 `vrz:ui.persistOnPause`（布尔）、`vrz:shortcuts.enabled`（布尔）、`vrz:shortcuts.groups`（对象）、`vrz:ui.wakeKeyEnabled`/`vrz:ui.wakeBgAlpha`/`vrz:ui.verticalOffset`/`vrz:ui.horizontalOffset`/`vrz:ui.pointerWakeThreshold`。
- `siteConfig.load()` 仅在阶段二调用 → 无视频站点不读 GM 配置。
- 加载/保存失败时优雅降级到默认值。

## 配置与快捷键默认值

- **缩放**：50%–300%，步长 5%；档位 `zoom.levels=[100,125,150,175,200,225,250,275,300]`（主栏下拉选择）
- **旋转**：90° 双向
- **移动**：步长 20px
- **A-B 循环**：仅设终点 B 即可循环（起点 A 默认为 0）；A/B 悬停微调 ±5s/±1s/±0.1s（0.1s 精度）
- **激活尺寸门槛**：`minActivateWidth=400, minActivateHeight=225`
- **黑白名单**：`block.useBlacklist=true`（默认启用黑名单），`block.useWhitelist=false`；`block.blacklist=['s1.hdslb.com','message.bilibili.com','challenges.cloudflare.com']`；黑白名单互斥；经 GM_setValue 持久化（key `block`）
- **拖拽/滚轮默认修饰键**：`['shift']`（可组合 alt/ctrl/shift，min-1）
- **UI 工具条偏移**：`ui.verticalOffset=4` / `ui.horizontalOffset=4`（相对 video 左上角，配置面板 ±2px 微调）；`ui.bottomBase=14`（B 方案保留）
- **显隐**：`ui.hideDelay=2000`（鼠标停止移动后隐藏）；`ui.pointerWakeThreshold=8`（px，越小越灵敏）；缩放/倍速/移动/AB 微调弹出层打开时不隐藏
- **全局唤醒键**：Alt + 反引号键（`ui.wakeKeyEnabled=true` 默认开启，不依赖快捷键总开关）；固定显示时背景高对比 `ui.wakeBgAlpha=0.6`
- **暂停时常驻**：`ui.persistOnPause=false`（默认暂停后自动隐藏；配置面板可切换，经 GM 全局生效）
- **倍速档位**：`playbackSpeeds=[2, 1.5, 1.25, 1, 0.75, 0.5]`
- **日志**：`log.enabled`（开发阶段默认开启；正式发布前可改 `false`）
- **快捷键**（`e.code`）：**默认禁用**（`shortcuts.enabled=false`），配置面板可启用总开关 + 分组独立开关
  - `Shift + Equal/Minus` 缩放
  - `Shift + KeyL/KeyR` 旋转
  - `Shift + Digit0` 还原
  - `Shift + Space` 全屏
  - `Shift + Arrow*` 移动
  - `[` / `]` / `\` / `Shift+[` / `Shift+]` A-B 设置/开关/清空
  - `H` / `,` / `.` 帮助/配置/展开面板开关
  - Alt + Backquote 全局唤醒键（toggle 工具条固定显示/隐藏，默认开启，不依赖总开关）

## 开发流程

### 新增功能

1. 在 `src/modules/` 新建/修改模块，正确 `import`。
2. 如需协调，在 `app.js` 装配（注意两阶段：有副作用的放 `_ensureHandlers()`），并在 `stop()` 加入清理（用 `?.`）。
3. 用全局 logger：`getLogger().createChild('ModuleName')`。
4. 注意拼接顺序约束（见上文 ⚠️）。
5. `node build-simple.js` 构建，`node --check dist/video-rotate-zoom-drag.user.js` 校验语法。

### 文件组织

- **主入口**：`src/video-rotate-zoom-drag.user.js`
- **模块**：`src/modules/*.js`
- **构建产物**：`dist/video-rotate-zoom-drag.user.js`
- **用户脚本头模板**：`userscript-headers.js`（含致谢）
- **待办看板**：`TODOS.md`（本地，已 gitignore；格式 `# TODO/DOING/DONE <说明>`）

## 测试

1. **开发**：Tampermonkey 直接加载 `src/video-rotate-zoom-drag.user.js`。
2. **生产**：`node build-simple.js` 后用 `dist/` 版本。
3. **重点验证**：视频发现、旋转 90° 无黑边、拖拽/滚轮修饰键、配置面板持久化、信息流预览不被激活、黑名单站点不启动、工具条不遮挡原生进度条。
4. 看控制台日志：`[vrz]@[host] [级别] ...`（如 `[vrz]@www.youtube.com [INFO] 已激活视频`）。

## 浏览器兼容性

- 现代浏览器（ES module、IndexedDB、ResizeObserver、`requestVideoFrameCallback` 可选）
- **Trusted Types** 兼容（YouTube 等启用 TT 的站点，经 `util.setHTML()` + `vrz-html` 策略）
- Tampermonkey / Greasemonkey
- 标准 DOM API + CSS transform

## 测试、Git 提交、推送规则

- 测试规则：

  代码改动（尤其功能逻辑）完成后，必须先让用户在浏览器中加载 `dist/video-rotate-zoom-drag.user.js` 实测验证通过，得到用户确认后才可以 `git commit`。不要改完立即提交。

- 提交规则及前置任务：

  用户确认测试通过后明确许可"提交"、"commit" 后：
  1. 更新 `README.md`（功能特性、工具条布局、快捷键表、项目结构等）
  2. 更新 `CLAUDE.md`（模块清单、依赖图、配置默认值等）与最新代码一致
  3. 更新 `CHANGELOG.md` 把此次任务修改的修改加以说明
  4. 修改 package.json 版本号，根据改动大小决定版本号。一次 push 对应一次版本号变更。
  5. 如果任务来源是 `TODOS.md`，则先更新 `TODOS.md` 中的任务状态为完成。
  6. 最后再 commit。
  7. 此时不要 `git push`

- 推送规则：

  只有在用户明确说"推送"、"上传到 GitHub"等指令时才执行 `git push`。

- **"提交" = 仅 commit，不含 push。** 

  日常开发构建、修改代码后绝对不要自动推送，即使是 commit 后也不要顺势 push。
