import { Initializer } from "./modules/initializer.js";
import { getLogger } from "./modules/logger.js";

/**
 * 视频旋转缩放拖拽工具 - 重构版本
 *
 * 功能特性：
 * - 视频缩放 (50% - 300%)
 * - 视频旋转 (90度增量)
 * - 视频拖拽移动
 * - 键盘快捷键支持
 * - 响应式UI控制
 *
 * 快捷键：
 * - Ctrl + +/- : 缩放视频
 * - Ctrl + L/左箭头 : 向左旋转
 * - Ctrl + R/右箭头 : 向右旋转
 * - Ctrl + 0 : 还原到初始状态
 * - Ctrl + 空格 : 切换全屏
 * - Shift + 上箭头 : 向上移动视频
 */

(function () {
  "use strict";

  let initializer = null;

  /**
   * 页面加载完成后初始化
   */
  function main() {
    try {
      const logger = getLogger().createChild('Main');
      logger.info("开始初始化视频控制器，将自动检测平台");
      initializer = new Initializer(); // 不传参数，让 Initializer 自动检测平台
      initializer.start();
      logger.info(`视频控制器初始化成功，检测到平台: ${initializer.platform}`);
    } catch (error) {
      const logger = getLogger().createChild('Main');
      logger.error("视频控制器初始化失败:", error);
    }
  }

  /**
   * 监听页面状态变化
   */
  function handlePageReady() {
    if (document.readyState === "complete") {
      main();
    } else {
      window.addEventListener("load", main);
    }
  }

  // 启动应用
  handlePageReady();

  // 导出给外部调用的API（可选）
  if (typeof window !== "undefined") {
    window.VideoController = {
      init: main,
      getState: () => initializer?.getState() || null,
      reinit: () => initializer?.reinit(),
      getPlatform: () => initializer?.platform || null,
    };
  }
})();
