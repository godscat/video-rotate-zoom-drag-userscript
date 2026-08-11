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
import { getPref } from "./modules/util.js";
import { BlockMenu } from "./modules/block-menu.js";

(function () {
  "use strict";

  let app = null;

  const hostname = location.hostname;
  const logEnabled = CONFIG.log.enabled;

  // 读取黑白名单配置（深拷贝避免污染 CONFIG.block 默认值）
  const block = JSON.parse(JSON.stringify(getPref("block", CONFIG.block, true)));
  // 清理黑白名单交集（防老版本遗留，确保互斥）
  block.blacklist = block.blacklist.filter((h) => !block.whitelist.includes(h));

  // 注册 GM 菜单（仅主框架，避免 iframe 重复注册）
  let _isTop = true;
  try { _isTop = window.top === window; } catch (e) {}
  if (_isTop) {
    const blockMenu = new BlockMenu(hostname, block);
    blockMenu.register();
  }

  // ====== 入口级拦截 ======
  if (block.useBlacklist && block.blacklist.includes(hostname)) {
    if (logEnabled) console.info(`[vrz]@${hostname} [INFO] 命中黑名单，脚本不启动`);
    return;
  }
  if (block.useWhitelist && !block.whitelist.includes(hostname)) {
    if (logEnabled) console.info(`[vrz]@${hostname} [INFO] 未命中白名单，脚本不启动`);
    return;
  }

  function main() {
    try {
      const logger = getLogger({ enabled: logEnabled }).createChild("Main");
      app = new App();
      app.start();
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
