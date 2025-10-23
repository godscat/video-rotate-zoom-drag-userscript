/**
 * 键盘快捷键模块 - 管理键盘快捷键功能
 */
import { WheelHandler } from "./wheel-handler.js";
import { getLogger } from "./logger.js";

export class KeyboardShortcuts {
  /**
   * 初始化键盘快捷键
   * @param {ZoomController} zoomController - 缩放控制器实例
   * @param {RotationController} rotationController - 旋转控制器实例
   * @param {DragHandler} dragHandler - 拖拽处理器实例
   * @param {VideoTransform} videoTransform - 视频变换实例
   * @param {Object} config - 配置对象
   */
  constructor(
    zoomController,
    rotationController,
    dragHandler,
    videoTransform,
    config
  ) {
    this.zoomController = zoomController;
    this.rotationController = rotationController;
    this.dragHandler = dragHandler;
    this.videoTransform = videoTransform;
    this.config = config;

    // 获取全局日志器实例
    this.logger = getLogger().createChild('KeyboardShortcuts');

    // 初始化滚轮处理器
    this.wheelHandler = new WheelHandler(zoomController, config);

    this._bindEvents();
  }

  /**
   * 绑定键盘事件监听器
   * @private
   */
  _bindEvents() {
    document.addEventListener("keydown", (e) => this._handleKeyDown(e));

    // 启用滚轮缩放功能
    if (this.wheelHandler) {
      this.wheelHandler.enable();
    }
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
      if (this.zoomController) {
        this.zoomController.zoomIn();
      } else {
        this.logger.warn('缩放控制器未初始化，无法执行缩放操作');
      }
    } else if (this._checkShortcut(e, shortcuts.zoom.out)) {
      e.preventDefault();
      if (this.zoomController) {
        this.zoomController.zoomOut();
      } else {
        this.logger.warn('缩放控制器未初始化，无法执行缩放操作');
      }
    }

    // 旋转快捷键
    if (this._checkShortcut(e, shortcuts.rotation.left)) {
      e.preventDefault();
      if (this.rotationController) {
        this.rotationController.rotateLeft();
      } else {
        this.logger.warn('旋转控制器未初始化，无法执行旋转操作');
      }
    } else if (this._checkShortcut(e, shortcuts.rotation.right)) {
      e.preventDefault();
      if (this.rotationController) {
        this.rotationController.rotateRight();
      } else {
        this.logger.warn('旋转控制器未初始化，无法执行旋转操作');
      }
    }

    // 功能快捷键
    if (this._checkShortcut(e, shortcuts.actions.reset)) {
      e.preventDefault();
      if (this.rotationController) {
        this.rotationController.reset();
      } else {
        this.logger.warn('旋转控制器未初始化，无法执行还原操作');
        // 如果没有旋转控制器，手动重置视频变换
        if (this.videoTransform) {
          this.videoTransform.reset();
          this.logger.info('已通过VideoTransform重置视频状态');
        }
      }
    }

    if (this._checkShortcut(e, shortcuts.actions.moveUp)) {
      e.preventDefault();
      this._moveVideoUp(e);
    } else if (this._checkShortcut(e, shortcuts.actions.moveDown)) {
      e.preventDefault();
      this._moveVideoDown(e);
    } else if (this._checkShortcut(e, shortcuts.actions.moveLeft)) {
      e.preventDefault();
      this._moveVideoLeft(e);
    } else if (this._checkShortcut(e, shortcuts.actions.moveRight)) {
      e.preventDefault();
      this._moveVideoRight(e);
    }
  }

  /**
   * 格式化按键显示
   * @private
   * @param {KeyboardEvent} e - 键盘事件
   * @returns {string} 格式化的按键字符串
   */
  _formatKeyDisplay(e) {
    const modifiers = [];
    if (e.ctrlKey || e.metaKey) modifiers.push('Ctrl');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.altKey) modifiers.push('Alt');

    let keyName = '';
    switch (e.key) {
      case 'ArrowUp': keyName = '↑'; break;
      case 'ArrowDown': keyName = '↓'; break;
      case 'ArrowLeft': keyName = '←'; break;
      case 'ArrowRight': keyName = '→'; break;
      case ' ': keyName = 'Space'; break;
      default: keyName = e.key.toUpperCase(); break;
    }

    return modifiers.length > 0 ? `${modifiers.join('+')}+${keyName}` : keyName;
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
          case "ctrl":
            if (!e.ctrlKey) match = false;
            break;
          case "shift":
            if (!e.shiftKey) match = false;
            break;
          case "alt":
            if (!e.altKey) match = false;
            break;
          case "space":
            if (e.code !== "Space") match = false;
            break;
          case "arrowup":
            if (e.key !== "ArrowUp") match = false;
            break;
          case "arrowdown":
            if (e.key !== "ArrowDown") match = false;
            break;
          case "arrowleft":
            if (e.key !== "ArrowLeft") match = false;
            break;
          case "arrowright":
            if (e.key !== "ArrowRight") match = false;
            break;
          default:
            if (
              e.key.toLowerCase() !== key.toLowerCase() &&
              e.code.toLowerCase() !== key.toLowerCase()
            ) {
              match = false;
            }
        }
      }

      if (match) return true;
    }

    // 检查键码
    if (
      shortcutConfig.keyCodes &&
      shortcutConfig.keyCodes.includes(e.keyCode)
    ) {
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
    const fullscreenBtn = document.querySelector(
      this.config.selectors.fullscreenBtn
    );
    if (fullscreenBtn) {
      fullscreenBtn.click();
    }
  }

  /**
   * 向上移动视频
   * @private
   * @param {KeyboardEvent} e - 键盘事件
   */
  _moveVideoUp(e) {
    const keyDisplay = this._formatKeyDisplay(e);
    this.logger.info(`${keyDisplay} - 向上移动视频`);
    const { offsetX, offsetY } = this.videoTransform.getOffset();
    const stepSize = this.config.parameters.move.stepSize;
    this.videoTransform.setOffset(offsetX, offsetY - stepSize);

    // 临时显示抓取指针作为视觉反馈
    this._showMoveCursor();
  }

  /**
   * 向下移动视频
   * @private
   * @param {KeyboardEvent} e - 键盘事件
   */
  _moveVideoDown(e) {
    const keyDisplay = this._formatKeyDisplay(e);
    this.logger.info(`${keyDisplay} - 向下移动视频`);
    const { offsetX, offsetY } = this.videoTransform.getOffset();
    const stepSize = this.config.parameters.move.stepSize;
    this.videoTransform.setOffset(offsetX, offsetY + stepSize);

    // 临时显示抓取指针作为视觉反馈
    this._showMoveCursor();
  }

  /**
   * 向左移动视频
   * @private
   * @param {KeyboardEvent} e - 键盘事件
   */
  _moveVideoLeft(e) {
    const keyDisplay = this._formatKeyDisplay(e);
    this.logger.info(`${keyDisplay} - 向左移动视频`);
    const { offsetX, offsetY } = this.videoTransform.getOffset();
    const stepSize = this.config.parameters.move.stepSize;
    this.videoTransform.setOffset(offsetX - stepSize, offsetY);

    // 临时显示抓取指针作为视觉反馈
    this._showMoveCursor();
  }

  /**
   * 向右移动视频
   * @private
   * @param {KeyboardEvent} e - 键盘事件
   */
  _moveVideoRight(e) {
    const keyDisplay = this._formatKeyDisplay(e);
    this.logger.info(`${keyDisplay} - 向右移动视频`);
    const { offsetX, offsetY } = this.videoTransform.getOffset();
    const stepSize = this.config.parameters.move.stepSize;
    this.videoTransform.setOffset(offsetX + stepSize, offsetY);

    // 临时显示抓取指针作为视觉反馈
    this._showMoveCursor();
  }

  /**
   * 显示移动时的视觉反馈
   * @private
   */
  _showMoveCursor() {
    if (!this.videoTransform.videoContainer) return;

    const originalCursor = this.videoTransform.videoContainer.style.cursor;
    this.videoTransform.videoContainer.style.cursor = "grabbing";

    // 200ms后恢复原指针样式
    setTimeout(() => {
      if (this.videoTransform.videoContainer) {
        this.videoTransform.videoContainer.style.cursor = originalCursor || "default";
      }
    }, 200);
  }

  /**
   * 程序化触发快捷键操作
   * @param {string} shortcut - 快捷键名称
   */
  triggerShortcut(shortcut) {
    switch (shortcut) {
      case "zoomIn":
        if (this.zoomController) {
          this.zoomController.zoomIn();
        } else {
          this.logger.warn('缩放控制器未初始化，无法执行缩放操作');
        }
        break;
      case "zoomOut":
        if (this.zoomController) {
          this.zoomController.zoomOut();
        } else {
          this.logger.warn('缩放控制器未初始化，无法执行缩放操作');
        }
        break;
      case "rotateLeft":
        if (this.rotationController) {
          this.rotationController.rotateLeft();
        } else {
          this.logger.warn('旋转控制器未初始化，无法执行旋转操作');
        }
        break;
      case "rotateRight":
        if (this.rotationController) {
          this.rotationController.rotateRight();
        } else {
          this.logger.warn('旋转控制器未初始化，无法执行旋转操作');
        }
        break;
      case "reset":
        if (this.rotationController) {
          this.rotationController.reset();
        } else {
          this.logger.warn('旋转控制器未初始化，无法执行还原操作');
          // 如果没有旋转控制器，手动重置视频变换
          if (this.videoTransform) {
            this.videoTransform.reset();
            this.logger.info('已通过VideoTransform重置视频状态');
          }
        }
        break;
      case "fullscreen":
        this._toggleFullscreen();
        break;
      case "moveUp":
        this._moveVideoUp();
        break;
      default:
        this.logger.warn(`未知的快捷键: ${shortcut}`);
    }
  }

  /**
   * 销毁事件监听器
   */
  destroy() {
    document.removeEventListener("keydown", this._handleKeyDown);

    // 销毁滚轮处理器
    if (this.wheelHandler) {
      this.wheelHandler.destroy();
    }
  }
}
