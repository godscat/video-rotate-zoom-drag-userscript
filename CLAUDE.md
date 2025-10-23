# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

B 站视频增强用户脚本项目，为视频播放器添加缩放、旋转、拖拽移动和还原功能。采用模块化 ES6 架构，使用 webpack 构建生成兼容 Tampermonkey/Greasemonkey 的用户脚本。

## Build System

### Available Commands

```bash
npm run build    # 生产环境构建
npm run watch    # 开发环境监听模式
npm run dev      # 开发模式提示
```

### Package Manager

- **pnpm** is configured as the package manager (version 10.18.1+)

### Build Output

- **Development**: Serves on port 10086 with HMR and source maps
- **Production**: Outputs readable, non-minified code to `dist/video-rotate-zoom-drag.user.js`
- **Entry Point**: `src/video-rotate-zoom-drag.user.js`

## Architecture

### Core Module System

The project follows a modular ES6 architecture where each major feature is separated into its own module:

- **Initializer** (`src/modules/initializer.js`) - Main coordinator that manages initialization and lifecycle of all modules. Handles SPA page dynamic monitoring via MutationObserver.
- **VideoTransform** (`src/modules/video-transform.js`) - Core video transformation engine managing DOM elements, transforms (scale/rotate/translate), and state management.
- **Controllers** - Feature-specific controllers:
  - `ZoomController` - Zoom level management (50%-300%, 10% steps)
  - `RotationController` - Rotation management (90° increments)
  - `DragHandler` - Drag functionality (only active when zoom > 100%)
- **Interaction Layer**:
  - `UIComponents` - DOM element creation and management
  - `KeyboardShortcuts` - Keyboard event handling
  - `Styles` - CSS injection via GM_addStyle

### Module Dependencies

```
Initializer
├── VideoTransform (core state)
├── UIComponents (creation)
├── ZoomController → VideoTransform
├── RotationController → VideoTransform
├── DragHandler → VideoTransform
├── KeyboardShortcuts → all controllers
└── Styles (independent)
```

### Key Design Patterns

- **Single Responsibility**: Each module handles one specific concern
- **State Management**: VideoTransform is the single source of truth for video state
- **Event-Driven**: Controllers emit events, VideoTransform handles state changes
- **Lifecycle Management**: Every module provides destroy() for cleanup
- **SPA-Aware**: Uses MutationObserver to detect page changes and reinitialize

## Userscript Configuration

### Supported Sites

Matches B 站 domains: `https://www.bilibili.com/*` and `https://bangumi.bilibili.com/*`

### Required Permissions

- `GM_addStyle` for CSS injection
- `document-start` injection timing

### Header Configuration

Automatically generated from `package.json` and `userscript-headers.js` template during build.

## Development Workflow

### Module Development

When adding new features:

1. Create module in `src/modules/`
2. Import and initialize in `initializer.js`
3. Add to cleanup sequence in `Initializer.stop()`
4. Test by running `npm run watch` and refreshing Tampermonkey

### File Organization

- **Main entry**: `src/video-rotate-zoom-drag.user.js` (IIFE wrapper)
- **Modules**: All in `src/modules/` with clear naming convention
- **Legacy code**: `origin-source/video.util.js` (preserved for reference)
- **Refactored code**: `src/video-rotate-zoom-drag.user.js` (new modular version)

### Testing Process

1. Development: `npm run watch` for live reload
2. Manual testing: Load `src/video-rotate-zoom-drag.user.js` directly in Tampermonkey
3. Production: `npm run build` then use `dist/video-rotate-zoom-drag.user.js`

## Key Technical Details

### Video Element Targeting

- **Primary selector**: `.bpx-player-video-wrap,.fp-player`
- **Controls container**: `.bpx-player-control-bottom-center,.fp-controls`
- Uses querySelector with fallbacks for different player versions

### Transform State Management

```javascript
state = {
  zoomLevel: 100, // 50-300 range
  rotation: 0, // 0-360 degrees
  offsetX: 0, // drag position
  offsetY: 0,
};
```

### Event Coordination

- **Initializer** creates MutationObserver for SPA navigation
- **VideoTransform** applies CSS transforms via `element.style.transform`
- **Controllers** manage UI updates and event listeners
- **KeyboardShortcuts** provides programmatic access to all functions

### Error Handling

- All modules wrapped in try-catch in Initializer
- Graceful degradation when video elements not found
- Console logging for debugging initialization issues

## Browser Compatibility

- **Modern browsers**: ES6 modules support required
- **Userscript managers**: Tampermonkey, Greasemonkey
- **Permissions**: Requires GM_addStyle API
- **DOM APIs**: Uses standard DOM querySelector and CSS transforms
