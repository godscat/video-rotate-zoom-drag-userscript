/**
 * 配置模块 - 统一管理参数与快捷键
 *
 * 新架构不再依赖平台 CSS 选择器：
 *  - 视频发现：直接 document.querySelector('video') + play 事件
 *  - UI 定位：浮层 position:fixed 跟随视频父元素 rect
 *  - 变换目标：<video> 元素本身（动态 <style> 标签）
 *
 * 本模块提供两层接口：
 *  1. CONFIG：默认配置（仅供本模块内部 / 初始化使用，模块内一律不要直接读它）
 *  2. config（默认导出）：运行时统一配置入口，Proxy 包装
 *     - 读写「持久化路径」时自动经 GM_setValue/GM_getValue（存储 key = 'vrz:' + 路径）
 *     - 其余路径直接透传到 CONFIG 内存值
 *     - 站点配置经虚拟路径 config.site[host] 整份读写（key 'vrz:site:<host>'）
 *
 * 规则：模块内统一使用 config，不直接操作 CONFIG / getPref / setPref
 * （初始化与 Proxy handler 内部除外）。
 */

import { getPref, setPref } from './util.js';

const CONFIG = {
  // 缩放参数
  zoom: {
    min: 50,
    max: 300,
    step: 5,
    default: 100,
    levels: [100, 125, 150, 175, 200, 225, 250, 275, 300],
  },

  // 旋转参数（90° 增量，支持双向）
  rotation: {
    step: 90,
    default: 0,
  },

  // 视频平移步长（像素）
  move: {
    stepSize: 20,
  },

  // 视频激活阈值：渲染尺寸小于此值的视频（如信息流封面预览）不激活、不显示工具条
  video: {
    minActivateWidth: 400,
    minActivateHeight: 225,
  },

  block: {
    useBlacklist: true,
    useWhitelist: false,
    // 站点黑名单：hostname 精确匹配，命中则脚本完全不启动（不绑定任何监听）
    blacklist: [
      's1.hdslb.com',          // B 站静态资源域
      'message.bilibili.com',  // B 站消息中心
      'challenges.cloudflare.com', // .cloudflare 人机验证
    ],
    whitelist: [],
  },
  // 拖拽配置（修饰键组合，默认 shift；按站点可配置并持久化）
  drag: {
    enabled: true,
    modifiers: ['shift'], // ['alt','ctrl','shift'] 的任意组合
  },

  // 滚轮缩放配置（修饰键组合，默认 shift）
  wheel: {
    enabled: true,
    modifiers: ['shift'],
  },

  // UI 行为（全局，经 Proxy 持久化）
  ui: {
    hideDelay: 2000, // 鼠标离开后隐藏延时（毫秒）
    bottomBase: 14,  // B 方案：工具条距 video 底边的基础偏移（避开原生控制栏）
    persistOnPause: false, // 暂停时工具条常驻显示（可在配置面板切换，全局生效）
    wakeKeyEnabled: true,  // 全局唤醒键 Alt+`（默认开启，不依赖快捷键总开关）
    verticalOffset: 4,     // A 方案：工具条相对 video 顶部的垂直偏移（px）
    horizontalOffset: 4,   // A 方案：工具条相对 video 左侧的水平偏移（px）
    pointerWakeThreshold: 8, // 移动鼠标唤醒工具条的最小移动距离（px），越小越灵敏
    wakeBgAlpha: 0.6,      // 全局唤醒固定显示时工具条背景不透明度（普通 0.3），可微调 0~1
  },

  // 倍速播放可选档位（降序）
  playbackSpeeds: [2.0, 1.5, 1.25, 1.0, 0.75, 0.5],

  // 键盘快捷键：使用 e.code（物理按键，不受输入法/Shift 影响）
  // mod: 'ctrl' | 'shift' | 'alt' | 'none'
  // enabled: 全局主开关（默认禁用，可在配置面板启用）
  // groups: 各分组独立开关（默认全开，随 enabled 一起持久化）
  shortcuts: {
    enabled: false,
    groups: {
      zoom: true, rotate: true, fullscreen: true, reset: true,
      move: true, abLoop: true, panels: true,
    },
    zoomIn:      { mod: 'shift', code: 'Equal' },     // Shift + +/= 键
    zoomOut:     { mod: 'shift', code: 'Minus' },     // Shift + -/_ 键
    rotateLeft:  { mod: 'shift', code: 'KeyL' },      // Shift + L
    rotateRight: { mod: 'shift', code: 'KeyR' },      // Shift + R
    reset:       { mod: 'shift', code: 'Digit0' },    // Shift + 0
    fullscreen:  { mod: 'shift', code: 'Space' },     // Shift + Space
    moveUp:      { mod: 'shift', code: 'ArrowUp' },
    moveDown:    { mod: 'shift', code: 'ArrowDown' },
    moveLeft:    { mod: 'shift', code: 'ArrowLeft' },
    moveRight:   { mod: 'shift', code: 'ArrowRight' },

    // A-B 循环
    abClearA:     { mod: 'shift', code: 'BracketLeft' },    // Shift+[ → {
    abClearB:     { mod: 'shift', code: 'BracketRight' },   // Shift+] → }
    abSetA:       { mod: 'none',  code: 'BracketLeft' },    // [
    abSetB:       { mod: 'none',  code: 'BracketRight' },   // ]
    abToggle:     { mod: 'none',  code: 'Backslash' },       // \\

    // 面板
    showHelp:     { mod: 'none',  code: 'KeyH' },            // h
    showConfig:   { mod: 'none',  code: 'Comma' },           // ,
    toggleExpand: { mod: 'none',  code: 'Period' },          // .
  },

  // 快捷键分组（用于配置面板独立开关；键名对应 shortcuts 中的 key）
  shortcutGroups: {
    zoom: ['zoomIn', 'zoomOut'],
    rotate: ['rotateLeft', 'rotateRight'],
    fullscreen: ['fullscreen'],
    reset: ['reset'],
    move: ['moveUp', 'moveDown', 'moveLeft', 'moveRight'],
    abLoop: ['abClearA', 'abClearB', 'abSetA', 'abSetB', 'abToggle'],
    panels: ['showHelp', 'showConfig', 'toggleExpand'],
  },

  // 日志开关（开发阶段默认开启；正式发布前可改 false）
  log: {
    enabled: true,
  },
};

// ===== 统一配置存取（Proxy） =====

// 需要持久化的配置路径（存储 key = 'vrz:' + 路径，与 config.js 属性路径对齐）
const PERSIST_PATHS = new Set([
  'block',
  'ui.persistOnPause',
  'ui.wakeKeyEnabled',
  'ui.verticalOffset',
  'ui.horizontalOffset',
  'ui.pointerWakeThreshold',
  'ui.wakeBgAlpha',
  'shortcuts.enabled',
  'shortcuts.groups',
]);

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** 深合并：以 base 为骨架，用 extra 覆盖（数组整体替换） */
function deepMerge(base, extra) {
  const out = Array.isArray(base) ? base.slice() : { ...base };
  if (isPlainObject(extra)) {
    for (const k of Object.keys(extra)) {
      if (isPlainObject(extra[k]) && isPlainObject(out[k])) out[k] = deepMerge(out[k], extra[k]);
      else out[k] = extra[k];
    }
  }
  return out;
}

/** 站点配置虚拟分支：config.site[host] 读整份，config.site[host] = data 写整份 */
function createSiteProxy() {
  return new Proxy({}, {
    get(t, host) {
      if (typeof host === 'symbol') return undefined;
      return getPref('vrz:site:' + host, null);
    },
    set(t, host, value) {
      if (typeof host === 'symbol') return true;
      setPref('vrz:site:' + host, value);
      return true;
    },
  });
}

function createProxy(target, path = []) {
  if (!isPlainObject(target)) return target;
  return new Proxy(target, {
    get(t, prop) {
      if (typeof prop === 'symbol') return t[prop];
      const p = path.length ? path.join('.') + '.' + prop : String(prop);
      if (p === 'site') return createSiteProxy();
      if (PERSIST_PATHS.has(p)) {
        const stored = getPref('vrz:' + p, null);
        if (stored === null || stored === undefined) return t[prop];
        if (isPlainObject(t[prop]) && isPlainObject(stored)) return deepMerge(t[prop], stored);
        return stored;
      }
      return createProxy(t[prop], path.concat(prop));
    },
    set(t, prop, value) {
      if (typeof prop === 'symbol') { t[prop] = value; return true; }
      const p = path.length ? path.join('.') + '.' + prop : String(prop);
      if (PERSIST_PATHS.has(p)) setPref('vrz:' + p, value);
      if (isPlainObject(value)) {
        t[prop] = deepMerge(isPlainObject(t[prop]) ? t[prop] : {}, value);
      } else {
        t[prop] = value;
      }
      return true;
    },
  });
}

/** 旧存储键 → 新键（vrz: 前缀 + 配置路径）一次性迁移 */
function migratePrefs() {
  try {
    const MIGRATIONS = [
      ['vrz-persist-on-pause', 'vrz:ui.persistOnPause'],
      ['vrz-kb-enabled', 'vrz:shortcuts.enabled'],
      ['vrz-kb-groups', 'vrz:shortcuts.groups'],
      ['block', 'vrz:block'],
    ];
    for (const [oldKey, newKey] of MIGRATIONS) {
      if (getPref(newKey, null) === null) {
        const old = getPref(oldKey, null);
        if (old !== null && old !== undefined) setPref(newKey, old);
      }
    }
    // 站点配置键 vrz-site:{host} → vrz:site:{host}：GM 存储不可枚举，跳过（站点配置随使用重建）
  } catch (e) {}
}

migratePrefs();

// 运行时统一配置入口（默认导出）
const config = createProxy(CONFIG);

export { CONFIG };
export default config;
