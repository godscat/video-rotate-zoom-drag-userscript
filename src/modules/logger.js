/**
 * 日志模块 - 统一管理日志输出，支持开关和时间前缀
 */

export class Logger {
  constructor(prefix = "VideoScript", enabled = true) {
    this.prefix = prefix;
    this.enabled = enabled;
  }

  /**
   * 获取当前时间戳
   * @private
   * @returns {string} 格式化的时间戳
   */
  _getTimestamp() {
    const now = new Date();
    return now.toTimeString().split(' ')[0]; // HH:MM:SS 格式
  }

  /**
   * 格式化日志消息
   * @private
   * @param {string} level - 日志级别
   * @param {Array} args - 日志参数
   * @returns {Array} 格式化后的参数
   */
  _formatMessage(level, args) {
    const timestamp = this._getTimestamp();
    const formattedPrefix = `[${timestamp}] [${this.prefix}] [${level}]`;
    return [formattedPrefix, ...args];
  }

  /**
   * 输出信息日志
   * @param {...any} args - 日志参数
   */
  info(...args) {
    if (!this.enabled) return;
    console.log(...this._formatMessage('INFO', args));
  }

  /**
   * 输出警告日志
   * @param {...any} args - 日志参数
   */
  warn(...args) {
    if (!this.enabled) return;
    console.warn(...this._formatMessage('WARN', args));
  }

  /**
   * 输出错误日志
   * @param {...any} args - 日志参数
   */
  error(...args) {
    if (!this.enabled) return;
    console.error(...this._formatMessage('ERROR', args));
  }

  /**
   * 输出调试日志
   * @param {...any} args - 日志参数
   */
  debug(...args) {
    if (!this.enabled) return;
    console.debug(...this._formatMessage('DEBUG', args));
  }

  /**
   * 启用日志
   */
  enable() {
    this.enabled = true;
  }

  /**
   * 禁用日志
   */
  disable() {
    this.enabled = false;
  }

  /**
   * 检查日志是否启用
   * @returns {boolean} 是否启用
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * 创建带特定前缀的子日志器
   * @param {string} subPrefix - 子前缀
   * @returns {Logger} 新的日志器实例
   */
  createChild(subPrefix) {
    return new Logger(`${this.prefix}:${subPrefix}`, this.enabled);
  }
}

// 全局日志器单例实例
let globalLogger = null;

/**
 * 获取全局日志器实例
 * @param {string} prefix - 日志前缀（仅在首次调用时使用）
 * @param {boolean} enabled - 是否启用（仅在首次调用时使用）
 * @returns {Logger} 全局日志器实例
 */
export function getLogger(prefix = 'VideoController', enabled = true) {
  if (!globalLogger) {
    globalLogger = new Logger(prefix, enabled);
  }
  return globalLogger;
}

// 创建默认日志器实例（保持向后兼容）
export const defaultLogger = getLogger();