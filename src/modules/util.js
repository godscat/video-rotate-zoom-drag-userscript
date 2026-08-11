import { CONSTANTS } from "./constants.js";
import CONFIG from "./config.js";

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
function fillPrefixWith(num, width, fillChar = "0") {
  fillChar = fillChar ? fillChar[0] : "0";
  return String(num).padStart(width, fillChar);
}

/**
 * 格式化显示文本："{value}" 占位替换
 * @param {string} template - 模板字符串
 * @param {*} value - 值
 * @returns {string}
 */
function formatText(template, value) {
  return template.replace("{value}", value);
}

/**
 * 格式化秒：H:MM:SS.d（始终带一位小数，0.1s 精度）
 * @param {number} time
 * @returns {string}
 */
function formatTime(time) {
  if (time == null) return "";
  if (!isFinite(time) || time < 0) time = 0;
  let fillFun = function (num) {
    return fillPrefixWith(num, 2);
  };
  const h = fillFun(Math.floor(time / 3600));
  const m = fillFun(Math.floor((time % 3600) / 60));
  const s = fillFun(Math.floor(time % 60));
  const d = Math.floor((time % 1) * 10);
  let displayTime = `${h}:${m}:${s}.${d}`;
  return displayTime;
}

let __vrzTTPolicy;
function __vrzGetTTPolicy() {
  if (__vrzTTPolicy !== undefined) return __vrzTTPolicy;
  const tt = window.trustedTypes;
  if (tt && typeof tt.createPolicy === "function") {
    try {
      __vrzTTPolicy = tt.createPolicy("vrz-html", { createHTML: (s) => s });
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

/**
 * 读取全局偏好（跨站点，经 GM_getValue；无 GM 环境返回默认值）
 * @param {string} key 键
 * @param {*} defaultValue 默认值
 * @param {boolean} persist 持久化存储默认值
 * @returns {*}
 */
function getPref(key, defaultValue, persist = false) {
  try {
    if (typeof GM_getValue === "function") {
      let val = GM_getValue(key, null);
      if (val === null && defaultValue !== undefined && defaultValue !== null) {
        if (persist) setPref(key, defaultValue);
        return defaultValue;
      } else {
        return val;
      }
    }
  } catch (e) {}
  return defaultValue;
}

/**
 * 写入全局偏好（跨站点，经 GM_setValue）
 * @param {string} key
 * @param {*} value
 */
function setPref(key, value) {
  try {
    if (typeof GM_setValue === "function") GM_setValue(key, value);
  } catch (e) {}
}

export { checkModifiers, formatText, formatTime, setHTML, getPref, setPref };
