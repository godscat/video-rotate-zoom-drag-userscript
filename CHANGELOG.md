# Changelog

本文件由 git 提交记录整理（`git log`），记录有意义的改动，按新→旧排列；版本号见 package.json。

## 2.2.0（2025-08-17）

- **A-B 循环**：仅设置终点 B 即可开始循环（起点 A 默认为 0）；A/B 悬停弹出微调器（±5s / ±1s / ±0.1s）
- **全屏支持**：全屏时工具条跟随显示（容器随 fullscreenchange 移入/移出全屏元素）；全局唤醒键 Alt+Backquote（默认开启，可配置，不依赖快捷键总开关）改为 toggle：在「固定显示 / 隐藏」之间切换，固定显示时增强对比度（`ui.wakeBgAlpha` 默认 0.6）
- **配置存取统一**：新增 `Proxy(config)` 统一读写接口，存储键对齐为 `vrz:<配置路径>`（如 `vrz:shortcuts.enabled`），旧键自动迁移；站点配置键改为 `vrz:site:<host>`
- **工具条偏移**（SOMEDAY A 方案）：新增 `ui.verticalOffset` / `ui.horizontalOffset` 配置，配置面板可 ±2px 微调（全局持久化）
- **显隐逻辑**：工具条改为鼠标停止移动满 `ui.hideDelay` 后才隐藏（持续移动不隐藏）；唤醒灵敏度 `ui.pointerWakeThreshold`（默认 8px）
- **操作中不隐藏**：缩放档位/倍速/移动/AB 微调弹出层打开时工具条保持显示，关闭后恢复自动隐藏
- 新增本 CHANGELOG.md（由 git 提交记录整理）

## 历史提交（新 → 旧）

### 功能
- 黑白名单：入口级拦截 + GM 菜单管理面板 + iframe 域名扫描 + 黑/白互斥（77bd332 / 1808681）
- 两阶段懒启动：无视频站点零 UI 开销（31365e1）
- 缩放档位下拉选择（711cdd1）
- 倍速播放下拉菜单（8f5d6aa）
- A-B 循环（662e6a3）
- 暂停时常驻显示开关（9e1e716）
- 工具条移至左上角、四向移动十字菜单、快捷键默认禁用 + 分组开关（fbd7409）
- 多平台支持 + 滚轮缩放 + 拖拽修饰键（f0a75b2 / 9cf9b8d / 7d531f1）
- 过滤信息流小尺寸预览（06bce57）

### 修复
- 拖拽改用 pointerdown 最早拦截 + click 守卫（b22ae69）
- A-B 时间显示支持小时（c0fc6c7）
- A-B 标记不换行（4be0d6e）
- B 站浮层位置偏移：SPA MutationObserver 同步修正（fbd7409）
- 事件监听器泄漏 + checkModifiers 类型安全（122f4a6）

### 重构
- 模块化架构 + util/constants 基础设施层（146dd88 / 21b1663）
- 数据持久化统一 GM_setValue/GM_getValue，移除 IndexedDB（1689572）
- 移除 showMilliseconds，formatTime 固定 0.1s 精度（44c4528）
- 构建：基础设施模块前置（113fc20）

### 工程与文档
- GPL-3.0-or-later 许可、仓库改名、作者致谢（5ad2aa1 / af6c8e4 / de31c29）
- 测试 / 提交 / 推送规则与文档同步（944f804 / cdf8730 / c8a0971 / 1ac57a4）
