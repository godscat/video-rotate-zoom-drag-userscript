/**
 * A-B 循环模块 - 在视频的 A/B 区间内循环播放
 *
 * 状态全部在内存中（不写入 IndexedDB）：
 *  - A 起点 / B 终点
 *  - 是否正在循环
 *
 * 实现：在 video 的 timeupdate 上检测到达 B 时回跳到 A。
 * 视频切换时由 App 调用 reset() 清空状态并解绑监听。
 */

import { getLogger } from './logger.js';

class ABLoop {
  constructor(app) {
    this.app = app;
    this.logger = getLogger().createChild('ABLoop');
    this.startTime = null;
    this.endTime = null;
    this.isLooping = false;
    this._boundVideo = null;
    this._boundHandler = this._onTimeUpdate.bind(this);
    this.onChange = null;
  }

  get video() {
    return this.app.activeVideo;
  }

  /** 格式化秒：<1h 为 MM:SS，≥1h 为 H:MM:SS */
  static format(t) {
    if (t == null) return '';
    if (!isFinite(t) || t < 0) t = 0;
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  /** 设置起点 A（若 A 落在 B 之后则清空 B） */
  setA() {
    const v = this.video;
    if (!v) return;
    this.startTime = v.currentTime;
    if (this.endTime != null && this.endTime <= this.startTime) this.endTime = null;
    this.logger.info(`A = ${ABLoop.format(this.startTime)}`);
    this._notify();
  }

  /** 设置终点 B（必须晚于 A） */
  setB() {
    const v = this.video;
    if (!v) return;
    const t = v.currentTime;
    if (this.startTime != null && t <= this.startTime) {
      this.logger.warn('B 必须晚于 A');
      this._notify();
      return;
    }
    this.endTime = t;
    this.logger.info(`B = ${ABLoop.format(this.endTime)}`);
    this._notify();
  }

  canLoop() {
    return this.startTime != null && this.endTime != null && this.endTime > this.startTime;
  }

  toggleLoop() {
    this.isLooping ? this.stop() : this.start();
  }

  start() {
    const v = this.video;
    if (!v || !this.canLoop()) {
      this.logger.warn('需要先设置 A 和 B 才能循环');
      return false;
    }
    this._detachListener();
    this._boundVideo = v;
    v.addEventListener('timeupdate', this._boundHandler);
    this.isLooping = true;
    v.currentTime = this.startTime;
    this.logger.info(`开始循环 ${ABLoop.format(this.startTime)} → ${ABLoop.format(this.endTime)}`);
    this._notify();
    return true;
  }

  stop() {
    this._detachListener();
    if (this.isLooping) {
      this.isLooping = false;
      this.logger.info('停止循环');
    }
    this._notify();
  }

  _onTimeUpdate() {
    const v = this._boundVideo;
    if (!v) return;
    if (this.endTime != null && v.currentTime >= this.endTime) {
      v.currentTime = this.startTime;
    }
  }

  _detachListener() {
    if (this._boundVideo) {
      this._boundVideo.removeEventListener('timeupdate', this._boundHandler);
      this._boundVideo = null;
    }
  }

  /** 清空 A/B 并停止循环（视频切换时调用） */
  reset() {
    this._detachListener();
    this.isLooping = false;
    this.startTime = null;
    this.endTime = null;
    this._notify();
  }

  /** Shift+点击清空起点 A；正在循环则先停止 */
  clearA() {
    if (this.isLooping) this._detachListener();
    this.isLooping = false;
    this.startTime = null;
    this.logger.info('清空 A');
    this._notify();
  }

  /** Shift+点击清空终点 B；正在循环则先停止 */
  clearB() {
    if (this.isLooping) this._detachListener();
    this.isLooping = false;
    this.endTime = null;
    this.logger.info('清空 B');
    this._notify();
  }

  getState() {
    return { startTime: this.startTime, endTime: this.endTime, isLooping: this.isLooping };
  }

  _notify() {
    if (typeof this.onChange === 'function') {
      this.onChange(this.getState());
    }
  }

  destroy() {
    this._detachListener();
  }
}

export { ABLoop };
