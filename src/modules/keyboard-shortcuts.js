/**
 * 键盘快捷键模块 - 管理键盘快捷键功能
 */
export class KeyboardShortcuts {
  /**
   * 初始化键盘快捷键
   * @param {ZoomController} zoomController - 缩放控制器实例
   * @param {RotationController} rotationController - 旋转控制器实例
   * @param {DragHandler} dragHandler - 拖拽处理器实例
   * @param {VideoTransform} videoTransform - 视频变换实例
   * @param {Object} config - 配置对象
   */
  constructor(zoomController, rotationController, dragHandler, videoTransform, config) {
    this.zoomController = zoomController;
    this.rotationController = rotationController;
    this.dragHandler = dragHandler;
    this.videoTransform = videoTransform;
    this.config = config;

    this._bindEvents();
  }

  /**
   * 绑定键盘事件监听器
   * @private
   */
  _bindEvents() {
    document.addEventListener("keydown", (e) => this._handleKeyDown(e));
  }

  /**
   * 处理键盘按下事件
   * @private
   * @param {KeyboardEvent} e - 键盘事件
   */
  _handleKeyDown(e) {
    const { selectors, shortcuts } = this.config;

    // 忽略输入框中的按键
    if (document.activeElement.tagName === selectors.ignoreInputTag) return;

    // 全屏快捷键
    if (this._checkShortcut(e, shortcuts.actions.fullscreen)) {
      e.preventDefault();
      this._toggleFullscreen();
    }

    // 缩放快捷键
    if (this._checkShortcut(e, shortcuts.zoom.in)) {
      e.preventDefault();
      this.zoomController.zoomIn();
    } else if (this._checkShortcut(e, shortcuts.zoom.out)) {
      e.preventDefault();
      this.zoomController.zoomOut();
    }

    // 旋转快捷键
    if (this._checkShortcut(e, shortcuts.rotation.left)) {
      e.preventDefault();
      this.rotationController.rotateLeft();
    } else if (this._checkShortcut(e, shortcuts.rotation.right)) {
      e.preventDefault();
      this.rotationController.rotateRight();
    }

    // 功能快捷键
    if (this._checkShortcut(e, shortcuts.actions.reset)) {
      e.preventDefault();
      this.rotationController.reset();
    }

    if (this._checkShortcut(e, shortcuts.actions.moveUp)) {
      e.preventDefault();
      this._moveVideoUp();
    }
  }

  /**
   * 检查快捷键是否匹配
   * @private
   * @param {KeyboardEvent} e - 键盘事件
   * @param {Object} shortcutConfig - 快捷键配置
   * @returns {boolean} 是否匹配
   */
  _checkShortcut(e, shortcutConfig) {
    // 检查主要快捷键
    if (shortcutConfig.keys) {
      const keys = shortcutConfig.keys;
      let match = true;

      for (const key of keys) {
        switch (key.toLowerCase()) {
          case 'ctrl':
            if (!e.ctrlKey) match = false;
            break;
          case 'shift':
            if (!e.shiftKey) match = false;
            break;
          case 'alt':
            if (!e.altKey) match = false;
            break;
          case 'space':
            if (e.code !== 'Space') match = false;
            break;
          case 'arrowup':
            if (e.key !== 'ArrowUp') match = false;
            break;
          case 'arrowdown':
            if (e.key !== 'ArrowDown') match = false;
            break;
          case 'arrowleft':
            if (e.key !== 'ArrowLeft') match = false;
            break;
          case 'arrowright':
            if (e.key !== 'ArrowRight') match = false;
            break;
          default:
            if (e.key.toLowerCase() !== key.toLowerCase() &&
                e.code.toLowerCase() !== key.toLowerCase()) {
              match = false;
            }
        }
      }

      if (match) return true;
    }

    // 检查键码
    if (shortcutConfig.keyCodes && shortcutConfig.keyCodes.includes(e.keyCode)) {
      return true;
    }

    return false;
  }

  /**
   * 切换全屏模式
   * @private
   */
  _toggleFullscreen() {
    // 获取全屏按钮
    const fullscreenBtn = document.querySelector(this.config.selectors.fullscreenBtn);
    if (fullscreenBtn) {
      fullscreenBtn.click();
    }
  }

  /**
   * 向上移动视频
   * @private
   */
  _moveVideoUp() {
    console.log("Shift+Up - 移动视频");
    const { offsetY } = this.videoTransform.getOffset();
    const stepSize = this.config.parameters.move.stepSize;
    this.videoTransform.setOffset(0, offsetY - stepSize);

    // 临时设置拖拽状态以显示抓取指针
    this.dragHandler.startDrag(0, 0);
    this.dragHandler.endDrag();
  }

  /**
   * 程序化触发快捷键操作
   * @param {string} shortcut - 快捷键名称
   */
  triggerShortcut(shortcut) {
    switch (shortcut) {
      case 'zoomIn':
        this.zoomController.zoomIn();
        break;
      case 'zoomOut':
        this.zoomController.zoomOut();
        break;
      case 'rotateLeft':
        this.rotationController.rotateLeft();
        break;
      case 'rotateRight':
        this.rotationController.rotateRight();
        break;
      case 'reset':
        this.rotationController.reset();
        break;
      case 'fullscreen':
        this._toggleFullscreen();
        break;
      case 'moveUp':
        this._moveVideoUp();
        break;
      default:
        console.warn(`未知的快捷键: ${shortcut}`);
    }
  }

  /**
   * 销毁事件监听器
   */
  destroy() {
    document.removeEventListener("keydown", this._handleKeyDown);
  }
}