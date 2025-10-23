/**
 * 鼠标滚轮处理器 - 支持 Ctrl+滚轮缩放视频
 */
export class WheelHandler {
  /**
   * 初始化滚轮处理器
   * @param {ZoomController} zoomController - 缩放控制器
   * @param {Object} config - 配置对象
   */
  constructor(zoomController, config) {
    this.zoomController = zoomController;
    this.config = config;

    // 绑定事件处理器的 this 上下文
    this._handleWheel = this._handleWheel.bind(this);

    // 是否已启用
    this.isEnabled = false;
    // 绑定的元素（videoContainer 的父元素）
    this.bindElement = null;
    // video 元素引用
    this.videoElement = null;
  }

  /**
   * 启用滚轮缩放功能
   */
  enable() {
    if (this.isEnabled) return;

    // 检查配置是否启用滚轮缩放
    if (!this.config.wheel || !this.config.wheel.enabled) {
      console.log(`[${this.config.platform}] 滚轮缩放功能已禁用`);
      return;
    }

    // 获取视频容器
    const videoContainer = this.zoomController.videoTransform.videoContainer;
    if (!videoContainer) {
      console.warn(`[${this.config.platform}] 未找到视频容器`);
      return;
    }

    // 绑定到 body 元素，简化处理
    this.bindElement = document.body;
    this.videoElement = videoContainer.querySelector("video");

    if (this.bindElement) {
      this.bindElement.addEventListener("wheel", this._handleWheel, {
        passive: false,
        capture: true,
      });
      this.isEnabled = true;
      console.log(
        `[${this.config.platform}] 启用滚轮缩放功能，修饰键: ${
          this.config.wheel.modifier || "ctrl"
        }，绑定到: body`
      );

      // 不再单独禁用页面缩放，直接在 _handleWheel 中处理
    }
  }

  /**
   * 禁用滚轮缩放功能
   */
  disable() {
    if (!this.isEnabled) return;

    if (this.bindElement) {
      this.bindElement.removeEventListener("wheel", this._handleWheel, true);
      this.isEnabled = false;
      this.bindElement = null;
      this.videoElement = null;
      console.log(`[${this.config.platform}] 禁用滚轮缩放功能`);
    }
  }

  /**
   * 处理滚轮事件
   * @private
   * @param {WheelEvent} e - 滚轮事件
   */
  _handleWheel(e) {
    // 检查配置是否启用滚轮缩放
    if (!this.config.wheel || !this.config.wheel.enabled) {
      return;
    }

    // 根据配置检查修饰键
    const modifier = this.config.wheel.modifier || "ctrl";
    let modifierPressed = false;

    switch (modifier.toLowerCase()) {
      case "ctrl":
        modifierPressed = e.ctrlKey || e.metaKey; // 支持 Mac 的 Cmd 键
        break;
      case "shift":
        modifierPressed = e.shiftKey;
        break;
      case "alt":
        modifierPressed = e.altKey;
        break;
      default:
        modifierPressed = e.ctrlKey || e.metaKey;
    }

    if (!modifierPressed) {
      return; // 没有按修饰键，不处理
    }

    // 检查事件目标是否在 video 元素上
    // if (!this._isTargetVideo(e.target)) {
    //   console.log(`[${this.config.platform}] 滚轮事件不在 video 元素上，忽略`);
    //   return;
    // }

    // 强制阻止浏览器默认行为（页面缩放等）
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // 获取滚轮方向和强度
    const delta = this._getWheelDelta(e);

    // 根据滚轮方向决定缩放
    if (delta > 0) {
      // 每次滚轮只缩放一步，和快捷键保持一致
      this.zoomController.zoomIn();
      console.log(
        `[${this.config.platform}] ${modifier.toUpperCase()}+滚轮向上，放大到 ${this.zoomController.getCurrentZoomLevel()}%`
      );
    } else if (delta < 0) {
      // 每次滚轮只缩放一步，和快捷键保持一致
      this.zoomController.zoomOut();
      console.log(
        `[${this.config.platform}] ${modifier.toUpperCase()}+滚轮向下，缩小到 ${this.zoomController.getCurrentZoomLevel()}%`
      );
    }
  }

  /**
   * 获取滚轮增量，处理不同浏览器的兼容性
   * @private
   * @param {WheelEvent} e - 滚轮事件
   * @returns {number} 滚轮增量（正数向上，负数向下）
   */
  _getWheelDelta(e) {
    // 处理不同浏览器的滚轮事件
    if (e.deltaY !== undefined) {
      // 现代浏览器（Firefox, Chrome, Safari）
      return -e.deltaY; // 取负值，因为 deltaY 向下为正数
    }

    if (e.wheelDelta !== undefined) {
      // 旧版 IE/Opera
      return e.wheelDelta;
    }

    if (e.detail !== undefined) {
      // Firefox 的旧版事件
      return -e.detail;
    }

    return 0; // 无法识别的滚轮事件
  }

  
  /**
   * 检查当前是否启用
   * @returns {boolean} 是否已启用
   */
  isWheelZoomEnabled() {
    return this.isEnabled;
  }

  /**
   * 切换启用状态
   */
  toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  
  /**
   * 销毁处理器，清理事件监听
   */
  destroy() {
    this.disable();
  }
}
