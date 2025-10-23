# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

多平台视频增强用户脚本项目，为多个视频平台的播放器添加缩放、旋转、拖拽移动和还原功能。采用模块化 ES6 架构，使用自定义构建脚本生成兼容 Tampermonkey/Greasemonkey 的用户脚本。支持B站、YouTube、Youku、iQIYI、Iwara等平台。

## Build System

### Available Commands

```bash
pnpm run build    # 生产环境构建
pnpm run watch    # 开发环境监听模式
pnpm run dev      # 开发模式提示
```

### Package Manager

- **pnpm** is configured as the package manager (version 10.18.1+)

### Build Output

- **Development**: Uses `src/video-rotate-zoom-drag.user.js` directly in Tampermonkey
- **Production**: Outputs readable, non-minified code to `dist/video-rotate-zoom-drag.user.js` via simple build script
- **Entry Point**: `src/video-rotate-zoom-drag.user.js`
- **Build Tool**: Custom `build-simple.js` script that automatically discovers modules

## Architecture

### Core Module System

The project follows a modular ES6 architecture where each major feature is separated into its own module:

- **Initializer** (`src/modules/initializer.js`) - Main coordinator that manages initialization and lifecycle of all modules. Handles SPA page dynamic monitoring via MutationObserver and platform-specific configurations.
- **VideoTransform** (`src/modules/video-transform.js`) - Core video transformation engine managing DOM elements, transforms (scale/rotate/translate), and state management.
- **Platform Detection** (`src/modules/platform-detector.js`) - Automatic platform detection supporting bilibili, youtube, youku, iqiyi, iwara.
- **Config Management** (`src/modules/config.js`) - Centralized configuration with platform-specific overrides and UI control settings.
- **Controllers** - Feature-specific controllers:
  - `ZoomController` - Zoom level management (50%-300%, 5% steps)
  - `RotationController` - Rotation management (90° increments)
  - `DragHandler` - Drag functionality with platform-specific modifier keys
  - `WheelHandler` - Mouse wheel zoom handling with modifier key support
- **Interaction Layer**:
  - `UIComponents` - DOM element creation and management with conditional display
  - `KeyboardShortcuts` - Comprehensive keyboard event handling including movement
  - `Styles` - CSS injection via GM_addStyle
- **Logging System** (`src/modules/logger.js`) - Global logging with timestamps and module prefixes

### Module Dependencies

```
Initializer
├── PlatformDetector (platform detection)
├── Config (configuration management)
├── VideoTransform (core state)
├── UIComponents (conditional creation)
├── ZoomController → VideoTransform
├── RotationController → VideoTransform
├── DragHandler → VideoTransform
├── WheelHandler → ZoomController
├── KeyboardShortcuts → all controllers
├── Logger (global logging)
└── Styles (independent)
```

### Global Systems

- **Logger**: Singleton pattern shared across all modules with child logger creation
- **Config**: Platform-aware configuration system with automatic merging
- **Event Coordination**: Centralized through Initializer with proper cleanup

### Key Design Patterns

- **Single Responsibility**: Each module handles one specific concern
- **State Management**: VideoTransform is the single source of truth for video state
- **Event-Driven**: Controllers emit events, VideoTransform handles state changes
- **Lifecycle Management**: Every module provides destroy() for cleanup
- **SPA-Aware**: Uses MutationObserver to detect page changes and reinitialize

## Userscript Configuration

### Supported Sites

Auto-detected platforms with domain matching:
- **Bilibili**: `https://www.bilibili.com/*`, `https://bangumi.bilibili.com/*`
- **YouTube**: `https://www.youtube.com/*`, `https://youtu.be/*`, `https://m.youtube.com/*`
- **Youku**: `https://www.youku.com/*`, `https://v.youku.com/*`
- **iQIYI**: `https://www.iqiyi.com/*`, `https://www.iq.com/*`
- **Iwara**: `https://iwara.tv/*`

### Platform-Specific Features

- **UI Controls**: Enabled by default, disabled on Iwara for cleaner interface
- **Drag Modifiers**:
  - B站/YouTube/Iwara: Requires Ctrl key
  - Other platforms: No modifier required
- **Selectors**: Platform-specific CSS selectors for video containers and controls

### Required Permissions

- `GM_addStyle` for CSS injection
- `document-start` injection timing

### Header Configuration

Automatically generated from `package.json` and `userscript-headers.js` template during build.

## Development Workflow

### Module Development

When adding new features:

1. Create module in `src/modules/` with proper imports
2. Import and initialize in `initializer.js` with error handling
3. Add to cleanup sequence in `Initializer.stop()`
4. Use global logger: `const logger = getLogger().createChild('ModuleName')`
5. Add platform-specific configuration if needed in `config.js`
6. Test by running `node build-simple.js` and refreshing Tampermonkey

### Adding Platform Support

1. Add platform patterns to `PLATFORM_PATTERNS` in `platform-detector.js`
2. Add platform-specific configuration in `config.js`
3. Test platform detection and UI behavior

### File Organization

- **Main entry**: `src/video-rotate-zoom-drag.user.js` (IIFE wrapper)
- **Modules**: All in `src/modules/` with clear naming convention
- **Legacy code**: `origin-source/video.util.js` (preserved for reference)
- **Refactored code**: `src/video-rotate-zoom-drag.user.js` (new modular version)

### Testing Process

1. Development: Load `src/video-rotate-zoom-drag.user.js` directly in Tampermonkey
2. Production: `node build-simple.js` then use `dist/video-rotate-zoom-drag.user.js`
3. Platform Testing: Test on different supported platforms to ensure proper detection
4. UI Testing: Verify UI controls show/hide correctly based on platform configuration
5. Log Monitoring: Check console for proper logging with timestamps and module prefixes

## Key Technical Details

### Video Element Targeting

Platform-specific selectors with fallbacks:
- **Bilibili**: `.bpx-player-video-wrap,.fp-player` and `.bpx-player-control-bottom-center,.fp-controls`
- **YouTube**: `.html5-video-container` and `.ytp-left-controls`
- **Iwara**: `.video-js` and `.vjs-control-bar`
- **Generic fallbacks**: Common video player selectors

Selectors are automatically merged based on detected platform.

### Transform State Management

```javascript
state = {
  zoomLevel: 100, // 50-300 range, 5% steps
  rotation: 0, // 0-360 degrees, 90° increments
  offsetX: 0, // drag position in pixels
  offsetY: 0,
};
```

### Keyboard Shortcuts System

- **Modifier Keys**: Ctrl-based shortcuts for primary functions
- **Movement Keys**: Ctrl + Arrow keys for precise positioning
- **Visual Feedback**: Real-time key display in logs
- **Conflict Resolution**: No keyCode conflicts between features
- **Fallback Handling**: Graceful degradation when controllers unavailable

### Event Coordination

- **Initializer** creates MutationObserver for SPA navigation
- **VideoTransform** applies CSS transforms via `element.style.transform`
- **Controllers** manage UI updates and event listeners
- **KeyboardShortcuts** provides programmatic access to all functions
- **Platform Detection** triggers configuration adaptation

### Error Handling & Logging

- **Structured Logging**: Global logger with timestamps and module prefixes
- **Graceful Degradation**: Missing UI/controllers don't break keyboard shortcuts
- **Error Isolation**: Module failures don't affect other components
- **Debug Information**: Detailed platform detection and initialization logs
- **User-Friendly**: Clear console messages for troubleshooting

## Browser Compatibility

- **Modern browsers**: ES6 modules support required
- **Userscript managers**: Tampermonkey, Greasemonkey
- **Permissions**: Requires GM_addStyle API
- **DOM APIs**: Uses standard DOM querySelector and CSS transforms
