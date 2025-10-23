import { Styles } from "./styles.js";
import { UIComponents } from "./ui-components.js";
import { VideoTransform } from "./video-transform.js";
import { ZoomController } from "./zoom-controller.js";
import { RotationController } from "./rotation-controller.js";
import { DragHandler } from "./drag-handler.js";
import { KeyboardShortcuts } from "./keyboard-shortcuts.js";
import { getPlatformConfig } from "./config.js";
import { detectPlatform } from "./platform-detector.js";
import { getLogger } from "./logger.js";

/**
 * 初始化模块 - 负责初始化和协调所有功能模块
 */
export class Initializer {
  constructor() {
    // 自动检测平台
    this.platform = detectPlatform();
    this.config = getPlatformConfig(this.platform);
    this.videoTransform = null;
    this.zoomController = null;
    this.rotationController = null;
    this.dragHandler = null;
    this.keyboardShortcuts = null;
    this.observer = null;

    // 获取全局日志器实例
    this.logger = getLogger().createChild(`Initializer[${this.platform}]`);
    this.logger.info(`初始化，检测到平台: ${this.platform}`);
  }

  /**
   * 初始化视频控制器
   */
  init() {
    // 注入样式
    Styles.injectStyles(this.config);

    // 检查UI控制按钮是否启用
    const uiEnabled = this.config.ui.controls.enabled;
    this.logger.info(`UI控制按钮: ${uiEnabled ? '启用' : '禁用'}`);

    // 创建UI组件（如果启用）
    let uiElements = null;
    if (uiEnabled) {
      uiElements = UIComponents.createControlButtons(this.config);
      if (!uiElements) {
        this.logger.warn('UI组件创建失败，可能控制容器不存在');
        return;
      }
      this.logger.info('UI组件创建成功');
    } else {
      this.logger.info('跳过UI组件创建，仅支持键盘快捷键');
    }

    // 初始化核心功能模块
    this.videoTransform = new VideoTransform(this.config);
    if (!this.videoTransform.videoContainer) {
      this.logger.warn('视频容器未找到，初始化失败');
      return;
    }

    // 只有在UI启用时才初始化控制模块
    if (uiEnabled && uiElements) {
      // 初始化控制模块
      this.zoomController = new ZoomController(
        this.videoTransform,
        uiElements.zoomOutBtn,
        uiElements.zoomInBtn,
        uiElements.zoomDisplay,
        this.config
      );

      this.rotationController = new RotationController(
        this.videoTransform,
        uiElements.rotateLeftBtn,
        uiElements.rotateRightBtn,
        uiElements.resetBtn,
        uiElements.rotateIndicator,
        this.config
      );

      this.logger.info('UI控制模块初始化完成');
    }

    // 无论UI是否启用，都初始化拖拽和键盘快捷键功能
    this.dragHandler = new DragHandler(this.videoTransform, this.config);
    this.keyboardShortcuts = new KeyboardShortcuts(
      this.zoomController, // 可能为null，KeyboardShortcuts会处理
      this.rotationController, // 可能为null，KeyboardShortcuts会处理
      this.dragHandler,
      this.videoTransform,
      this.config
    );

    this.logger.info('视频控制器初始化完成');
  }

  /**
   * 启动并监听播放器变化（针对SPA页面）
   */
  start() {
    // 初始初始化
    this.init();

    // 监听播放器变化（针对SPA页面）
    this.observer = new MutationObserver(() => {
      this.init();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * 停止所有功能并清理资源
   */
  stop() {
    // 销毁所有模块
    if (this.keyboardShortcuts) {
      this.keyboardShortcuts.destroy();
    }

    if (this.dragHandler) {
      this.dragHandler.destroy();
    }

    if (this.rotationController) {
      this.rotationController.destroy();
    }

    if (this.zoomController) {
      this.zoomController.destroy();
    }

    // 停止观察器
    if (this.observer) {
      this.observer.disconnect();
    }

    // 重置状态
    this.videoTransform = null;
    this.zoomController = null;
    this.rotationController = null;
    this.dragHandler = null;
    this.keyboardShortcuts = null;
    this.observer = null;
  }

  /**
   * 重新初始化
   */
  reinit() {
    this.stop();
    this.start();
  }

  /**
   * 获取当前状态
   * @returns {Object} 当前状态信息
   */
  getState() {
    return {
      hasVideoTransform: !!this.videoTransform,
      hasZoomController: !!this.zoomController,
      hasRotationController: !!this.rotationController,
      hasDragHandler: !!this.dragHandler,
      hasKeyboardShortcuts: !!this.keyboardShortcuts,
      hasObserver: !!this.observer,
    };
  }
}
