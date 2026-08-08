import { CONSTANTS } from './constants.js';
import CONFIG from './config.js';

/**
 * 修饰键组合匹配：所选 modifiers 全部按下才返回 true
 * @param {KeyboardEvent|MouseEvent|WheelEvent} e
 * @param {'alt'|'ctrl'|'shift'} modifiers
 * @returns {boolean}
 */
function checkModifiers(e, modifiers) {
  if (!modifiers || modifiers.length === 0) return false;
  let keyNames = CONSTANTS.VALID_MODS_KEYNAMES;
  return modifiers.every((m) => {
    let keyName = keyNames[m];
    return e[keyName];
  });
}

/**
 * 数字前缀填充
 * @param {number} num
 * @param {number} width
 * @param {string} fillChar
 * @returns {string}
 */
function fillPrefixWith(num, width, fillChar = '0') {
  fillChar = fillChar ? fillChar[0] : '0';
  return String(num).padStart(width, fillChar);
}

/**
 * 格式化显示文本："{value}" 占位替换
 * @param {string} template - 模板字符串
 * @param {*} value - 值
 * @returns {string}
 */
function formatText(template, value) {
  return template.replace('{value}', value);
}

/**
 * 格式化秒：<1h 为 MM:SS，≥1h 为 H:MM:SS
 * 支持毫秒（由 CONFIG.abloop.showMilliseconds 控制）
 * @param {number} time
 * @returns {string}
 */
function formatTime(time) {
  let showMilliseconds = CONFIG.abloop.showMilliseconds;

  if (time == null) return '';
  if (!isFinite(time) || time < 0) time = 0;
  let fillFun = function (num) {
    return fillPrefixWith(num, 2);
  }
  const h = fillFun(Math.floor(time / 3600));
  const m = fillFun(Math.floor((time % 3600) / 60));
  const s = fillFun(Math.floor(time % 60));
  let displayTime = `${h}:${m}:${s}`;
  if (showMilliseconds) {
    const ms = fillPrefixWith(Math.floor(time * 1000) % 1000,3);
    displayTime = `${displayTime}.${ms}`;
  }
  return displayTime;
}

let __vrzTTPolicy;
function __vrzGetTTPolicy() {
  if (__vrzTTPolicy !== undefined) return __vrzTTPolicy;
  const tt = window.trustedTypes;
  if (tt && typeof tt.createPolicy === 'function') {
    try {
      __vrzTTPolicy = tt.createPolicy('vrz-html', { createHTML: (s) => s });
    } catch (e) {
      __vrzTTPolicy = null;
    }
  } else {
    __vrzTTPolicy = null;
  }
  return __vrzTTPolicy;
}

/**
 * 安全设置 innerHTML（兼容 Trusted Types；无 TT 环境降级为直接赋值）
 * @param {HTMLElement} el
 * @param {string} html
 */
function setHTML(el, html) {
  const p = __vrzGetTTPolicy();
  el.innerHTML = p ? p.createHTML(html) : html;
}

export { checkModifiers, formatText, formatTime, setHTML };
