/**
 * 样式模块 - chimo 风格玻璃浮层 UI
 *
 * 设计要点：
 *  - .vrz-container: position:fixed 挂到 body，跟随视频父元素 rect
 *  - .vrz-controls:  绝对定位在容器底部居中，pointer-events:none
 *  - .vrz-main-bar:       玻璃胶囊，pointer-events:auto 接收点击
 *
 * 不再为每个平台写选择器，所有样式通过自定义类名隔离。
 */

const STYLE = `
  :root {
    --z-index-base: 2000000000;
  }
  .vrz-container {
    position: fixed;
    z-index: var(--z-index-base);
    pointer-events: none;
    will-change: top, left, width, height;
  }

  .vrz-controls {
    position: absolute;
    top: 4px;
    left: 4px;
    display: flex;
    align-items: center;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  .vrz-controls.hidden { display: none; }
  /* bar 内部属性统一 */
  .vrz-bar {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    height: 20px;
    padding: 0 5px;
    border-radius: 20px;
    background-color: rgba(0, 0, 0, 0.3);
    -webkit-backdrop-filter: saturate(180%) blur(17.5px);
    backdrop-filter: saturate(180%) blur(17.5px);
    pointer-events: auto;
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    font-weight: 700;
    line-height: 1;
    user-select: none;
    -webkit-user-select: none;
  }
  .vrz-main-bar { }

  .vrz-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 2px;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: #fff;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.1s ease;
  }
  .vrz-btn:hover { background: rgba(255, 255, 255, 0.22); }
  .vrz-btn:active { transform: scale(0.88); }
  .vrz-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .vrz-btn.vrz-on { background: #2d6; }
  .vrz-btn.vrz-on:hover { background: #3e7; }

  .vrz-ab-mark { white-space: nowrap; }

  .vrz-display {
    min-width: 44px;
    padding: 0 4px;
    text-align: center;
    font-variant-numeric: tabular-nums;
    opacity: 0.92;
  }

  .vrz-reset {
    background: rgba(255, 60, 60, 0.5);
    padding: 0 4px;
    font-size: 14px;
  }
  .vrz-reset:hover { background: rgba(255, 60, 60, 0.82); }

  .vrz-divider {
    width: 1px;
    height: 18px;
    margin: 0 2px;
    background: rgba(255, 255, 255, 0.25);
  }

  /* 倍速选择器 */
  .vrz-speed-wrap {
    position: relative;
    display: inline-flex;
  }
  .vrz-speed-btn {
    min-width: 24px;
    padding: 0 2px;
    font-size: 12px;
  }
  .vrz-speed-menu {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 6px;
    min-width: 60px;
    padding: 4px 0;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.65);
    -webkit-backdrop-filter: saturate(180%) blur(17.5px);
    backdrop-filter: saturate(180%) blur(17.5px);
    z-index: calc(var(--z-index-base) + 2);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  }
  .vrz-speed-menu.hidden { display: none; }
  .vrz-speed-item {
    padding: 4px 16px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.12s;
  }
  .vrz-speed-item:hover { background: rgba(255, 255, 255, 0.18); }
  .vrz-speed-item.active {
    background: rgba(255, 255, 255, 0.12);
    color: #0cf;
  }

  /* 缩放选择器 */
  .vrz-zoom-wrap {
    position: relative;
    display: inline-flex;
  }
  .vrz-zoom-btn {
    min-width: 24px;
    padding: 0 2px;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
  .vrz-zoom-menu {
    position: absolute;
    top: 100%;
    margin-top: 6px;
    padding: 6px;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.65);
    -webkit-backdrop-filter: saturate(180%) blur(17.5px);
    backdrop-filter: saturate(180%) blur(17.5px);
    z-index: calc(var(--z-index-base) + 2);
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  }
  .vrz-zoom-menu.hidden { display: none; }
  .vrz-zoom-item {
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
    text-align: center;
    transition: background 0.12s;
  }
  .vrz-zoom-item:hover { background: rgba(255, 255, 255, 0.18); }
  .vrz-zoom-item.active {
    background: rgba(255, 255, 255, 0.12);
    color: #0cf;
  }

  /* 方向移动弹出菜单（十字布局） */
  .vrz-move-wrap {
    position: relative;
    display: inline-flex;
  }
  .vrz-move-menu {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 6px;
    padding: 6px;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.65);
    -webkit-backdrop-filter: saturate(180%) blur(17.5px);
    backdrop-filter: saturate(180%) blur(17.5px);
    z-index: calc(var(--z-index-base) + 2);
    display: grid;
    grid-template-columns: repeat(3, auto);
    grid-template-rows: repeat(3, auto);
    gap: 2px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  }
  .vrz-move-menu.hidden { display: none; }

  /* 次级面板（绝对定位在 bar 右侧，保持 bar 居中不动） */
  .vrz-secondary-bar {
    position: absolute;
    left: 100%;
    top: 0;
    z-index: calc(var(--z-index-base) + 1);
  }
  .vrz-secondary-bar.hidden { display: none; }

  .vrz-group {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  /* 模态遮罩 */
  .vrz-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-index-base) - 1);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
    -webkit-backdrop-filter: blur(4px);
    backdrop-filter: blur(4px);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .vrz-modal-overlay.hidden { display: none; }

  .vrz-modal {
    width: 360px;
    max-width: 90vw;
    padding: 18px 20px 16px;
    border-radius: 14px;
    background: #1f1f24;
    color: #fff;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
  }
  .vrz-modal-title {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .vrz-modal-sub {
    font-size: 11px;
    opacity: 0.55;
    margin-bottom: 14px;
  }
  .vrz-host { color: #6cf; }

  .vrz-modal-section {
    padding: 10px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .vrz-modal-section:first-of-type { border-top: 0; }
  .vrz-modal-section-title {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 8px;
    opacity: 0.9;
  }
  .vrz-mod-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .vrz-kb-groups-row {
    margin-top: 8px;
  }

  .vrz-toggle, .vrz-mod {
    height: 28px;
    padding: 0 12px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 14px;
    background: transparent;
    color: #fff;
    font: 600 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s, border-color 0.15s;
  }
  .vrz-toggle:hover, .vrz-mod:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
  }
  .vrz-toggle.on {
    background: #2d6;
    border-color: #2d6;
  }
  .vrz-mod.active {
    background: #36c;
    border-color: #36c;
  }
  .vrz-mod:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .vrz-flash {
    animation: vrz-shake 0.35s;
    border-color: #f55 !important;
  }
  @keyframes vrz-shake {
    0%,100% { transform: translateX(0); }
    25% { transform: translateX(-3px); }
    75% { transform: translateX(3px); }
  }

  .vrz-modal-hint {
    min-height: 16px;
    margin-top: 8px;
    font-size: 11px;
    color: #fb6;
  }

  /* 黑白名单管理列表 */
  .vrz-block-list {
    max-height: 160px;
    overflow-y: auto;
    margin-top: 6px;
  }
  .vrz-block-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    transition: background 0.12s;
  }
  .vrz-block-item:hover { background: rgba(255, 255, 255, 0.08); }
  .vrz-block-host { opacity: 0.85; word-break: break-all; }
  .vrz-block-remove {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    margin-left: 8px;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 60, 60, 0.4);
    color: #fff;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    transition: background 0.12s;
  }
  .vrz-block-remove:hover { background: rgba(255, 60, 60, 0.8); }
  .vrz-block-empty {
    padding: 8px;
    font-size: 12px;
    opacity: 0.4;
    text-align: center;
  }
  .vrz-block-add-row {
    display: flex;
    gap: 6px;
    margin-top: 6px;
  }
  .vrz-block-input {
    flex: 1;
    height: 28px;
    padding: 0 10px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 14px;
    background: transparent;
    color: #fff;
    font: 600 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .vrz-block-input::placeholder { color: rgba(255, 255, 255, 0.3); }
  .vrz-block-input:focus { outline: none; border-color: #36c; }

  /* 本页发现的域名 */
  .vrz-block-discovered {
    margin-top: 6px;
  }
  .vrz-block-quick {
    display: inline-flex;
    gap: 4px;
    flex-shrink: 0;
    margin-left: 8px;
  }
  .vrz-block-tag {
    width: 22px;
    height: 22px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 50%;
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    font: 600 11px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    cursor: pointer;
    transition: all 0.12s;
  }
  .vrz-block-tag:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
  .vrz-block-tag.active { border-color: #36c; background: #36c; color: #fff; }

  .vrz-block-reload {
    height: 30px;
    padding: 0 14px;
    margin-right: auto;
    border: 0;
    border-radius: 15px;
    background: #2d6;
    color: #fff;
    font: 600 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    cursor: pointer;
    transition: background 0.15s;
  }
  .vrz-block-reload:hover { background: #3e7; }
  .vrz-block-reload:disabled {
    background: rgba(255, 255, 255, 0.12);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .vrz-modal-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 14px;
  }
  .vrz-modal-close {
    height: 30px;
    padding: 0 18px;
    border: 0;
    border-radius: 15px;
    background: #36c;
    color: #fff;
    font: 600 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    cursor: pointer;
  }
  .vrz-modal-close:hover { background: #47d; }

  /* 帮助浮层 */
  .vrz-help {
    width: 280px;
    max-width: 90vw;
    padding: 18px 20px 16px;
    border-radius: 14px;
    background: #1f1f24;
    color: #fff;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
  }
  .vrz-help-list { margin-top: 6px; }
  .vrz-help-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .vrz-help-row:last-child { border-bottom: 0; }
  .vrz-help-key {
    font-family: ui-monospace, Menlo, Consolas, monospace;
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
  }
  .vrz-help-desc { opacity: 0.75; }

  /* 四向箭头图标 */
  .boxicons--move {
    display: inline-block;
    width: 1em;
    height: 1em;
    --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='black' d='M18.21 7.79L16.8 9.2l1.79 1.79H13V5.4l1.79 1.79l1.41-1.41l-3.5-3.5a.996.996 0 0 0-1.41 0l-3.5 3.5L9.2 7.19l1.79-1.79v5.59H5.4L7.19 9.2L5.78 7.79l-3.5 3.5a.996.996 0 0 0 0 1.41l3.5 3.5l1.41-1.41L5.4 13h5.59v5.59L9.2 16.8l-1.41 1.41l3.5 3.5c.2.2.45.29.71.29s.51-.1.71-.29l3.5-3.5l-1.41-1.41l-1.79 1.79V13h5.59l-1.79 1.79l1.41 1.41l3.5-3.5a.996.996 0 0 0 0-1.41l-3.5-3.5Z'/%3E%3C/svg%3E");
    background-color: currentColor;
    -webkit-mask-image: var(--svg);
    mask-image: var(--svg);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
  }
`;

class Styles {
  static inject() {
    if (document.getElementById('vrz-style')) return;
    const style = document.createElement('style');
    style.id = 'vrz-style';
    style.textContent = STYLE;
    (document.head || document.documentElement).appendChild(style);
  }
}

export { Styles, STYLE };
