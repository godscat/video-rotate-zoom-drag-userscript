/**
 * 视频变换模块 - 管理视频的缩放、旋转和平移变换
 */
export class VideoTransform {
  constructor(config) {
    this.config = config;
    this.videoContainer = this._getVideoContainer();
    this.state = {
      zoomLevel: config.parameters.zoom.default,
      rotation: config.parameters.rotation.default,
      offsetX: 0,
      offsetY: 0,
    };

    if (this.videoContainer) {
      this.applyTransform();
    }
  }

  /**
   * 获取视频容器元素
   * @private
   * @returns {HTMLElement|null} 视频容器元素
   */
  _getVideoContainer() {
    return document.querySelector(this.config.selectors.videoContainer);
  }

  /**
   * 应用变换到视频容器
   */
  applyTransform() {
    if (!this.videoContainer) return;

    const { zoomLevel, rotation, offsetX, offsetY } = this.state;

    this.videoContainer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${
      zoomLevel / 100
    }) rotate(${rotation}deg)`;
    this.videoContainer.style.transformOrigin = "center center";

    this._updateCursor();
  }

  /**
   * 更新鼠标指针样式
   * @private
   */
  _updateCursor() {
    const { zoomLevel } = this.state;
    if (zoomLevel > 100) {
      this.videoContainer.style.cursor = "grab";
    } else {
      this.videoContainer.style.cursor = "default";
    }
  }

  /**
   * 设置缩放级别
   * @param {number} zoomLevel - 缩放级别
   */
  setZoomLevel(zoomLevel) {
    const { min, max } = this.config.parameters.zoom;
    this.state.zoomLevel = Math.max(min, Math.min(max, zoomLevel));
    this.applyTransform();
  }

  /**
   * 设置旋转角度
   * @param {number} rotation - 旋转角度（度数）
   */
  setRotation(rotation) {
    this.state.rotation = rotation;
    this.applyTransform();
  }

  /**
   * 设置偏移量
   * @param {number} offsetX - X轴偏移量
   * @param {number} offsetY - Y轴偏移量
   */
  setOffset(offsetX, offsetY) {
    this.state.offsetX = offsetX;
    this.state.offsetY = offsetY;
    this.applyTransform();
  }

  /**
   * 重置所有变换状态
   */
  reset() {
    this.state = {
      zoomLevel: this.config.parameters.zoom.default,
      rotation: this.config.parameters.rotation.default,
      offsetX: 0,
      offsetY: 0,
    };
    this.applyTransform();
  }

  /**
   * 获取当前状态
   * @returns {Object} 当前变换状态
   */
  getState() {
    return { ...this.state };
  }

  /**
   * 获取缩放级别
   * @returns {number} 当前缩放级别
   */
  getZoomLevel() {
    return this.state.zoomLevel;
  }

  /**
   * 获取旋转角度
   * @returns {number} 当前旋转角度
   */
  getRotation() {
    return this.state.rotation;
  }

  /**
   * 获取偏移量
   * @returns {Object} 当前偏移量 {offsetX, offsetY}
   */
  getOffset() {
    return {
      offsetX: this.state.offsetX,
      offsetY: this.state.offsetY,
    };
  }

  /**
   * 检查是否可以拖拽
   * @returns {boolean} 是否可以拖拽
   */
  canDrag() {
    const { enableDragThreshold, dragThreshold } = this.config.parameters.zoom;
    return !enableDragThreshold || this.state.zoomLevel > dragThreshold;
  }
}
