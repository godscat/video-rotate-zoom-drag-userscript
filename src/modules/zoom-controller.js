import { formatText } from './config.js';

/**
 * 缩放控制模块 - 管理视频的缩放功能
 */
export class ZoomController {
  /**
   * 初始化缩放控制
   * @param {VideoTransform} videoTransform - 视频变换实例
   * @param {HTMLElement} zoomOutBtn - 缩小按钮
   * @param {HTMLElement} zoomInBtn - 放大按钮
   * @param {HTMLElement} zoomDisplay - 缩放显示元素
   * @param {Object} config - 配置对象
   */
  constructor(videoTransform, zoomOutBtn, zoomInBtn, zoomDisplay, config) {
    this.videoTransform = videoTransform;
    this.zoomOutBtn = zoomOutBtn;
    this.zoomInBtn = zoomInBtn;
    this.zoomDisplay = zoomDisplay;
    this.config = config;

    this._bindEvents();
    this._updateDisplay();
  }

  /**
   * 绑定事件监听器
   * @private
   */
  _bindEvents() {
    this.zoomOutBtn.addEventListener("click", () => this._handleZoomOut());
    this.zoomInBtn.addEventListener("click", () => this._handleZoomIn());
  }

  /**
   * 处理缩小操作
   * @private
   */
  _handleZoomOut() {
    const currentZoom = this.videoTransform.getZoomLevel();
    const { min, step } = this.config.parameters.zoom;
    if (currentZoom > min) {
      this.videoTransform.setZoomLevel(currentZoom - step);
      this._updateDisplay();
    }
  }

  /**
   * 处理放大操作
   * @private
   */
  _handleZoomIn() {
    const currentZoom = this.videoTransform.getZoomLevel();
    const { max, step } = this.config.parameters.zoom;
    if (currentZoom < max) {
      this.videoTransform.setZoomLevel(currentZoom + step);
      this._updateDisplay();
    }
  }

  /**
   * 更新缩放显示
   * @private
   */
  _updateDisplay() {
    const zoomLevel = this.videoTransform.getZoomLevel();
    this.zoomDisplay.textContent = formatText(this.config.uiText.formats.zoom, zoomLevel);
  }

  /**
   * 程序化触发缩小
   */
  zoomOut() {
    this._handleZoomOut();
  }

  /**
   * 程序化触发放大
   */
  zoomIn() {
    this._handleZoomIn();
  }

  /**
   * 设置缩放级别
   * @param {number} zoomLevel - 目标缩放级别
   */
  setZoom(zoomLevel) {
    this.videoTransform.setZoomLevel(zoomLevel);
    this._updateDisplay();
  }

  /**
   * 销毁事件监听器
   */
  destroy() {
    this.zoomOutBtn.removeEventListener("click", this._handleZoomOut);
    this.zoomInBtn.removeEventListener("click", this._handleZoomIn);
  }
}