/**
 * 拖拽功能模块 - 管理视频的拖拽移动功能
 */
import { getLogger } from "./logger.js";

export class DragHandler {
  /**
   * 初始化拖拽处理器
   * @param {VideoTransform} videoTransform - 视频变换实例
   * @param {Object} config - 配置对象
   */
  constructor(videoTransform, config) {
    this.videoTransform = videoTransform;
    this.videoContainer = videoTransform.videoContainer;
    this.config = config;

    // 获取全局日志器实例
    this.logger = getLogger().createChild('DragHandler');

    this.state = {
      isDragging: false,
      startX: 0,
      startY: 0,
    };

    // 绑定 this 上下文
    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);

    this._bindEvents();
  }

  /**
   * 绑定事件监听器
   * @private
   */
  _bindEvents() {
    // 根据平台配置决定事件监听策略
    const eventConfig = this.config.eventHandling || {};
    const useCapture = eventConfig.captureEvents || false;

    this.logger.info(`绑定拖拽事件，使用捕获模式: ${useCapture}`);

    // 鼠标按下事件
    this.videoContainer.addEventListener(
      "mousedown",
      this._handleMouseDown,
      useCapture
    );

    // 鼠标移动事件
    document.addEventListener("mousemove", this._handleMouseMove, useCapture);

    // 鼠标释放事件
    document.addEventListener("mouseup", this._handleMouseUp, useCapture);
  }

  /**
   * 处理鼠标按下事件
   * @private
   * @param {MouseEvent} e - 鼠标事件
   */
  _handleMouseDown(e) {
    // 检查拖拽功能是否启用
    if (!this.config.drag || !this.config.drag.enabled) return;

    // 只有在缩放状态下才能拖拽，且只有左键才能拖拽
    if (!this.videoTransform.canDrag() || e.button !== 0) return;

    // 检查修饰键
    const dragModifier = this.config.drag.modifier;
    let modifierPressed = false;

    if (dragModifier) {
      switch (dragModifier.toLowerCase()) {
        case 'ctrl':
          modifierPressed = e.ctrlKey || e.metaKey; // 支持 Mac 的 Cmd 键
          break;
        case 'shift':
          modifierPressed = e.shiftKey;
          break;
        case 'alt':
          modifierPressed = e.altKey;
          break;
        default:
          modifierPressed = true; // 未知修饰键，默认允许
      }
    } else {
      modifierPressed = true; // 无修饰键配置，总是允许
    }

    if (!modifierPressed) {
      return; // 没有按住修饰键，不处理
    }

    // 强制阻止所有默认行为，防止触发播放器的播放/暂停功能
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const { offsetX, offsetY } = this.videoTransform.getOffset();

    this.state.isDragging = true;
    this.state.startX = e.clientX - offsetX;
    this.state.startY = e.clientY - offsetY;

    this.videoContainer.style.cursor = "grabbing";

    this.logger.info(`开始拖拽，修饰键: ${dragModifier || '无'}，初始位置: (${this.state.startX}, ${this.state.startY})`);
  }

  /**
   * 处理鼠标移动事件
   * @private
   * @param {MouseEvent} e - 鼠标事件
   */
  _handleMouseMove(e) {
    if (!this.state.isDragging) return;

    // 强制阻止默认行为，防止拖拽时影响播放器
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const offsetX = e.clientX - this.state.startX;
    const offsetY = e.clientY - this.state.startY;

    this.videoTransform.setOffset(offsetX, offsetY);
  }

  /**
   * 处理鼠标释放事件
   * @private
   */
  _handleMouseUp() {
    if (!this.state.isDragging) return;

    this.state.isDragging = false;

    // 恢复正确的鼠标指针样式
    if (this.videoTransform.canDrag()) {
      this.videoContainer.style.cursor = "grab";
    } else {
      this.videoContainer.style.cursor = "default";
    }
  }

  /**
   * 程序化开始拖拽
   * @param {number} startX - 起始X坐标
   * @param {number} startY - 起始Y坐标
   */
  startDrag(startX, startY) {
    if (!this.videoTransform.canDrag()) return;

    const { offsetX, offsetY } = this.videoTransform.getOffset();

    this.state.isDragging = true;
    this.state.startX = startX - offsetX;
    this.state.startY = startY - offsetY;

    this.videoContainer.style.cursor = "grabbing";
  }

  /**
   * 程序化设置拖拽位置
   * @param {number} clientX - 当前X坐标
   * @param {number} clientY - 当前Y坐标
   */
  setDragPosition(clientX, clientY) {
    if (!this.state.isDragging) return;

    const offsetX = clientX - this.state.startX;
    const offsetY = clientY - this.state.startY;

    this.videoTransform.setOffset(offsetX, offsetY);
  }

  /**
   * 程序化结束拖拽
   */
  endDrag() {
    this._handleMouseUp();
  }

  /**
   * 检查当前是否正在拖拽
   * @returns {boolean} 是否正在拖拽
   */
  isDragging() {
    return this.state.isDragging;
  }

  /**
   * 销毁事件监听器
   */
  destroy() {
    const eventConfig = this.config.eventHandling || {};
    const useCapture = eventConfig.captureEvents || false;

    if (this.videoContainer) {
      this.videoContainer.removeEventListener(
        "mousedown",
        this._handleMouseDown,
        useCapture
      );
    }
    document.removeEventListener(
      "mousemove",
      this._handleMouseMove,
      useCapture
    );
    document.removeEventListener("mouseup", this._handleMouseUp, useCapture);
  }
}
