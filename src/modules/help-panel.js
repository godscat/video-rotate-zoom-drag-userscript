/**
 * 帮助面板模块 - 默认快捷键只读浮层
 *
 * 从 CONFIG.shortcuts 生成只读列表（暂不可配置）。
 */

import CONFIG from './config.js';

const ITEMS = [
  { code: 'Equal', label: 'Shift + (+)', desc: '放大视频' },
  { code: 'Minus', label: 'Shift + (-)', desc: '缩小视频' },
  { code: 'KeyL', label: 'Shift + L', desc: '向左旋转 90°' },
  { code: 'KeyR', label: 'Shift + R', desc: '向右旋转 90°' },
  { code: 'Digit0', label: 'Shift + 0', desc: '还原视频' },
  { code: 'ArrowUp', label: 'Shift + ↑', desc: '上移' },
  { code: 'ArrowDown', label: 'Shift + ↓', desc: '下移' },
  { code: 'ArrowLeft', label: 'Shift + ←', desc: '左移' },
  { code: 'ArrowRight', label: 'Shift + →', desc: '右移' },
  { code: 'Space', label: 'Shift + Space', desc: '全屏切换' },
  { code: 'BracketLeft', label: '[', desc: '设置 A-B 起点 A' },
  { code: 'BracketRight', label: ']', desc: '设置 A-B 终点 B' },
  { code: 'Backslash', label: '\\', desc: 'A-B 循环开关' },
  { code: 'BracketLeft', label: 'Shift+[', desc: '清空起点 A' },
  { code: 'BracketRight', label: 'Shift+]', desc: '清空终点 B' },
  { code: 'KeyH', label: 'H', desc: '快捷键帮助' },
  { code: 'Comma', label: ',', desc: '修饰键配置' },
  { code: 'Period', label: '.', desc: '展开/收起面板' },
];

class HelpPanel {
  constructor() {
    this.el = null;
  }

  _ensure() {
    if (this.el) return;
    const overlay = document.createElement('div');
    overlay.className = 'vrz-modal-overlay hidden';
    const rows = ITEMS.map(
      (it) =>
        `<div class="vrz-help-row"><span class="vrz-help-key">${it.label}</span><span class="vrz-help-desc">${it.desc}</span></div>`
    ).join('');
    setHTML(overlay, `
      <div class="vrz-help" role="dialog" aria-modal="true">
        <div class="vrz-modal-title">快捷键提示</div>
        <div class="vrz-help-list">${rows}</div>
        <div class="vrz-modal-actions">
          <button class="vrz-modal-close">关闭</button>
        </div>
      </div>`);
    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) this.close();
    });
    overlay.querySelector('.vrz-modal-close').addEventListener('click', () => this.close());
    document.body.appendChild(overlay);
    this.el = overlay;
  }

  open() {
    this._ensure();
    this.el.classList.remove('hidden');
  }

  close() {
    if (this.el) this.el.classList.add('hidden');
  }

  toggle() {
    if (this.el && !this.el.classList.contains('hidden')) this.close();
    else this.open();
  }
}

export { HelpPanel };
