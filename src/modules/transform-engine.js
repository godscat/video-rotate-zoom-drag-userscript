/**
 * 变换引擎 - 唯一的状态真相源
 *
 * 职责：
 *  1. 持有 zoom / rotation / offset 状态
 *  2. 通过动态 <style> 标签把变换应用到 <video> 元素本身（不污染 inline style）
 *  3. 90°/270° 旋转时按 object-fit:contain 反推缩放，避免黑边/裁剪
 *  4. ResizeObserver 监听视频尺寸变化，实时重算旋转缩放
 *
 * 对外方法：zoomIn/zoomOut/setZoom, rotateLeft/rotateRight, move, reset, attach/detach
 * 回调：onChange(state) - 每次 apply 后触发，供 UI 更新显示
 */

import CONFIG, { formatText } from './config.js';
import { getLogger } from './logger.js';

class TransformEngine {
  constructor() {
    this.config = CONFIG;
    this.logger = getLogger().createChild('TransformEngine');

    this.video = null;
    this.styleEl = null;

    // 拖拽时关闭过渡动画，避免跟手延迟
    this.smooth = true;

    this.state = {
      zoomLevel: CONFIG.zoom.default,
      rotation: CONFIG.rotation.default,
      offsetX: 0,
      offsetY: 0,
    };

    // 当视频尺寸变化时重算旋转缩放（仅旋转 90°/270° 时有意义）
    this.resizeObserver = new ResizeObserver(() => {
      if (this.state.rotation % 180 !== 0) this.apply();
    });
  }

  /**
   * 绑定到目标 <video>
   */
  attach(video) {
    if (!video) return;
    this.detach();

    this.video = video;
    this.reset();
    this.resizeObserver.observe(video);
    this.logger.info('已绑定 video 元素');
  }

  /**
   * 解绑：清除变换与监听
   */
  detach() {
    if (this.video) {
      this.video.removeAttribute('data-vrz-active');
      this.video = null;
    }
    this.resizeObserver.disconnect();

    if (this.styleEl) {
      this.styleEl.textContent = '';
    }
  }

  /**
   * 计算旋转 90°/270° 时所需的 contain 缩放比例
   * 核心公式来自 chimo-chimo-loop.calculateScale：
   *  1. 原始 contain 缩放比 k1 = min(cw/vw, ch/vh)
   *  2. 实际绘制尺寸 paintedW/H = vw/vh * k1
   *  3. 旋转后宽高互换 rotatedW = paintedH, rotatedH = paintedW
   *  4. 重新填满容器 scale = min(cw/rotatedW, ch/rotatedH)
   */
  calculateScale(v) {
    const cw = v.clientWidth || (v.parentElement && v.parentElement.clientWidth) || 0;
    const ch = v.clientHeight || (v.parentElement && v.parentElement.clientHeight) || 0;
    const vw = v.videoWidth;
    const vh = v.videoHeight;
    if (!vw || !vh || !cw || !ch) return 1;

    const k1 = Math.min(cw / vw, ch / vh);
    const paintedW = vw * k1;
    const paintedH = vh * k1;
    const rotatedW = paintedH;
    const rotatedH = paintedW;
    const sx = cw / rotatedW;
    const sy = ch / rotatedH;
    return Math.min(sx, sy);
  }

  /**
   * 应用变换到当前 video（通过动态 style 标签 + 属性选择器）
   */
  apply() {
    const v = this.video;
    if (!v) return;

    const { zoomLevel, rotation, offsetX, offsetY } = this.state;
    const userZoom = zoomLevel / 100;
    const rotScale = rotation % 180 !== 0 ? this.calculateScale(v) : 1;
    const totalScale = rotScale * userZoom;

    const hasTransform =
      rotation !== 0 || zoomLevel !== CONFIG.zoom.default || offsetX !== 0 || offsetY !== 0;

    if (!hasTransform) {
      v.removeAttribute('data-vrz-active');
      if (this.styleEl) this.styleEl.textContent = '';
      this._emitChange();
      return;
    }

    v.setAttribute('data-vrz-active', 'true');

    if (!this.styleEl) {
      this.styleEl = document.createElement('style');
      this.styleEl.id = 'vrz-dynamic-transform';
      (document.head || document.documentElement).appendChild(this.styleEl);
    }

    const transition = this.smooth ? 'transition: transform 0.2s ease-out !important;' : '';
    this.styleEl.textContent = `
      video[data-vrz-active="true"] {
        transform: translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg) scale(${totalScale}) !important;
        transform-origin: center center !important;
        ${transition}
      }
    `;

    this._emitChange();
  }

  _emitChange() {
    if (typeof this.onChange === 'function') {
      this.onChange({ ...this.state });
    }
  }

  // ---- 缩放 ----
  zoomIn() {
    const { max, step } = CONFIG.zoom;
    this.state.zoomLevel = Math.min(max, this.state.zoomLevel + step);
    this.apply();
  }

  zoomOut() {
    const { min, step } = CONFIG.zoom;
    this.state.zoomLevel = Math.max(min, this.state.zoomLevel - step);
    this.apply();
  }

  setZoom(zoomLevel) {
    const { min, max } = CONFIG.zoom;
    this.state.zoomLevel = Math.max(min, Math.min(max, zoomLevel));
    this.apply();
  }

  // ---- 旋转（双向）----
  rotateLeft() {
    const step = CONFIG.rotation.step;
    this.state.rotation = (this.state.rotation - step) % 360;
    this.apply();
  }

  rotateRight() {
    const step = CONFIG.rotation.step;
    this.state.rotation = (this.state.rotation + step) % 360;
    this.apply();
  }

  // ---- 平移 ----
  move(dx, dy) {
    this.state.offsetX += dx;
    this.state.offsetY += dy;
    this.apply();
  }

  setOffset(x, y) {
    this.state.offsetX = x;
    this.state.offsetY = y;
    this.apply();
  }

  // ---- 还原 ----
  reset() {
    this.state = {
      zoomLevel: CONFIG.zoom.default,
      rotation: CONFIG.rotation.default,
      offsetX: 0,
      offsetY: 0,
    };
    this.apply();
  }

  // ---- 读取 ----
  getState() {
    return { ...this.state };
  }

  getZoomLevel() {
    return this.state.zoomLevel;
  }

  getRotation() {
    return this.state.rotation;
  }

  getOffset() {
    return { offsetX: this.state.offsetX, offsetY: this.state.offsetY };
  }
}

export { TransformEngine };
