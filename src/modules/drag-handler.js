/**
 * 拖拽功能模块 - 管理视频的拖拽移动功能
 */
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

    this.state = {
      isDragging: false,
      startX: 0,
      startY: 0
    };

    this._bindEvents();
  }

  /**
   * 绑定事件监听器
   * @private
   */
  _bindEvents() {
    // 鼠标按下事件
    this.videoContainer.addEventListener("mousedown", (e) => this._handleMouseDown(e));

    // 鼠标移动事件
    document.addEventListener("mousemove", (e) => this._handleMouseMove(e));

    // 鼠标释放事件
    document.addEventListener("mouseup", () => this._handleMouseUp());
  }

  /**
   * 处理鼠标按下事件
   * @private
   * @param {MouseEvent} e - 鼠标事件
   */
  _handleMouseDown(e) {
    // 只有在缩放状态下才能拖拽
    if (!this.videoTransform.canDrag()) return;

    const { offsetX, offsetY } = this.videoTransform.getOffset();

    this.state.isDragging = true;
    this.state.startX = e.clientX - offsetX;
    this.state.startY = e.clientY - offsetY;

    this.videoContainer.style.cursor = "grabbing";
  }

  /**
   * 处理鼠标移动事件
   * @private
   * @param {MouseEvent} e - 鼠标事件
   */
  _handleMouseMove(e) {
    if (!this.state.isDragging) return;

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
    this.videoContainer.removeEventListener("mousedown", this._handleMouseDown);
    document.removeEventListener("mousemove", this._handleMouseMove);
    document.removeEventListener("mouseup", this._handleMouseUp);
  }
}