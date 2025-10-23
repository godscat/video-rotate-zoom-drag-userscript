# 多平台视频增强：缩放、旋转、拖拽

一个功能强大的用户脚本，为多个视频平台的播放器添加缩放、旋转、拖拽移动和还原功能。支持B站、YouTube、Youku、iQIYI、Iwara等主流视频网站。

## ✨ 功能特性

- 🌍 **多平台支持**：支持B站、YouTube、Youku、iQIYI、Iwara等平台
- 🔍 **缩放功能**：支持 50% - 300% 的视频缩放，步长 5%
- 🔄 **旋转功能**：支持 90° 递增/递减旋转
- 🖱️ **拖拽移动**：支持拖拽移动视频位置，可配置修饰键
- ↩️ **一键还原**：快速恢复到初始状态
- ⌨️ **键盘快捷键**：支持丰富的快捷键操作，包括移动功能
- 🖱️ **滚轮缩放**：支持Ctrl+滚轮缩放视频
- 📊 **日志系统**：统一的日志管理，支持开关控制
- 🎛️ **智能UI**：根据平台自动显示/隐藏控制按钮
- 📱 **触摸支持**：支持移动设备的触摸拖拽

## 🚀 安装

1. 确保已安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展
2. 复制 `src/video-rotate-zoom-drag.user.js` 的内容
3. 在 Tampermonkey 中创建新脚本并粘贴代码
4. 保存并刷新支持的视频页面

**或使用构建版本：**
- 使用 `npm run build` 构建 `dist/video-rotate-zoom-drag.user.js`
- 构建版本经过优化，文件更小，性能更好

## ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + +` | 放大视频 |
| `Ctrl + -` | 缩小视频 |
| `Ctrl + L` | 向左旋转90° |
| `Ctrl + R` | 向右旋转90° |
| `Ctrl + 0` | 还原到初始状态 |
| `Ctrl + Space` | 切换全屏 |
| `Ctrl + ↑` | 向上移动视频 |
| `Ctrl + ↓` | 向下移动视频 |
| `Ctrl + ←` | 向左移动视频 |
| `Ctrl + →` | 向右移动视频 |

### 🖱️ 鼠标操作

| 操作 | 功能 |
|------|------|
| `Ctrl + 滚轮上` | 放大视频 |
| `Ctrl + 滚轮下` | 缩小视频 |
| `拖拽视频` | 移动视频位置（需要按住平台特定修饰键） |

## 📖 使用说明

### 视频控制
- **缩放操作**：点击 `+` 或 `-` 按钮进行缩放，缩放范围：50% - 300%，步长 5%
- **旋转操作**：点击 `↺` 或 `↻` 按钮进行旋转，每次旋转 90°
- **移动操作**：使用 `Ctrl + 方向键` 精确移动视频位置
- **重置操作**：点击 `还原` 按钮或按 `Ctrl + 0` 恢复初始状态

### 拖拽功能
- **B站/YouTube/Iwara**：需要按住 `Ctrl` 键才能拖拽
- **其他平台**：直接拖拽（无需修饰键）
- 拖拽时鼠标会显示抓取光标
- 支持触摸设备的拖拽操作

### 平台特性
- **B站/YouTube/Youku/iQIYI**：显示完整的UI控制按钮
- **Iwara**：隐藏UI按钮，提供更干净的用户界面，仅支持键盘快捷键

### 日志系统
- 所有操作都会在控制台输出详细日志
- 日志格式：`[时间戳] [模块名] [级别] 消息内容`
- 可通过代码控制日志开关

## 📁 项目结构

```
src/
├── video-rotate-zoom-drag.user.js  # 主脚本文件
└── modules/                        # 功能模块目录
    ├── config.js                  # 配置管理
    ├── drag-handler.js            # 拖拽处理器
    ├── initializer.js             # 初始化模块
    ├── keyboard-shortcuts.js      # 键盘快捷键
    ├── logger.js                  # 日志系统
    ├── platform-detector.js       # 平台检测
    ├── rotation-controller.js     # 旋转控制
    ├── styles.js                  # 样式管理
    ├── ui-components.js           # UI组件
    ├── video-transform.js         # 视频变换操作
    ├── wheel-handler.js           # 滚轮处理
    └── zoom-controller.js         # 缩放控制

dist/
└── video-rotate-zoom-drag.user.js # 构建后的脚本文件
```

## 🛠️ 开发

### 环境要求
- Node.js 16+
- pnpm 10.18.1+ (推荐)

### 开发流程
1. 克隆项目到本地
2. 安装依赖：`pnpm install`
3. 修改相应模块的代码
4. 在 Tampermonkey 中测试

### 构建命令
```bash
pnpm run build    # 生产环境构建
pnpm run watch    # 开发环境监听模式
pnpm run dev      # 开发模式提示
```

### 架构特点
- **模块化设计**：ES6模块化架构，功能分离
- **自动构建**：使用自定义构建脚本，自动发现模块
- **平台适配**：自动检测平台并应用相应配置
- **统一日志**：完整的日志系统，便于调试
- **SPA支持**：支持单页应用动态页面切换

## 兼容性

- ✅ Chrome + Tampermonkey
- ✅ Firefox + Tampermonkey
- ✅ Edge + Tampermonkey
- ✅ Safari + Tampermonkey

## 🌐 支持的网站

### B站 (bilibili)
- https://www.bilibili.com/**
- https://bangumi.bilibili.com/**

### YouTube
- https://www.youtube.com/**
- https://youtu.be/**
- https://m.youtube.com/**

### 优酷 (Youku)
- https://www.youku.com/**
- https://v.youku.com/**

###爱奇艺 (iQIYI)
- https://www.iqiyi.com/**
- https://www.iq.com/**

### Iwara
- https://iwara.tv/**
- 注意：Iwara平台默认隐藏UI按钮，仅支持键盘快捷键

### 检测逻辑
脚本会自动检测当前平台并应用相应的配置和选择器。

## 许可证

MIT License

## 作者

浮云里的浮云