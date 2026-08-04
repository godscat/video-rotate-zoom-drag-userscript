/**
 * 站点配置模块 - 运行时配置持有者
 *
 * 职责：
 *  1. 持有当前站点的 drag/zoom 修饰键配置（默认值来自 CONFIG）
 *  2. 启动时从 IndexedDB 异步加载并合并
 *  3. 提供 getDragConfig()/getZoomConfig() 供 handler 读取
 *  4. setDrag()/setZoom() 写入运行时 + 持久化 + 通知订阅者（配置面板用）
 *
 * 规则：
 *  - enabled=true 时强制至少 1 个修饰键（min-1），全空会被回填默认
 *  - enabled=false 时清空 modifiers
 */

import CONFIG from './config.js';
import { loadSiteConfig, saveSiteConfig } from './storage.js';
import { getLogger } from './logger.js';

const VALID_MODS = ['alt', 'ctrl', 'shift'];

function cloneDefaults() {
  return {
    drag: {
      enabled: !!CONFIG.drag.enabled,
      modifiers: [...(CONFIG.drag.modifiers || ['shift'])],
    },
    zoom: {
      enabled: !!CONFIG.wheel.enabled,
      modifiers: [...(CONFIG.wheel.modifiers || ['shift'])],
    },
  };
}

function normModifiers(mods) {
  if (!Array.isArray(mods)) return [];
  return mods.filter((m) => VALID_MODS.includes(m));
}

class SiteConfig {
  constructor() {
    this.logger = getLogger().createChild('SiteConfig');
    this.host = (location.hostname || 'default').toString();
    this.data = cloneDefaults();
    this._subs = new Set();
    this._loaded = false;
  }

  /** 异步加载本站点配置（失败则保持默认值） */
  async load() {
    try {
      const saved = await loadSiteConfig(this.host);
      if (saved) {
        const dragMods = normModifiers(saved.drag && saved.drag.modifiers);
        const zoomMods = normModifiers(saved.zoom && saved.zoom.modifiers);
        this.data.drag = {
          enabled: saved.drag ? !!saved.drag.enabled : true,
          modifiers: dragMods.length ? dragMods : [...(CONFIG.drag.modifiers || ['shift'])],
        };
        this.data.zoom = {
          enabled: saved.zoom ? !!saved.zoom.enabled : true,
          modifiers: zoomMods.length ? zoomMods : [...(CONFIG.wheel.modifiers || ['shift'])],
        };
      }
      this._loaded = true;
      this.logger.info(`已加载站点配置 [${this.host}]`, this.data);
      this._notify();
    } catch (e) {
      this.logger.warn('加载站点配置失败，使用默认值', e);
    }
    return this.data;
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
      next.modifiers = [...(CONFIG.drag.modifiers || ['shift'])];
    }
    if (!next.enabled) next.modifiers = [];
    this.data.drag = next;
    await this._persist();
    this._notify();
  }

  /**
   * 更新缩放（滚轮）配置
   */
  async setZoom(partial) {
    const next = { ...this.data.zoom, ...partial };
    next.modifiers = normModifiers(next.modifiers);
    if (next.enabled && next.modifiers.length === 0) {
      next.modifiers = [...(CONFIG.wheel.modifiers || ['shift'])];
    }
    if (!next.enabled) next.modifiers = [];
    this.data.zoom = next;
    await this._persist();
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

  async _persist() {
    try {
      await saveSiteConfig(this.host, this.data);
    } catch (e) {
      this.logger.warn('保存站点配置失败', e);
    }
  }
}

/**
 * 修饰键组合匹配：所选 modifiers 全部按下才返回 true
 * @param {KeyboardEvent|MouseEvent|WheelEvent} e
 * @param {string[]} modifiers
 * @returns {boolean}
 */
function checkModifiers(e, modifiers) {
  if (!modifiers || modifiers.length === 0) return false;
  return modifiers.every((m) => {
    if (m === 'ctrl') return !!(e.ctrlKey || e.metaKey);
    if (m === 'shift') return !!e.shiftKey;
    if (m === 'alt') return !!e.altKey;
    return false;
  });
}

export { SiteConfig, checkModifiers, VALID_MODS };
