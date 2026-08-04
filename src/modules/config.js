/**
 * 配置模块 - 统一管理参数与快捷键
 *
 * 新架构不再依赖平台 CSS 选择器：
 *  - 视频发现：直接 document.querySelector('video') + play 事件
 *  - UI 定位：浮层 position:fixed 跟随 video 父元素 rect
 *  - 变换目标：<video> 元素本身（动态 <style> 标签）
 *
 * 因此本配置仅保留：缩放/旋转/移动参数、拖拽/滚轮修饰键、键盘快捷键。
 */

const CONFIG = {
  // 缩放参数
  zoom: {
    min: 50,
    max: 300,
    step: 5,
    default: 100,
  },

  // 旋转参数（90° 增量，支持双向）
  rotation: {
    step: 90,
    default: 0,
  },

  // 键盘移动步长（像素）
  move: {
    stepSize: 20,
  },

  // 视频激活阈值：渲染尺寸小于此值的视频（如信息流封面预览）不激活、不显示工具条
  video: {
    minActivateWidth: 400,
    minActivateHeight: 225,
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

  // UI 行为
  ui: {
    hideDelay: 3000, // 鼠标离开后隐藏延时（毫秒）
  },

  // 键盘快捷键：使用 e.code（物理按键，不受输入法/Shift 影响）
  // mod: 'ctrl' | 'shift' | 'alt' | 'none'
  shortcuts: {
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
    abToggle:     { mod: 'none',  code: 'Backslash' },       // \

    // 面板
    showHelp:     { mod: 'none',  code: 'KeyH' },            // h
    showConfig:   { mod: 'none',  code: 'Comma' },           // ,
    toggleExpand: { mod: 'none',  code: 'Period' },          // .
  },

  // 日志开关
  log: {
    enabled: true,
  },
};

/**
 * 格式化显示文本："{value}%" / "{value}°"
 * @param {string} format - 格式字符串
 * @param {*} value - 值
 * @returns {string}
 */
function formatText(format, value) {
  return format.replace('{value}', value);
}

export default CONFIG;
export { formatText };
