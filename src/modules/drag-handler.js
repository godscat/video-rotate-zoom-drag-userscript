/**
 * 拖拽模块 - 在 <video> 上拖拽平移
 *
 * 在 document 上以 capture 模式监听 pointerdown/pointermove/pointerup，
 * 比 mousedown 更早拦截（早于平台自身播放/暂停事件）。
 * 拖拽结束后用 click 守卫阻止平台误触。
 */

import { getLogger } from './logger.js';
import { checkModifiers } from './site-config.js';

class DragHandler {
  constructor(app) {
    this.app = app;
    this.logger = getLogger().createChild('DragHandler');

    this.state = {
      isDragging: false,
      startX: 0,
      startY: 0,
    };

    this._dragEndedAt = 0;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onPointerCancel = this._onPointerCancel.bind(this);

    // pointer 事件：最早拦截点
    document.addEventListener('pointerdown',  this._onPointerDown,  true);
    document.addEventListener('pointermove',  this._onPointerMove,  true);
    document.addEventListener('pointerup',    this._onPointerUp,    true);
    document.addEventListener('pointercancel',this._onPointerCancel,true);

    // click 守卫：拖拽刚结束时阻止平台误发暂停
    document.addEventListener('click', this._onClick, true);

    this.logger.info('拖拽监听已绑定（pointer + click guard）');
  }

  _checkModifier(e) {
    const drag = this.app.siteConfig && this.app.siteConfig.getDragConfig();
    if (!drag || !drag.enabled) return false;
    return checkModifiers(e, drag.modifiers);
  }

  _onPointerDown(e) {
    const video = this.app.activeVideo;
    const stage = this.app.stage;
    if (!video) return;
    if (e.button !== 0) return;
    if (!this._checkModifier(e)) return;

    const within =
      e.target === video ||
      (stage && (stage === e.target || stage.contains(e.target)));
    if (!within) return;
    if (e.target.closest && e.target.closest('button,[role="button"],a,input,select,textarea')) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const { offsetX, offsetY } = this.app.engine.getOffset();
    this.state.isDragging = true;
    this.state.startX = e.clientX - offsetX;
    this.state.startY = e.clientY - offsetY;

    this.app.engine.smooth = false;
    video.style.cursor = 'grabbing';

    this.logger.info(`开始拖拽 (${e.clientX}, ${e.clientY})`);
  }

  _onPointerMove(e) {
    if (!this.state.isDragging) return;
    e.preventDefault();
    e.stopPropagation();

    const offsetX = e.clientX - this.state.startX;
    const offsetY = e.clientY - this.state.startY;
    this.app.engine.setOffset(offsetX, offsetY);
  }

  _onPointerUp() {
    if (!this.state.isDragging) return;
    this.state.isDragging = false;

    const video = this.app.activeVideo;
    if (video) video.style.cursor = '';

    this.app.engine.smooth = true;
    this.app.engine.apply();

    // 记录拖拽结束时刻，click 守卫将拦截后续误触
    this._dragEndedAt = Date.now();
  }

  _onPointerCancel() {
    if (!this.state.isDragging) return;
    this._onPointerUp();
  }

  /** 拖拽刚结束时拦截 click（防止触发平台暂停） */
  _onClick(e) {
    if (this._dragEndedAt && (Date.now() - this._dragEndedAt < 400)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }

  destroy() {
    document.removeEventListener('pointerdown',   this._onPointerDown,  true);
    document.removeEventListener('pointermove',   this._onPointerMove,  true);
    document.removeEventListener('pointerup',     this._onPointerUp,    true);
    document.removeEventListener('pointercancel', this._onPointerCancel,true);
    document.removeEventListener('click',         this._onClick,        true);
  }
}

export { DragHandler };
