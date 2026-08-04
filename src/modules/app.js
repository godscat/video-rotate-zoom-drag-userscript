/**
 * 应用协调器 - 取代旧版 Initializer
 *
 * 核心职责（参考 chimo-chimo-loop.App）：
 *  1. 视频发现：scan() + document 'play' 事件 + MutationObserver（SPA）
 *  2. 视频切换：shouldSwitchVideo() 多视频时选最靠近视口中心者
 *  3. 位置同步：ResizeObserver(stage) + scroll/resize + 激活后短时 rAF 轮询
 *  4. 显隐控制：鼠标在视频/控件上时显示并计时隐藏；暂停时常驻
 *
 * 不再依赖任何平台 CSS 选择器。
 */

import CONFIG from './config.js';
import { Styles } from './styles.js';
import { TransformEngine } from './transform-engine.js';
import { UIOverlay } from './ui-overlay.js';
import { DragHandler } from './drag-handler.js';
import { WheelHandler } from './wheel-handler.js';
import { KeyboardShortcuts } from './keyboard-shortcuts.js';
import { ABLoop } from './ab-loop.js';
import { SiteConfig } from './site-config.js';
import { ConfigPanel } from './config-panel.js';
import { HelpPanel } from './help-panel.js';
import { getLogger } from './logger.js';

class App {
  constructor() {
    this.logger = getLogger().createChild('App');

    this.activeVideo = null;
    this.stage = null; // 视频父元素，作为浮层定位基准（稳定，不受 transform 影响）
    this.videoRect = null;

    this.isPaused = false;
    this.hideTimer = null;
    this.pointerThrottled = false;
    this.pollingId = null;
    this.layoutObserver = null; // ResizeObserver 监听 stage
    this.spaObserver = null; // MutationObserver 监听 DOM 变化
    this._spaTimer = null;

    // 注入样式
    Styles.inject();

    // 每站点配置（修饰键）
    this.siteConfig = new SiteConfig();

    // 创建核心模块
    this.engine = new TransformEngine();
    this.abLoop = new ABLoop(this);
    this.configPanel = new ConfigPanel(this.siteConfig);
    this.helpPanel = new HelpPanel();
    this.ui = new UIOverlay(this.engine, this.abLoop, {
      onConfig: () => this.configPanel.open(),
      onHelp: () => this.helpPanel.open(),
    });

    // 交互处理器（document 级别，无需随视频切换重绑）
    this.dragHandler = new DragHandler(this);
    this.wheelHandler = new WheelHandler(this);
    this.keyboard = new KeyboardShortcuts(this);
  }

  /**
   * 启动：全局事件监听 + 首次扫描
   */
  start() {
    // play 事件：视频开始播放时激活（过滤信息流封面预览等小视频）
    document.addEventListener(
      'play',
      (e) => {
        if (e.target instanceof HTMLVideoElement && this._isPrimaryVideo(e.target)) {
          this.activate(e.target);
        }
        this.isPaused = false;
        this.showAndTimer();
      },
      true
    );

    // 暂停时常驻显示
    document.addEventListener(
      'pause',
      (e) => {
        if (e.target instanceof HTMLVideoElement && e.target === this.activeVideo) {
          this.isPaused = true;
          this.showPersistent();
        }
      },
      true
    );

    // 滚动/缩放：重新定位
    document.addEventListener('scroll', () => this.updateRectAndPosition(), { passive: true, capture: true });
    window.addEventListener('resize', () => this.updateRectAndPosition(), { passive: true });

    // 鼠标移动：控制显隐
    window.addEventListener('pointermove', (e) => this.handleGlobalPointer(e), { passive: true });

    // SPA：DOM 变化后重新扫描（防抖）
    this.spaObserver = new MutationObserver(() => {
      clearTimeout(this._spaTimer);
      this._spaTimer = setTimeout(() => this.scan(), 300);
    });
    this.spaObserver.observe(document.body, { childList: true, subtree: true });

    // 异步加载本站点配置（失败回退默认值）
    this.siteConfig.load();

    // 首次扫描
    this.scan();
    this.logger.info('App 已启动');
  }

  /**
   * 扫描页面上的 video：选择尺寸达标的最大那个（跳过信息流封面预览）
   */
  scan() {
    const videos = document.querySelectorAll('video');
    let best = null;
    let bestArea = 0;
    videos.forEach((v) => {
      if (!v.isConnected) return;
      if (!this._isPrimaryVideo(v)) return;
      const area = (v.clientWidth || 0) * (v.clientHeight || 0);
      if (area > bestArea) {
        bestArea = area;
        best = v;
      }
    });
    if (best) this.activate(best);
  }

  /**
   * 判断是否为"主视频"：渲染尺寸达到阈值，且未隐藏。
   * 用于过滤 B 站等信息流 hover 出来的小尺寸预览视频。
   */
  _isPrimaryVideo(v) {
    if (!v || !v.isConnected) return false;
    const w = v.clientWidth;
    const h = v.clientHeight;
    if (!w || !h) return false;
    return w >= CONFIG.video.minActivateWidth && h >= CONFIG.video.minActivateHeight;
  }

  /**
   * 多视频场景下是否应切换到新视频
   */
  shouldSwitchVideo(newVideo) {
    const oldVideo = this.activeVideo;
    if (!oldVideo) return true;
    if (oldVideo === newVideo) return false;
    if (!oldVideo.isConnected) return true;

    const o = this.videoRect || oldVideo.getBoundingClientRect();
    const n = newVideo.getBoundingClientRect();
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dNew = Math.hypot(n.left + n.width / 2 - cx, n.top + n.height / 2 - cy);
    const dOld = Math.hypot(o.left + o.width / 2 - cx, o.top + o.height / 2 - cy);
    if (dNew < dOld) return true;

    // 旧视频仍在播放且更大，则保留
    if (!oldVideo.paused && o.width * o.height > n.width * n.height) return false;
    return true;
  }

  /**
   * 激活目标视频
   */
  activate(video) {
    if (!video) return;
    // 尺寸不达标（信息流预览等）不激活
    if (!this._isPrimaryVideo(video)) return;
    if (!this.shouldSwitchVideo(video)) return;

    this.activeVideo = video;
    this.stage = video.parentElement || video;

    // 切换到新视频：清空 A-B 循环状态
    this.abLoop.reset();

    this.engine.attach(video);
    this.ui.attach(this.stage, video);

    // 激活后短时轮询，等待布局稳定
    this.startPolling(500);

    // 持续监听 stage 尺寸变化（全屏/响应式）
    this.observerCleanup();
    this.layoutObserver = new ResizeObserver(() => {
      if (!video.isConnected) {
        this.ui.hide();
        return;
      }
      if (this.activeVideo === video) this.updateRectAndPosition();
    });
    this.layoutObserver.observe(this.stage);

    this.updateRectAndPosition();
    this.logger.info('已激活视频');
  }

  /**
   * 解绑当前视频
   */
  detach() {
    this.engine.detach();
    this.ui.detach();
    this.abLoop.reset();
    this.activeVideo = null;
    this.stage = null;
    this.videoRect = null;
    this.observerCleanup();
    this.stopPolling();
  }

  observerCleanup() {
    if (this.layoutObserver) {
      this.layoutObserver.disconnect();
      this.layoutObserver = null;
    }
  }

  /**
   * 更新 stage rect 并重新定位浮层
   */
  updateRectAndPosition() {
    if (!this.activeVideo) return;
    if (!this.activeVideo.isConnected) {
      this.detach();
      return;
    }
    const rect = this.stage.getBoundingClientRect();
    // 过滤无效 rect（display:none 等）
    if (rect.width === 0 && rect.height === 0) return;
    this.videoRect = rect;
    this.ui.reposition(rect);
  }

  /**
   * 全局指针移动：控制浮层显隐
   */
  handleGlobalPointer(e) {
    if (this.pointerThrottled) return;
    this.pointerThrottled = true;
    setTimeout(() => { this.pointerThrottled = false; }, 150);

    if (this.activeVideo && !this.activeVideo.isConnected) {
      this.detach();
      return;
    }
    if (!this.activeVideo || !this.videoRect || this.isPaused) return;

    const rect = this.videoRect;
    const overVideo =
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top && e.clientY <= rect.bottom;
    const overControls = this.ui.container.contains(e.target);

    if (overVideo || overControls) {
      this.showAndTimer();
    } else {
      this.ui.hide();
    }
  }

  /**
   * 显示并在延时后隐藏
   */
  showAndTimer(timeout = CONFIG.ui.hideDelay) {
    this.clearHideTimer();
    this.ui.show();
    this.hideTimer = setTimeout(() => {
      this.ui.hide();
    }, timeout);
  }

  /**
   * 常驻显示（暂停状态）
   */
  showPersistent() {
    this.clearHideTimer();
    this.ui.show();
  }

  clearHideTimer() {
    if (!this.hideTimer) return;
    clearTimeout(this.hideTimer);
    this.hideTimer = null;
  }

  /**
   * 激活后短时 rAF 轮询，确保布局稳定后位置正确
   */
  startPolling(duration) {
    this.stopPolling();
    const startTime = performance.now();
    const poll = (now) => {
      this.updateRectAndPosition();
      if (now - startTime < duration) {
        this.pollingId = requestAnimationFrame(poll);
      }
    };
    this.pollingId = requestAnimationFrame(poll);
  }

  stopPolling() {
    if (!this.pollingId) return;
    cancelAnimationFrame(this.pollingId);
    this.pollingId = null;
  }

  /**
   * 重新初始化
   */
  reinit() {
    this.detach();
    this.scan();
  }

  /**
   * 停止并清理全部资源
   */
  stop() {
    this.detach();
    this.abLoop.destroy();
    this.dragHandler.destroy();
    this.wheelHandler.destroy();
    this.keyboard.destroy();
    this.configPanel.close();
    this.helpPanel.close();
    if (this.spaObserver) this.spaObserver.disconnect();
    clearTimeout(this._spaTimer);
  }

  getState() {
    return {
      hasActiveVideo: !!this.activeVideo,
      engineState: this.engine.getState(),
      platform: 'generic',
    };
  }
}

export { App };
