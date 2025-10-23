# B站视频增强：缩放、旋转、拖拽

一个用于B站的用户脚本，为视频播放器添加缩放、旋转、拖拽移动和还原功能。

## 功能特性

- 🔍 **缩放功能**：支持 50% - 300% 的视频缩放
- 🔄 **旋转功能**：支持 90° 递增/递减旋转
- 🖱️ **拖拽移动**：缩放后可以拖拽移动视频位置
- ↩️ **一键还原**：快速恢复到初始状态
- ⌨️ **键盘快捷键**：支持丰富的快捷键操作
- 📱 **触摸支持**：支持移动设备的触摸拖拽

## 安装

1. 确保已安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展
2. 复制 `src/video-rotate-zoom-drag.user.js` 的内容
3. 在 Tampermonkey 中创建新脚本并粘贴代码
4. 保存并刷新B站视频页面

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + +/↑` | 放大视频 |
| `Ctrl + -/↓` | 缩小视频 |
| `Ctrl + L/←` | 向左旋转 |
| `Ctrl + R/→` | 向右旋转 |
| `Ctrl + 0` | 还原到初始状态 |
| `Ctrl + Space` | 切换全屏 |
| `Shift + ↑↓←→` | 快速移动 |
| `Esc` | 重置 |

## 使用说明

1. **缩放操作**：
   - 点击 `+` 或 `-` 按钮进行缩放
   - 缩放范围：50% - 300%，步长 10%

2. **旋转操作**：
   - 点击 `↺` 或 `↻` 按钮进行旋转
   - 每次旋转 90°

3. **拖拽操作**：
   - 视频缩放到 100% 以上时可以拖拽移动
   - 鼠标悬停时显示抓取光标
   - 支持触摸设备的拖拽操作

4. **重置操作**：
   - 点击 `还原` 按钮恢复初始状态
   - 还原按钮上显示当前旋转角度

## 项目结构

```
src/
├── video-rotate-zoom-drag.user.js  # 主脚本文件
└── modules/                        # 功能模块目录
    ├── drag-handler.js            # 拖拽处理器
    ├── initializer.js             # 初始化模块
    ├── keyboard-shortcuts.js      # 键盘快捷键
    ├── rotation-controller.js     # 旋转控制
    ├── styles.js                  # 样式管理
    ├── ui-components.js           # UI组件
    ├── video-transform.js         # 视频变换操作
    └── zoom-controller.js         # 缩放控制
```

## 开发

1. 克隆项目到本地
2. 修改相应模块的代码
3. 在 Tampermonkey 中测试
4. 使用 `npm run build` 构建生产版本（如果配置了 webpack）

## 兼容性

- ✅ Chrome + Tampermonkey
- ✅ Firefox + Tampermonkey
- ✅ Edge + Tampermonkey
- ✅ Safari + Tampermonkey

## 支持的网站

- https://www.bilibili.com/video/*
- https://www.bilibili.com/medialist/play/*
- https://www.bilibili.com/bangumi/play/*
- https://bangumi.bilibili.com/anime/*/play*
- https://bangumi.bilibili.com/movie/*
- https://www.bilibili.com/list/watchlater/*

## 许可证

MIT License

## 作者

浮云里的浮云