/**
 * 样式模块 - chimo 风格玻璃浮层 UI
 *
 * 设计要点：
 *  - .vrz-container: position:fixed 挂到 body，跟随视频父元素 rect
 *  - .vrz-controls:  绝对定位在容器底部居中，pointer-events:none
 *  - .vrz-bar:       玻璃胶囊，pointer-events:auto 接收点击
 *
 * 不再为每个平台写选择器，所有样式通过自定义类名隔离。
 */

const STYLE = `
  .vrz-container {
    position: fixed;
    z-index: 2147483647;
    pointer-events: none;
    will-change: top, left, width, height;
  }

  .vrz-controls {
    position: absolute;
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column-reverse;
    gap: 6px;
    align-items: center;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  .vrz-controls.hidden { display: none; }

  .vrz-bar {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 10px;
    border-radius: 20px;
    background-color: rgba(0, 0, 0, 0.55);
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

  .vrz-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 26px;
    height: 26px;
    padding: 0 6px;
    border: 0;
    border-radius: 13px;
    background: transparent;
    color: #fff;
    font: inherit;
    font-size: 15px;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.1s ease;
  }
  .vrz-btn:hover { background: rgba(255, 255, 255, 0.22); }
  .vrz-btn:active { transform: scale(0.88); }
  .vrz-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .vrz-btn.vrz-on { background: #2d6; }
  .vrz-btn.vrz-on:hover { background: #3e7; }

  .vrz-display {
    min-width: 44px;
    padding: 0 4px;
    text-align: center;
    font-variant-numeric: tabular-nums;
    opacity: 0.92;
  }

  .vrz-reset {
    background: rgba(255, 60, 60, 0.5);
    padding: 0 10px;
    font-size: 12px;
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
    min-width: 34px;
    padding: 0 6px;
    font-size: 12px;
  }
  .vrz-speed-menu {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 6px;
    min-width: 60px;
    padding: 4px 0;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.65);
    -webkit-backdrop-filter: saturate(180%) blur(17.5px);
    backdrop-filter: saturate(180%) blur(17.5px);
    z-index: 1;
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

  /* 次级面板 */
  .vrz-secondary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 10px;
    border-radius: 20px;
    background-color: rgba(0, 0, 0, 0.55);
    -webkit-backdrop-filter: saturate(180%) blur(17.5px);
    backdrop-filter: saturate(180%) blur(17.5px);
    pointer-events: auto;
  }
  .vrz-secondary.hidden { display: none; }

  .vrz-group {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  /* 模态遮罩 */
  .vrz-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
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
