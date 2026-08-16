/**
 * UI 浮层模块 - 跟随视频位置的玻璃控制条
 *
 * 结构：
 *   .vrz-container (fixed, 跟随视频父元素 rect)
 *     .vrz-controls
 *       .vrz-main-bar        主栏：缩小/显示/放大 │ 左旋/右旋 │ 还原 │ 展开(»)
 *       .vrz-secondary-bar  次级（默认隐藏）：方向组(↑↓←→, 长按连发) │ 配置/帮助/缩回
 *
 * 按钮提示：全部带 title（动作 + 快捷键）。
 */

import config from './config.js';
import { formatTime } from './util.js';

class UIOverlay {
  /**
   * @param {TransformEngine} transformEngine
   * @param {ABLoop} abLoop
   * @param {Object} callbacks - { onConfig, onHelp }
   */
  constructor(transformEngine, abLoop, callbacks = {}) {
    this.engine = transformEngine;
    this.abLoop = abLoop;
    this.callbacks = callbacks;
    this.stage = null;
    this._video = null;
    this._rateChangeHandler = null;
    this._expanded = false;

    this.container = document.createElement('div');
    this.container.className = 'vrz-container';

    this.controls = document.createElement('div');
    this.controls.className = 'vrz-controls hidden';
    this.container.appendChild(this.controls);

    this.mainBar = document.createElement('div');
    this.mainBar.className = 'vrz-bar vrz-main-bar';
    this.controls.appendChild(this.mainBar);

    this.secondaryBar = document.createElement('div');
    this.secondaryBar.className = 'vrz-bar vrz-secondary-bar hidden';
    this.controls.appendChild(this.secondaryBar);

    this._buildMain();
    this._buildSecondary();
    document.body.appendChild(this.container);

    this.engine.onChange = (state) => this.updateDisplay(state);
    this.updateDisplay(this.engine.getState());
    this.setWake(false);
  }

  _btn(label, title, onClick, extraClass = '') {
    const b = document.createElement('button');
    // label = 'icon:boxicons--move' -> appendChild <span class="boxicons--move"></span>
    // label = 'pure text' -> textContent  = 'pure text'
    if (label.startsWith('icon:')) {
      const icon = document.createElement('span');
      icon.className = label.slice(5);
      b.appendChild(icon);
    } else {
      b.textContent = label;
    }

    b.className = `vrz-btn ${extraClass}`.trim();
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
    b.textContent = label;
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
    this.mainBar.appendChild(this._btn('−', '缩小 (Shift + -)', () => this.engine.zoomOut()));

    // 缩放档位下拉（点击展开 zoom levels）
    this.mainBar.appendChild(this._buildZoom());

    this.mainBar.appendChild(this._btn('+', '放大 (Shift + +)', () => this.engine.zoomIn()));

    // 倍速选择器
    this.mainBar.appendChild(this._buildSpeed());

    this.mainBar.appendChild(this._divider());

    // 左旋转 / 右旋转
    this.mainBar.appendChild(this._btn('↺', '向左旋转 90° (Shift + L)', () => this.engine.rotateLeft()));
    this.mainBar.appendChild(this._btn('↻', '向右旋转 90° (Shift + R)', () => this.engine.rotateRight()));

    this.mainBar.appendChild(this._divider());

    // 还原
    this.mainBar.appendChild(this._btn('R', '还原视频 (Shift + 0)', () => this.engine.reset(), 'vrz-reset'));

    // 展开
    this.expandBtn = this._btn('»', '展开更多按钮', () => this.toggleExpand());
    this.mainBar.appendChild(this.expandBtn);
  }

  _buildSecondary() {
    // 方向组：四向箭头图标，点击弹出方向菜单
    this.secondaryBar.appendChild(this._buildMove());

    this.secondaryBar.appendChild(this._divider());

    // A-B 循环组
    this.secondaryBar.appendChild(this._buildAB());

    this.secondaryBar.appendChild(this._divider());

    // 工具组
    const tools = document.createElement('div');
    tools.className = 'vrz-group';
    tools.appendChild(this._btn('⚙', '配置修饰键', () => this.callbacks.onConfig && this.callbacks.onConfig()));
    tools.appendChild(this._btn('?', '快捷键提示', () => this.callbacks.onHelp && this.callbacks.onHelp()));
    this.collapseBtn = this._btn('«', '收起面板', () => this.toggleExpand());
    tools.appendChild(this.collapseBtn);
    this.secondaryBar.appendChild(tools);
  }

  _buildMove() {
    const step = config.move.stepSize;
    this.moveWrap = document.createElement('div');
    this.moveWrap.className = 'vrz-move-wrap';

    const moveBtn = this._btn('icon:boxicons--move', '移动视频', (e) => {
      e.stopPropagation();
      this._toggleMoveMenu();
    });
    this.moveWrap.appendChild(moveBtn);

    this.moveMenu = document.createElement('div');
    this.moveMenu.className = 'vrz-move-menu hidden';

    const up = this._repeatable('↑', '上移 (Shift + ↑)', () => this.engine.move(0, -step));
    up.style.gridArea = '1 / 2';
    const down = this._repeatable('↓', '下移 (Shift + ↓)', () => this.engine.move(0, step));
    down.style.gridArea = '3 / 2';
    const left = this._repeatable('←', '左移 (Shift + ←)', () => this.engine.move(-step, 0));
    left.style.gridArea = '2 / 1';
    const right = this._repeatable('→', '右移 (Shift + →)', () => this.engine.move(step, 0));
    right.style.gridArea = '2 / 3';

    this.moveMenu.appendChild(up);
    this.moveMenu.appendChild(left);
    this.moveMenu.appendChild(right);
    this.moveMenu.appendChild(down);
    this.moveWrap.appendChild(this.moveMenu);

    this._moveDocClick = (e) => {
      if (!this.moveWrap.contains(e.target)) this._closeMoveMenu();
    };
    document.addEventListener('mousedown', this._moveDocClick);

    return this.moveWrap;
  }

  _buildAB() {
    const group = document.createElement('div');
    group.className = 'vrz-group vrz-ab';

    this.btnA = this._btn('A', '设置循环起点 A（Shift+点击清空；悬停微调）', (e) => {
      e.shiftKey ? this.abLoop.clearA() : this.abLoop.setA();
    }, 'vrz-ab-mark');
    this.btnB = this._btn('B', '设置循环终点 B（Shift+点击清空；悬停微调）', (e) => {
      e.shiftKey ? this.abLoop.clearB() : this.abLoop.setB();
    }, 'vrz-ab-mark');
    this.btnL = this._btn('L', '开始 A-B 循环（仅设 B 也可，A 默认 0）', () => this.abLoop.toggleLoop(), 'vrz-ab-loop');

    group.appendChild(this._buildABFineTune(this.btnA, 'start'));
    group.appendChild(this._buildABFineTune(this.btnB, 'end'));
    group.appendChild(this.btnL);

    this.abLoop.onChange = (st) => this._updateAB(st);
    this._updateAB(this.abLoop.getState());
    return group;
  }

  /** A/B 悬停微调器：[-5s][-1s][-0.1s][+0.1s][+1s][+5s] */
  _buildABFineTune(btn, kind) {
    const wrap = document.createElement('div');
    wrap.className = 'vrz-ab-wrap';

    const menu = document.createElement('div');
    menu.className = 'vrz-ab-fine hidden';
    const DELTAS = [-5, -1, -0.1, 0.1, 1, 5];
    DELTAS.forEach((delta) => {
      const b = document.createElement('button');
      b.className = 'vrz-fine-btn';
      b.textContent = (delta > 0 ? '+' : '') + delta + 's';
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        if (kind === 'start') this.abLoop.nudgeStart(delta);
        else this.abLoop.nudgeEnd(delta);
      });
      menu.appendChild(b);
    });

    let hideTimer = null;
    const show = () => { clearTimeout(hideTimer); menu.classList.remove('hidden'); };
    const hide = () => { clearTimeout(hideTimer); hideTimer = setTimeout(() => menu.classList.add('hidden'), 250); };
    wrap.addEventListener('mouseenter', show);
    wrap.addEventListener('mouseleave', hide);
    menu.addEventListener('mouseenter', show);
    menu.addEventListener('mouseleave', hide);

    wrap.appendChild(btn);
    wrap.appendChild(menu);
    return wrap;
  }

  _updateAB(st) {
    const a = st.startTime;
    const b = st.endTime;
    this.btnA.textContent = a != null ? `A [${formatTime(a)}]` : 'A';
    this.btnB.textContent = b != null ? `B [${formatTime(b)}]` : 'B';
    this.btnL.textContent = st.isLooping ? 'S' : 'L';
    this.btnL.title = st.isLooping ? '停止循环' : '开始 A-B 循环（仅设 B 也可，A 默认 0）';
    this.btnL.classList.toggle('vrz-on', st.isLooping);
    // 仅设置 B 即可循环（A 默认 0）；B 必须 > 0；正在循环时保持可用（用于停止）
    this.btnL.disabled = !st.isLooping && !(b != null && b > 0 && (a == null || b > a));
  }

  toggleExpand() {
    this._expanded = !this._expanded;
    this.secondaryBar.classList.toggle('hidden', !this._expanded);
    this.expandBtn.title = this._expanded ? '收起更多按钮' : '展开更多按钮';
  }

  updateDisplay(state) {
    if (this.zoomBtn) this.zoomBtn.textContent = `${state.zoomLevel}%`;
    if (this.zoomMenu) {
      this.zoomMenu.querySelectorAll('.vrz-zoom-item').forEach((item) => {
        item.classList.toggle('active', Number(item.dataset.level) === state.zoomLevel);
      });
    }
  }

  _buildZoom() {
    this.zoomWrap = document.createElement('div');
    this.zoomWrap.className = 'vrz-zoom-wrap';

    this.zoomBtn = document.createElement('button');
    this.zoomBtn.className = 'vrz-btn vrz-zoom-btn';
    this.zoomBtn.textContent = '100%';
    this.zoomBtn.title = '缩放档位（点击选择）';
    this.zoomBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleZoomMenu();
    });
    this.zoomWrap.appendChild(this.zoomBtn);

    this.zoomMenu = document.createElement('div');
    this.zoomMenu.className = 'vrz-zoom-menu hidden';
    config.zoom.levels.forEach((lv) => {
      const item = document.createElement('div');
      item.className = 'vrz-zoom-item';
      item.textContent = `${lv}%`;
      item.dataset.level = lv;
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.engine.setZoom(lv);
        this._closeZoomMenu();
      });
      this.zoomMenu.appendChild(item);
    });
    this.zoomWrap.appendChild(this.zoomMenu);

    this._zoomDocClick = (e) => {
      if (!this.zoomWrap.contains(e.target)) this._closeZoomMenu();
    };
    document.addEventListener('mousedown', this._zoomDocClick);

    return this.zoomWrap;
  }

  _toggleZoomMenu() {
    if (!this.zoomMenu) return;
    if (this.zoomMenu.classList.contains('hidden')) {
      this.zoomMenu.classList.remove('hidden');
    } else {
      this._closeZoomMenu();
    }
  }

  _closeZoomMenu() {
    if (this.zoomMenu) this.zoomMenu.classList.add('hidden');
  }

  _toggleMoveMenu() {
    if (!this.moveMenu) return;
    if (this.moveMenu.classList.contains('hidden')) {
      this.moveMenu.classList.remove('hidden');
    } else {
      this._closeMoveMenu();
    }
  }

  _closeMoveMenu() {
    if (this.moveMenu) this.moveMenu.classList.add('hidden');
  }

  attach(stage, video) {
    this.stage = stage;
    this._detachRate();
    this._video = video || null;
    if (video) {
      this._rateChangeHandler = () => this._updateSpeedLabel();
      video.addEventListener('ratechange', this._rateChangeHandler);
      this._updateSpeedLabel();
    }
    this.reposition();
    this.show();
  }

  detach() {
    this._detachRate();
    this._video = null;
    this.stage = null;
    this.hide();
  }

  destroy() {
    this.detach();
    if (this._moveDocClick) document.removeEventListener('mousedown', this._moveDocClick);
    if (this._zoomDocClick) document.removeEventListener('mousedown', this._zoomDocClick);
    if (this._docClick) document.removeEventListener('mousedown', this._docClick);
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  _detachRate() {
    if (this._video && this._rateChangeHandler) {
      this._video.removeEventListener('ratechange', this._rateChangeHandler);
      this._rateChangeHandler = null;
    }
  }

  reposition(stageRect) {
    if (!this.stage && !stageRect) return;
    const r = stageRect || this.stage.getBoundingClientRect();
    if (!r.width && !r.height) return;
    this.container.style.top = r.top + 'px';
    this.container.style.left = r.left + 'px';
    this.container.style.width = r.width + 'px';
    this.container.style.height = r.height + 'px';
    // 工具条偏移（A 方案，全局配置）
    this.controls.style.top = (config.ui.verticalOffset || 0) + 'px';
    this.controls.style.left = (config.ui.horizontalOffset || 0) + 'px';
  }

  /** 全屏时把容器移入全屏元素（否则 body 下的 fixed 浮层不可见），退出时移回 body */
  syncFullscreen() {
    const fe = document.fullscreenElement || document.webkitFullscreenElement;
    if (fe) {
      if (this.container.parentNode !== fe) fe.appendChild(this.container);
    } else if (this.container.parentNode !== document.body) {
      document.body.appendChild(this.container);
    }
    this.reposition();
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

  /** 全局唤醒固定显示：增强对比度（背景不透明度 --vrz-wake-alpha，由 config.ui.wakeBgAlpha 控制） */
  setWake(active) {
    this.container.classList.toggle('vrz-wake', !!active);
    this.container.style.setProperty(
      '--vrz-wake-alpha',
      String(config.ui.wakeBgAlpha != null ? config.ui.wakeBgAlpha : 0.6)
    );
  }

  /** 是否有弹出菜单处于打开状态（缩放档位/倍速/移动/AB 微调），此时不隐藏工具条 */
  hasOpenPopup() {
    const open = (el) => el && !el.classList.contains('hidden');
    return (
      open(this.zoomMenu) ||
      open(this.speedMenu) ||
      open(this.moveMenu) ||
      (this.container && !!this.container.querySelector('.vrz-ab-fine:not(.hidden)'))
    );
  }

  _buildSpeed() {
    this.speedWrap = document.createElement('div');
    this.speedWrap.className = 'vrz-speed-wrap';

    this.speedBtn = document.createElement('button');
    this.speedBtn.className = 'vrz-btn vrz-speed-btn';
    this.speedBtn.textContent = '1×';
    this.speedBtn.title = '倍速播放';
    this.speedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleSpeedMenu();
    });
    this.speedWrap.appendChild(this.speedBtn);

    this.speedMenu = document.createElement('div');
    this.speedMenu.className = 'vrz-speed-menu hidden';
    config.playbackSpeeds.forEach((s) => {
      const item = document.createElement('div');
      item.className = 'vrz-speed-item';
      item.textContent = this._speedLabel(s);
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this._video) this._video.playbackRate = s;
        this._closeSpeedMenu();
      });
      this.speedMenu.appendChild(item);
    });
    this.speedWrap.appendChild(this.speedMenu);

    this._docClick = (e) => {
      if (!this.speedWrap.contains(e.target)) this._closeSpeedMenu();
    };
    document.addEventListener('mousedown', this._docClick);

    return this.speedWrap;
  }

  _speedLabel(rate) {
    if (rate === 1) return '1×';
    return `${rate}×`;
  }

  _updateSpeedLabel() {
    if (!this.speedBtn || !this._video) return;
    const rate = this._video.playbackRate;
    this.speedBtn.textContent = this._speedLabel(rate);
    this.speedBtn.title = `倍速播放（${rate}×）`;
    if (this.speedMenu) {
      this.speedMenu.querySelectorAll('.vrz-speed-item').forEach((item) => {
        item.classList.toggle('active', parseFloat(item.textContent) === rate);
      });
    }
  }

  _toggleSpeedMenu() {
    if (!this.speedMenu) return;
    if (this.speedMenu.classList.contains('hidden')) {
      this._updateSpeedLabel();
      this.speedMenu.classList.remove('hidden');
    } else {
      this._closeSpeedMenu();
    }
  }

  _closeSpeedMenu() {
    if (this.speedMenu) this.speedMenu.classList.add('hidden');
  }
}

export { UIOverlay };
