/**
 * UI 浮层模块 - 跟随视频位置的玻璃控制条
 *
 * 结构：
 *   .vrz-container (fixed, 跟随视频父元素 rect)
 *     .vrz-controls
 *       .vrz-bar        主栏：缩小/显示/放大 │ 左旋/右旋 │ 还原 │ 展开(»)
 *       .vrz-secondary  次级（默认隐藏）：方向组(↑↓←→, 长按连发) │ 配置/帮助/缩回
 *
 * 按钮提示：全部带 title（动作 + 快捷键）。
 */

import CONFIG, { formatText } from './config.js';

class UIOverlay {
  /**
   * @param {TransformEngine} transformEngine
   * @param {Object} callbacks - { onConfig, onHelp }
   */
  constructor(transformEngine, callbacks = {}) {
    this.engine = transformEngine;
    this.callbacks = callbacks;
    this.stage = null;
    this._expanded = false;

    this.container = document.createElement('div');
    this.container.className = 'vrz-container';

    this.controls = document.createElement('div');
    this.controls.className = 'vrz-controls hidden';
    this.container.appendChild(this.controls);

    this.bar = document.createElement('div');
    this.bar.className = 'vrz-bar';
    this.controls.appendChild(this.bar);

    this.secondary = document.createElement('div');
    this.secondary.className = 'vrz-secondary hidden';
    this.controls.appendChild(this.secondary);

    this._buildMain();
    this._buildSecondary();
    document.body.appendChild(this.container);

    this.engine.onChange = (state) => this.updateDisplay(state);
    this.updateDisplay(this.engine.getState());
  }

  _btn(label, title, onClick, extraClass = '') {
    const b = document.createElement('button');
    b.className = `vrz-btn ${extraClass}`.trim();
    b.innerHTML = label;
    b.title = title;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick(e);
    });
    return b;
  }

  _divider() {
    const d = document.createElement('div');
    d.className = 'vrz-divider';
    return d;
  }

  /**
   * 长按连发：按下立即触发一次，400ms 后每 60ms 重复
   */
  _repeatable(label, title, action) {
    const b = document.createElement('button');
    b.className = 'vrz-btn';
    b.innerHTML = label;
    b.title = title;

    let startTimer = null;
    let repeatTimer = null;

    const trigger = () => action();
    const stop = () => {
      if (startTimer) { clearTimeout(startTimer); startTimer = null; }
      if (repeatTimer) { clearInterval(repeatTimer); repeatTimer = null; }
    };
    const start = (e) => {
      e.stopPropagation();
      e.preventDefault();
      trigger();
      startTimer = setTimeout(() => {
        repeatTimer = setInterval(trigger, 60);
      }, 400);
    };

    b.addEventListener('mousedown', start);
    b.addEventListener('mouseup', stop);
    b.addEventListener('mouseleave', stop);
    b.addEventListener('touchstart', start, { passive: false });
    b.addEventListener('touchend', stop);
    b.addEventListener('touchcancel', stop);
    return b;
  }

  _buildMain() {
    // 缩小 / 显示 / 放大
    this.bar.appendChild(this._btn('−', '缩小 (Shift + -)', () => this.engine.zoomOut()));

    this.display = document.createElement('div');
    this.display.className = 'vrz-display';
    this.bar.appendChild(this.display);

    this.bar.appendChild(this._btn('+', '放大 (Shift + +)', () => this.engine.zoomIn()));

    this.bar.appendChild(this._divider());

    // 左旋转 / 右旋转
    this.bar.appendChild(this._btn('↺', '向左旋转 90° (Shift + L)', () => this.engine.rotateLeft()));
    this.bar.appendChild(this._btn('↻', '向右旋转 90° (Shift + R)', () => this.engine.rotateRight()));

    this.bar.appendChild(this._divider());

    // 还原
    this.bar.appendChild(this._btn('还原', '还原视频 (Shift + 0)', () => this.engine.reset(), 'vrz-reset'));

    // 展开
    this.expandBtn = this._btn('»', '展开更多按钮', () => this.toggleExpand());
    this.bar.appendChild(this.expandBtn);
  }

  _buildSecondary() {
    const step = CONFIG.move.stepSize;

    // 方向组
    const group = document.createElement('div');
    group.className = 'vrz-group';
    group.appendChild(this._repeatable('↑', '上移 (Shift + ↑)', () => this.engine.move(0, -step)));
    group.appendChild(this._repeatable('↓', '下移 (Shift + ↓)', () => this.engine.move(0, step)));
    group.appendChild(this._repeatable('←', '左移 (Shift + ←)', () => this.engine.move(-step, 0)));
    group.appendChild(this._repeatable('→', '右移 (Shift + →)', () => this.engine.move(step, 0)));
    this.secondary.appendChild(group);

    this.secondary.appendChild(this._divider());

    // 工具组
    const tools = document.createElement('div');
    tools.className = 'vrz-group';
    tools.appendChild(this._btn('⚙', '配置修饰键', () => this.callbacks.onConfig && this.callbacks.onConfig()));
    tools.appendChild(this._btn('?', '快捷键提示', () => this.callbacks.onHelp && this.callbacks.onHelp()));
    this.collapseBtn = this._btn('«', '收起面板', () => this.toggleExpand());
    tools.appendChild(this.collapseBtn);
    this.secondary.appendChild(tools);
  }

  toggleExpand() {
    this._expanded = !this._expanded;
    this.secondary.classList.toggle('hidden', !this._expanded);
    this.expandBtn.title = this._expanded ? '收起更多按钮' : '展开更多按钮';
  }

  updateDisplay(state) {
    if (!this.display) return;
    this.display.textContent = formatText('{value}%', state.zoomLevel);
  }

  attach(stage) {
    this.stage = stage;
    this.reposition();
    this.show();
  }

  detach() {
    this.stage = null;
    this.hide();
  }

  reposition(rect) {
    if (!this.stage && !rect) return;
    const r = rect || this.stage.getBoundingClientRect();
    if (!r.width && !r.height) return;
    this.container.style.top = r.top + 'px';
    this.container.style.left = r.left + 'px';
    this.container.style.width = r.width + 'px';
    this.container.style.height = r.height + 'px';
  }

  show() {
    this.controls.classList.remove('hidden');
  }

  hide() {
    this.controls.classList.add('hidden');
  }

  isVisible() {
    return !this.controls.classList.contains('hidden');
  }
}

export { UIOverlay };
