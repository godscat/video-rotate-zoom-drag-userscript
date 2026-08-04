/**
 * 滚轮缩放模块 - 修饰键 + 滚轮 缩放视频
 *
 * 在 document 上全局监听 wheel（capture），仅在按住配置的修饰键时触发。
 */

import { getLogger } from './logger.js';
import { checkModifiers } from './site-config.js';

class WheelHandler {
  /**
   * @param {Object} app - App 实例（提供 get activeVideo / get engine）
   */
  constructor(app) {
    this.app = app;
    this.logger = getLogger().createChild('WheelHandler');
    this._onWheel = this._onWheel.bind(this);

    document.addEventListener('wheel', this._onWheel, { passive: false, capture: true });
    this.logger.info('滚轮缩放已绑定（document），修饰键按站点配置');
  }

  _checkModifier(e) {
    const zoom = this.app.siteConfig && this.app.siteConfig.getZoomConfig();
    if (!zoom || !zoom.enabled) return false;
    return checkModifiers(e, zoom.modifiers);
  }

  _onWheel(e) {
    if (!this.app.activeVideo) return;
    if (!this._checkModifier(e)) return;

    // 仅当鼠标位于视频或其父元素（stage）区域内时触发
    const target = e.target;
    const video = this.app.activeVideo;
    const stage = this.app.stage;
    const within =
      (video && (video === target || video.contains(target))) ||
      (stage && (stage === target || stage.contains(target)));
    if (!within) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // deltaY 向下为正，向上缩放（放大）
    const delta = e.deltaY !== undefined ? -e.deltaY : e.wheelDelta || -e.detail;
    if (delta > 0) {
      this.app.engine.zoomIn();
    } else if (delta < 0) {
      this.app.engine.zoomOut();
    }
  }

  destroy() {
    document.removeEventListener('wheel', this._onWheel, { capture: true });
  }
}

export { WheelHandler };
