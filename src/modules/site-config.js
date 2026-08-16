/**
 * 站点配置模块 - 运行时配置持有者
 *
 * 职责：
 *  1. 持有当前站点的 drag/zoom 修饰键配置（默认值来自 CONFIG）
 *  2. 启动时经 config.site 从 GM_setValue 加载并合并（key 格式 vrz:site:{host}）
 *  3. 提供 getDragConfig()/getZoomConfig() 供 handler 读取
 *  4. setDrag()/setZoom() 写入运行时 + 持久化 + 通知订阅者（配置面板用）
 *
 * 规则：
 *  - enabled=true 时强制至少 1 个修饰键（min-1），全空会被回填默认
 *  - enabled=false 时清空 modifiers
 */

import config from './config.js';
import { CONSTANTS } from './constants.js';
import { getLogger } from './logger.js';

function cloneDefaults() {
  return {
    drag: {
      enabled: !!config.drag.enabled,
      modifiers: [...(config.drag.modifiers || ['shift'])],
    },
    zoom: {
      enabled: !!config.wheel.enabled,
      modifiers: [...(config.wheel.modifiers || ['shift'])],
    },
  };
}

function normModifiers(mods) {
  if (!Array.isArray(mods)) return [];
  return mods.filter((m) => CONSTANTS.VALID_MODS.includes(m));
}

class SiteConfig {
  constructor() {
    this.logger = getLogger().createChild('SiteConfig');
    this.host = (location.hostname || 'default').toString();
    this.data = cloneDefaults();
    this._subs = new Set();
    this._loaded = false;
  }

  /** 加载本站点配置（经 GM_setValue；失败则保持默认值） */
  load() {
    try {
      const saved = config.site[this.host];
      if (saved) {
        const dragMods = normModifiers(saved.drag && saved.drag.modifiers);
        const zoomMods = normModifiers(saved.zoom && saved.zoom.modifiers);
        this.data.drag = {
          enabled: saved.drag ? !!saved.drag.enabled : true,
          modifiers: dragMods.length ? dragMods : [...(config.drag.modifiers || ['shift'])],
        };
        this.data.zoom = {
          enabled: saved.zoom ? !!saved.zoom.enabled : true,
          modifiers: zoomMods.length ? zoomMods : [...(config.wheel.modifiers || ['shift'])],
        };
      }
      this._loaded = true;
      this.logger.info(`已加载站点配置 [${this.host}]`, this.data);
      this._notify();
    } catch (e) {
      this.logger.warn('加载站点配置失败，使用默认值', e);
    }
  }

  getDragConfig() {
    return this.data.drag;
  }

  getZoomConfig() {
    return this.data.zoom;
  }

  /**
   * 更新拖拽配置
   * @param {Object} partial - { enabled?, modifiers? }
   */
  async setDrag(partial) {
    const next = { ...this.data.drag, ...partial };
    next.modifiers = normModifiers(next.modifiers);
    if (next.enabled && next.modifiers.length === 0) {
      next.modifiers = [...(config.drag.modifiers || ['shift'])];
    }
    if (!next.enabled) next.modifiers = [];
    this.data.drag = next;
    this._persist();
    this._notify();
  }

  /**
   * 更新缩放（滚轮）配置
   */
  async setZoom(partial) {
    const next = { ...this.data.zoom, ...partial };
    next.modifiers = normModifiers(next.modifiers);
    if (next.enabled && next.modifiers.length === 0) {
      next.modifiers = [...(config.wheel.modifiers || ['shift'])];
    }
    if (!next.enabled) next.modifiers = [];
    this.data.zoom = next;
    this._persist();
    this._notify();
  }

  subscribe(fn) {
    this._subs.add(fn);
    return () => this._subs.delete(fn);
  }

  _notify() {
    this._subs.forEach((fn) => {
      try {
        fn(this.data);
      } catch (_) {}
    });
  }

  _persist() {
    try {
      config.site[this.host] = this.data;
    } catch (e) {
      this.logger.warn('保存站点配置失败', e);
    }
  }
}

export { SiteConfig };
