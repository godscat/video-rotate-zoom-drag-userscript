/**
 * 平台检测模块 - 根据URL自动检测当前平台
 */
import { getLogger } from "./logger.js";

// 获取全局日志器实例
const logger = getLogger().createChild('PlatformDetector');

/**
 * 平台配置映射
 */
const PLATFORM_PATTERNS = {
  bilibili: {
    patterns: [
      /https?:\/\/www\.bilibili\.com\//,
      /https?:\/\/bangumi\.bilibili\.com\//,
      /https?:\/\/b23\.tv\//
    ],
    name: 'Bilibili'
  },
  youtube: {
    patterns: [
      /https?:\/\/www\.youtube\.com\//,
      /https?:\/\/youtu\.be\//,
      /https?:\/\/m\.youtube\.com\//
    ],
    name: 'YouTube'
  },
  youku: {
    patterns: [
      /https?:\/\/www\.youku\.com\//,
      /https?:\/\/v\.youku\.com\//
    ],
    name: 'Youku'
  },
  iqiyi: {
    patterns: [
      /https?:\/\/www\.iqiyi\.com\//,
      /https?:\/\/www\.iq\.com\//
    ],
    name: 'iQIYI'
  },
  iwara: {
    patterns: [
      /https?:\/\/www\.iwara\.tv\//
    ],
    name: 'Iwara'
  },
};

/**
 * 根据当前URL检测平台
 * @returns {string} 检测到的平台名称，默认返回 'bilibili'
 */
function detectPlatform() {
  const currentUrl = window.location.href;

  for (const [platform, config] of Object.entries(PLATFORM_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(currentUrl)) {
        logger.info(`检测到平台: ${config.name} (${platform})`);
        return platform;
      }
    }
  }

  // 默认返回 bilibili
  logger.warn('未检测到已知平台，使用默认 bilibili');
  return 'bilibili';
}

/**
 * 获取平台信息
 * @param {string} platform - 平台名称
 * @returns {Object|null} 平台信息
 */
function getPlatformInfo(platform) {
  return PLATFORM_PATTERNS[platform] || null;
}

/**
 * 获取所有支持的平台
 * @returns {Array<string>} 支持的平台列表
 */
function getSupportedPlatforms() {
  return Object.keys(PLATFORM_PATTERNS);
}

/**
 * 验证平台是否支持
 * @param {string} platform - 平台名称
 * @returns {boolean} 是否支持该平台
 */
function isPlatformSupported(platform) {
  return platform in PLATFORM_PATTERNS;
}

export {
  detectPlatform,
  getPlatformInfo,
  getSupportedPlatforms,
  isPlatformSupported,
  PLATFORM_PATTERNS
};