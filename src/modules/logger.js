/**
 * 日志模块 - 统一管理日志输出
 *
 * 输出格式：[<时间戳>?][<tag>]@[<host>] [<级别>] <消息>
 *   - tag：项目标识，默认 'vrz'
 *   - host：location.hostname（无 location 环境回退 'unknown'）
 *   - module：模块名（createChild 传入并存储，当前格式不输出；保留以备将来按模块分日志）
 *   - timePrefix：是否在行首加 [HH:MM:SS]，默认 false；createChild 未传则继承父 logger
 *
 * createChild(module, timePrefix?)：派生子 logger，继承 tag/host/enabled，可覆盖 timePrefix
 * use()：返回自身（共用单例场景）
 */

export class Logger {
  constructor({ tag = 'vrz', host, module = '', enabled = true, timePrefix = false } = {}) {
    this.tag = tag;
    this.host = host || (typeof location !== 'undefined' && location.hostname ? location.hostname : 'unknown');
    this.module = module;
    this.enabled = enabled;
    this.timePrefix = timePrefix;
  }

  /**
   * 获取当前时间戳
   * @private
   * @returns {string} HH:MM:SS 格式
   */
  _getTimestamp() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  }

  /**
   * 格式化日志消息
   * @private
   * @param {string} level - 日志级别
   * @param {Array} args - 日志参数
   * @returns {Array} 格式化后的参数
   */
  _formatMessage(level, args) {
    let prefix = '';
    if (this.timePrefix) prefix += `[${this._getTimestamp()}] `;
    prefix += `[${this.tag}]@[${this.host}] [${level}]`;
    return [prefix, ...args];
  }

  info(...args) {
    if (!this.enabled) return;
    console.log(...this._formatMessage('INFO', args));
  }

  warn(...args) {
    if (!this.enabled) return;
    console.warn(...this._formatMessage('WARN', args));
  }

  error(...args) {
    if (!this.enabled) return;
    console.error(...this._formatMessage('ERROR', args));
  }

  debug(...args) {
    if (!this.enabled) return;
    console.debug(...this._formatMessage('DEBUG', args));
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  isEnabled() {
    return this.enabled;
  }

  /**
   * 派生子 logger：继承 tag/host/enabled，记录 module；
   * timePrefix 未传（undefined）则继承当前 logger 的值
   * @param {string} module - 模块名
   * @param {boolean} [timePrefix] - 是否加时间戳，省略则继承
   * @returns {Logger} 新的日志器实例
   */
  createChild(module = '', timePrefix) {
    return new Logger({
      tag: this.tag,
      host: this.host,
      module: module,
      enabled: this.enabled,
      timePrefix: timePrefix === undefined ? this.timePrefix : timePrefix,
    });
  }

  /**
   * 返回自身（共用单例场景）
   * @returns {Logger}
   */
  use() {
    return this;
  }
}

// 全局日志器单例实例
let globalLogger = null;

/**
 * 获取全局日志器实例（单例，options 仅首次调用时生效）
 * @param {Object} [options] - Logger 构造选项
 * @returns {Logger} 全局日志器实例
 */
export function getLogger(options) {
  if (!globalLogger) {
    globalLogger = new Logger(options && typeof options === 'object' ? options : {});
  }
  return globalLogger;
}
