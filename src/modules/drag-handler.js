/**
 * 拖拽模块 - 在 <video> 上拖拽平移
 *
 * 新架构：在 document 上全局监听，通过 app.activeVideo 获取当前视频，
 * 无需在每次切换视频时重新绑定。
 *
 * 平移直接写入 TransformEngine 的 offset；拖拽期间关闭过渡动画以保证跟手。
 */

import { getLogger } from './logger.js';
import { checkModifiers } from './site-config.js';

class DragHandler {
  /**
   * @param {Object} app - App 实例（提供 get activeVideo / get engine）
   */
  constructor(app) {
    this.app = app;
    this.logger = getLogger().createChild('DragHandler');

    this.state = {
      isDragging: false,
      startX: 0,
      startY: 0,
    };

    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);

    document.addEventListener('mousedown', this._onMouseDown, true);
    document.addEventListener('mousemove', this._onMouseMove, true);
    document.addEventListener('mouseup', this._onMouseUp, true);

    this.logger.info('拖拽监听已绑定（document）');
  }

  _checkModifier(e) {
    const drag = this.app.siteConfig && this.app.siteConfig.getDragConfig();
    if (!drag || !drag.enabled) return false;
    return checkModifiers(e, drag.modifiers);
  }

  _onMouseDown(e) {
    const video = this.app.activeVideo;
    const stage = this.app.stage;
    if (!video) return;
    if (e.button !== 0) return;
    if (!this._checkModifier(e)) return;

    // 仅在视频显示区域（stage）内触发；排除按钮等交互控件
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

    // 关闭过渡动画，跟手
    this.app.engine.smooth = false;
    video.style.cursor = 'grabbing';

    this.logger.info(`开始拖拽 (${e.clientX}, ${e.clientY})`);
  }

  _onMouseMove(e) {
    if (!this.state.isDragging) return;
    e.preventDefault();
    e.stopPropagation();

    const offsetX = e.clientX - this.state.startX;
    const offsetY = e.clientY - this.state.startY;
    this.app.engine.setOffset(offsetX, offsetY);
  }

  _onMouseUp() {
    if (!this.state.isDragging) return;
    this.state.isDragging = false;

    const video = this.app.activeVideo;
    if (video) video.style.cursor = '';

    // 恢复过渡动画
    this.app.engine.smooth = true;
    this.app.engine.apply();
  }

  destroy() {
    document.removeEventListener('mousedown', this._onMouseDown, true);
    document.removeEventListener('mousemove', this._onMouseMove, true);
    document.removeEventListener('mouseup', this._onMouseUp, true);
  }
}

export { DragHandler };
