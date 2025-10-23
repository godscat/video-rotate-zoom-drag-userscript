import { formatText } from './config.js';

/**
 * 旋转控制模块 - 管理视频的旋转功能
 */
export class RotationController {
  /**
   * 初始化旋转控制
   * @param {VideoTransform} videoTransform - 视频变换实例
   * @param {HTMLElement} rotateLeftBtn - 左旋转按钮
   * @param {HTMLElement} rotateRightBtn - 右旋转按钮
   * @param {HTMLElement} resetBtn - 还原按钮
   * @param {HTMLElement} rotateIndicator - 旋转指示器
   * @param {Object} config - 配置对象
   */
  constructor(videoTransform, rotateLeftBtn, rotateRightBtn, resetBtn, rotateIndicator, config) {
    this.videoTransform = videoTransform;
    this.rotateLeftBtn = rotateLeftBtn;
    this.rotateRightBtn = rotateRightBtn;
    this.resetBtn = resetBtn;
    this.rotateIndicator = rotateIndicator;
    this.config = config;

    this._bindEvents();
    this._updateDisplay();
  }

  /**
   * 绑定事件监听器
   * @private
   */
  _bindEvents() {
    this.rotateLeftBtn.addEventListener("click", () => this._handleRotateLeft());
    this.rotateRightBtn.addEventListener("click", () => this._handleRotateRight());
    this.resetBtn.addEventListener("click", () => this._handleReset());
  }

  /**
   * 处理左旋转操作（逆时针）
   * @private
   */
  _handleRotateLeft() {
    const currentRotation = this.videoTransform.getRotation();
    const step = this.config.parameters.rotation.step;
    const newRotation = (currentRotation - step) % 360;
    this.videoTransform.setRotation(newRotation);
    this._updateDisplay();
  }

  /**
   * 处理右旋转操作（顺时针）
   * @private
   */
  _handleRotateRight() {
    const currentRotation = this.videoTransform.getRotation();
    const step = this.config.parameters.rotation.step;
    const newRotation = (currentRotation + step) % 360;
    this.videoTransform.setRotation(newRotation);
    this._updateDisplay();
  }

  /**
   * 处理还原操作
   * @private
   */
  _handleReset() {
    this.videoTransform.reset();
    this._updateDisplay();
  }

  /**
   * 更新旋转显示
   * @private
   */
  _updateDisplay() {
    const rotation = this.videoTransform.getRotation();
    this.rotateIndicator.textContent = formatText(this.config.uiText.formats.rotation, rotation);
  }

  /**
   * 程序化触发左旋转
   */
  rotateLeft() {
    this._handleRotateLeft();
  }

  /**
   * 程序化触发右旋转
   */
  rotateRight() {
    this._handleRotateRight();
  }

  /**
   * 程序化触发还原
   */
  reset() {
    this._handleReset();
  }

  /**
   * 设置旋转角度
   * @param {number} rotation - 目标旋转角度
   */
  setRotation(rotation) {
    this.videoTransform.setRotation(rotation);
    this._updateDisplay();
  }

  /**
   * 销毁事件监听器
   */
  destroy() {
    this.rotateLeftBtn.removeEventListener("click", this._handleRotateLeft);
    this.rotateRightBtn.removeEventListener("click", this._handleRotateRight);
    this.resetBtn.removeEventListener("click", this._handleReset);
  }
}