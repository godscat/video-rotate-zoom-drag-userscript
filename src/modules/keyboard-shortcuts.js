/**
 * 键盘快捷键模块
 *
 * 匹配方式：mod（修饰键）+ e.code（物理按键码）
 * 使用 e.code 可避免 Shift 组合键产生的字符变化问题
 * （例如 Shift + "-" 实际产生 "_"，但 e.code 始终为 "Minus"）。
 *
 * 忽略输入框中的按键，避免与文本输入冲突。
 */

import CONFIG from './config.js';
import { getLogger } from './logger.js';

class KeyboardShortcuts {
  /**
   * @param {Object} app - App 实例
   */
  constructor(app) {
    this.app = app;
    this.logger = getLogger().createChild('KeyboardShortcuts');
    this._onKeyDown = this._onKeyDown.bind(this);

    document.addEventListener('keydown', this._onKeyDown, true);
    this.logger.info('键盘快捷键已绑定');
  }

  _match(e, sc) {
    if (!sc) return false;
    const mod = sc.mod;
    let modOk = true;
    switch ((mod || 'none').toLowerCase()) {
      case 'ctrl':
        modOk = e.ctrlKey;
        break;
      case 'shift':
        modOk = e.shiftKey;
        break;
      case 'alt':
        modOk = e.altKey;
        break;
      case 'none':
        modOk = !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey;
        break;
      default:
        modOk = true;
    }
    if (!modOk) return false;
    return e.code === sc.code;
  }

  _inInput(e) {
    const t = e.target;
    if (!t) return false;
    const tag = t.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable;
  }

  _onKeyDown(e) {
    if (this._inInput(e)) return;
    if (!this.app.activeVideo) return;

    const sc = CONFIG.shortcuts;
    const engine = this.app.engine;
    if (!engine) return;

    // 缩放
    if (this._match(e, sc.zoomIn)) {
      e.preventDefault();
      engine.zoomIn();
    } else if (this._match(e, sc.zoomOut)) {
      e.preventDefault();
      engine.zoomOut();
    }
    // 旋转
    else if (this._match(e, sc.rotateLeft)) {
      e.preventDefault();
      engine.rotateLeft();
    } else if (this._match(e, sc.rotateRight)) {
      e.preventDefault();
      engine.rotateRight();
    }
    // 还原
    else if (this._match(e, sc.reset)) {
      e.preventDefault();
      engine.reset();
    }
    // 全屏（原生 API，作用于视频元素）
    else if (this._match(e, sc.fullscreen)) {
      e.preventDefault();
      this._toggleFullscreen();
    }
    // 移动
    else if (this._match(e, sc.moveUp)) {
      e.preventDefault();
      engine.move(0, -CONFIG.move.stepSize);
    } else if (this._match(e, sc.moveDown)) {
      e.preventDefault();
      engine.move(0, CONFIG.move.stepSize);
    } else if (this._match(e, sc.moveLeft)) {
      e.preventDefault();
      engine.move(-CONFIG.move.stepSize, 0);
    } else if (this._match(e, sc.moveRight)) {
      e.preventDefault();
      engine.move(CONFIG.move.stepSize, 0);
    }
    // A-B 循环清空（Shift 版优先）
    else if (this._match(e, sc.abClearA)) {
      e.preventDefault();
      const ab = this.app.abLoop;
      if (ab) ab.clearA();
    } else if (this._match(e, sc.abClearB)) {
      e.preventDefault();
      const ab = this.app.abLoop;
      if (ab) ab.clearB();
    }
    // A-B 循环设置 / 开关
    else if (this._match(e, sc.abSetA)) {
      e.preventDefault();
      const ab = this.app.abLoop;
      if (ab) ab.setA();
    } else if (this._match(e, sc.abSetB)) {
      e.preventDefault();
      const ab = this.app.abLoop;
      if (ab) ab.setB();
    } else if (this._match(e, sc.abToggle)) {
      e.preventDefault();
      const ab = this.app.abLoop;
      if (ab) ab.toggleLoop();
    }
    // 帮助 / 配置 / 展开
    else if (this._match(e, sc.showHelp)) {
      e.preventDefault();
      if (this.app.helpPanel) this.app.helpPanel.toggle();
    } else if (this._match(e, sc.showConfig)) {
      e.preventDefault();
      if (this.app.configPanel) this.app.configPanel.toggle();
    } else if (this._match(e, sc.toggleExpand)) {
      e.preventDefault();
      if (this.app.ui) this.app.ui.toggleExpand();
    }
  }

  _toggleFullscreen() {
    const video = this.app.activeVideo;
    if (!video) return;
    const el =
      this.app.stage ||
      video.parentElement ||
      video;
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } catch (err) {
      this.logger.warn('全屏切换失败', err);
    }
  }

  destroy() {
    document.removeEventListener('keydown', this._onKeyDown, true);
  }
}

export { KeyboardShortcuts };
