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
import { getPref } from './util.js';
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

    // 阶段二懒初始化标志：首次 activate 视频时才创建 UI / 交互处理器
    this._handlersReady = false;
    this.ui = null;
    this.dragHandler = null;
    this.wheelHandler = null;
    this.keyboard = null;
    this.configPanel = null;
    this.helpPanel = null;

    // 读取全局偏好覆盖默认配置（暂停时常驻等，跨站点生效）
    CONFIG.ui.persistOnPause = !!getPref('vrz-persist-on-pause', CONFIG.ui.persistOnPause);

    // 阶段一即可安全创建（构造期无全局事件副作用）
    this.siteConfig = new SiteConfig();
    this.engine = new TransformEngine();
    this.abLoop = new ABLoop(this);
  }

  /**
   * 阶段二：首次激活视频时创建 UI 与交互处理器（幂等）。
   * 在此之前页面仅持有 play + MutationObserver 两个轻量监听，
   * 避免在无视频站点上全局绑定快捷键 / 指针 / 滚轮监听。
   */
  _ensureHandlers() {
    if (this._handlersReady) return;
    this._handlersReady = true;

    // 异步加载本站点配置（失败回退默认值）；仅在进入阶段二时打开 IndexedDB，
    // 避免无视频站点创建 vrz-config 数据库
    this.siteConfig.load();

    // 注入样式（无视频时不注入 <style>）
    Styles.inject();

    // 面板（DOM 在 open() 时按需创建，构造期无副作用）
    this.configPanel = new ConfigPanel(this.siteConfig, {
      onPersistOnChange: () => {
        // 配置改变后即时应用到当前暂停状态
        if (this.isPaused) {
          if (CONFIG.ui.persistOnPause) this.showPersistent();
          else this.showAndTimer();
        }
      },
    });
    this.helpPanel = new HelpPanel();

    // 悬浮 UI（此刻才会向 body 插入浮层并绑定 document mousedown）
    this.ui = new UIOverlay(this.engine, this.abLoop, {
      onConfig: () => this.configPanel.open(),
      onHelp: () => this.helpPanel.open(),
    });

    // 交互处理器（document 级别，无需随视频切换重绑）
    this.dragHandler = new DragHandler(this);
    this.wheelHandler = new WheelHandler(this);
    this.keyboard = new KeyboardShortcuts(this);

    // 阶段二的全局监听（显隐控制 / 位置同步 / 暂停常驻）
    this._onPause = (e) => {
      if (e.target instanceof HTMLVideoElement && e.target === this.activeVideo) {
        this.isPaused = true;
        if (CONFIG.ui.persistOnPause) this.showPersistent();
        else this.showAndTimer();
      }
    };
    document.addEventListener('pause', this._onPause, true);

    this._onScroll = () => this.updateRectAndPosition();
    document.addEventListener('scroll', this._onScroll, { passive: true, capture: true });

    this._onResize = () => this.updateRectAndPosition();
    window.addEventListener('resize', this._onResize, { passive: true });

    this._onPointerMove = (e) => this.handleGlobalPointer(e);
    window.addEventListener('pointermove', this._onPointerMove, { passive: true });

    this.logger.info('交互处理器已就绪');
  }

  /**
   * 启动：阶段一（轻量探测）。仅绑定视频发现所需的监听，
   * 交互处理器推迟到首次 activate() 时由 _ensureHandlers() 创建。
   */
  start() {
    // play 事件：视频发现核心。handler 未就绪时仅走激活路径，不触碰 UI。
    this._onPlay = (e) => {
      if (e.target instanceof HTMLVideoElement && this._isPrimaryVideo(e.target)) {
        this.activate(e.target);
      }
      if (!this._handlersReady) return;
      this.isPaused = false;
      this.showAndTimer();
    };
    document.addEventListener('play', this._onPlay, true);

    // SPA：DOM 变化后重新扫描 + 重新定位（防抖）
    // DOM mutation 常引发布局位移（如 B 站导航栏出现），需同步修正浮层位置
    this.spaObserver = new MutationObserver(() => {
      clearTimeout(this._spaTimer);
      this._spaTimer = setTimeout(() => {
        this.scan();
        if (this.activeVideo) this.updateRectAndPosition();
      }, 300);
    });
    this.spaObserver.observe(document.body, { childList: true, subtree: true });

    // 首次扫描
    this.scan();
    this.logger.info('App 已启动（探测模式，待视频出现即激活）');
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
   * @param {HTMLVideoElement} v
   * @returns {boolean}
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
   * @param {HTMLVideoElement} video
   */
  activate(video) {
    if (!video) return;
    // 尺寸不达标（信息流预览等）不激活
    if (!this._isPrimaryVideo(video)) return;
    if (!this.shouldSwitchVideo(video)) return;

    // 首次激活：完成阶段二初始化（UI + 交互处理器 + 显隐监听）
    this._ensureHandlers();

    this.activeVideo = video;
    this.stage = video.parentElement || video;

    // 切换到新视频：清空 A-B 循环状态
    this.abLoop.reset();

    this.engine.attach(video);
    this.ui.attach(this.stage, video);

    // 激活后短时轮询，等待布局稳定（B 站等站点布局延迟位移较慢）
    this.startPolling(1500);

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
    this.clearHideTimer();
    this.engine.detach();
    if (this.ui) this.ui.detach();
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
    const stageRect = this.stage.getBoundingClientRect();
    const videoRect = this.activeVideo.getBoundingClientRect();
    // stage 塌陷时（如 YouTube 的 .html5-video-container 高度为 0）回退到 video rect
    const rect = stageRect.width > 0 && stageRect.height > 0 ? stageRect : videoRect;
    this.videoRect = rect; // 显隐判断沿用 stage 语义
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
    if (!this.activeVideo || !this.videoRect || (this.isPaused && CONFIG.ui.persistOnPause)) return;

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
    this.dragHandler?.destroy();
    this.wheelHandler?.destroy();
    this.keyboard?.destroy();
    if (this.configPanel) this.configPanel.close();
    if (this.helpPanel) this.helpPanel.close();
    if (this.spaObserver) this.spaObserver.disconnect();
    clearTimeout(this._spaTimer);

    // 移除阶段二全局事件监听器
    if (this._onPause) document.removeEventListener('pause', this._onPause, true);
    if (this._onScroll) document.removeEventListener('scroll', this._onScroll, { capture: true });
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this._onPointerMove) window.removeEventListener('pointermove', this._onPointerMove);

    // 移除阶段一 play 监听器
    if (this._onPlay) document.removeEventListener('play', this._onPlay, true);

    this.ui?.destroy();
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
