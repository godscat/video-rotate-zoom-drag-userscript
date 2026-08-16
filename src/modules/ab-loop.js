/**
 * A-B 循环模块 - 在视频的 A/B 区间内循环播放
 *
 * 状态全部在内存中（不写入 IndexedDB）：
 *  - A 起点（可仅设置 B 即开始循环，A 默认为 0）/ B 终点
 *  - 是否正在循环
 *
 * 实现：在 video 的 timeupdate 上检测到达 B 时回跳到 A。
 * 视频切换时由 App 调用 reset() 清空状态并解绑监听。
 */

import { getLogger } from './logger.js';
import { formatTime } from './util.js';

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

  /**
   * 获取当前绑定的视频
   * @returns {HTMLVideoElement}
   */
  get video() {
    return this.app.activeVideo;
  }

  /** 获取循环起点（未设置 A 时默认为 0） */
  getStartTime() {
    return this.startTime != null ? this.startTime : 0;
  }

  /** 设置起点 A（若 A 落在 B 之后则清空 B） */
  setA() {
    const v = this.video;
    if (!v) return;
    this.startTime = v.currentTime;
    if (this.endTime != null && this.endTime <= this.startTime) this.endTime = null;
    this.logger.info(`A = ${formatTime(this.startTime)}`);
    this._notify();
  }

  /** 设置终点 B（仅设置 B 即可循环，A 默认为 0；若已设 A 则 B 必须晚于 A） */
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
    this.logger.info(`B = ${formatTime(this.endTime)}`);
    this._notify();
  }

  canLoop() {
    if (this.endTime == null || this.endTime <= 0) return false;
    return this.startTime == null || this.endTime > this.startTime;
  }

  toggleLoop() {
    this.isLooping ? this.stop() : this.start();
  }

  start() {
    const v = this.video;
    if (!v || !this.canLoop()) {
      this.logger.warn(this.endTime == null ? '需要先设置循环终点 B' : '循环区间无效（B 必须大于 A）');
      return false;
    }
    this._detachListener();
    this._boundVideo = v;
    v.addEventListener('timeupdate', this._boundHandler);
    this.isLooping = true;
    v.currentTime = this.getStartTime();
    this.logger.info(`开始循环 ${formatTime(this.getStartTime())} → ${formatTime(this.endTime)}`);
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
      v.currentTime = this.getStartTime();
    }
  }

  /**
   * 微调起点 A（delta 秒）；A 未设置时按 0 处理
   * 结果钳制在 [0, B-0.1]（B 未设置则无上限），保留 0.1s 精度
   */
  nudgeStart(delta) {
    const base = this.getStartTime();
    let next = Math.round((base + delta) * 10) / 10;
    const max = this.endTime != null ? this.endTime - 0.1 : Infinity;
    next = Math.max(0, Math.min(next, max));
    if (this.startTime == null && next === 0 && delta < 0) return; // A 未设置（即 0）时负向无操作
    if (this.startTime != null && next === this.startTime) return;
    this.startTime = next;
    this.logger.info(`A 微调 = ${formatTime(this.startTime)}`);
    this._notify();
  }

  /**
   * 微调终点 B（delta 秒）；B 未设置时以当前播放时间为基础
   * 结果钳制在 [A+0.1, duration]，保留 0.1s 精度
   */
  nudgeEnd(delta) {
    const v = this.video;
    const base = this.endTime != null ? this.endTime : (v ? v.currentTime : 0);
    let next = Math.round((base + delta) * 10) / 10;
    if (this.endTime == null && next <= base) return; // B 未设置时以当前时间为基准，负向无操作
    const min = this.startTime != null ? this.startTime + 0.1 : 0.1;
    const max = v && isFinite(v.duration) && v.duration > 0 ? v.duration : Infinity;
    next = Math.min(Math.max(next, min), max);
    if (this.endTime != null && next === this.endTime) return;
    this.endTime = next;
    this.logger.info(`B 微调 = ${formatTime(this.endTime)}`);
    this._notify();
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
