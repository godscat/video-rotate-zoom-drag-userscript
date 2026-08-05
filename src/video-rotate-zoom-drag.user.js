/**
 * 视频旋转缩放拖拽工具 - 重构版（浮层架构）
 *
 * 架构（参考 chimo-chimo-loop）：
 *  - 不依赖平台 CSS 选择器，直接 document.querySelector('video') + play 事件发现视频
 *  - UI 为独立浮层（position:fixed），通过 getBoundingClientRect 跟随视频父元素
 *  - 变换通过动态 <style> 标签应用到 <video> 元素本身，不污染 inline style
 *  - 90°/270° 旋转自动计算 contain 缩放，无黑边
 *
 * 功能：
 *  - 缩放 50%-300%（Shift++/- 或按钮或滚轮）
 *  - 双向旋转 90°（Shift+L/R 或按钮）
 *  - 拖拽平移（Ctrl+鼠标拖拽）
 *  - 键盘移动（Shift+方向键）
 *  - 还原（Shift+0）
 *
 * 详见 src/modules/app.js
 */

import { App } from "./modules/app.js";
import { getLogger } from "./modules/logger.js";
import CONFIG from "./modules/config.js";

(function () {
  "use strict";

  let app = null;

  function main() {
    try {
      // 首次初始化全局日志器（独立开关，由 config.log.enabled 控制）
      const logger = getLogger({ enabled: CONFIG.log.enabled }).createChild("Main");

      // 黑名单：入口级拦截，命中则完全不构造 App（零监听、零副作用）
      if (CONFIG.blacklist && CONFIG.blacklist.includes(location.hostname)) {
        logger.info(`站点 ${location.hostname} 命中黑名单，脚本不启动`);
        return;
      }

      app = new App();
      app.start();
      // logger.info("视频控制器启动成功（浮层架构）");
    } catch (error) {
      console.error("[vrz] 启动失败:", error);
    }
  }

  if (document.readyState === "complete") {
    main();
  } else {
    window.addEventListener("load", main);
  }

  // 外部 API（可选）
  if (typeof window !== "undefined") {
    window.VideoController = {
      init: main,
      getState: () => app?.getState() || null,
      reinit: () => app?.reinit(),
    };
  }
})();
