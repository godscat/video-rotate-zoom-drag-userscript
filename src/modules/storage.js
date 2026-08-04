/**
 * 存储模块 - IndexedDB 封装（每站点配置）
 *
 * 数据库结构：
 *   DB: vrz-config (version 1)
 *   ├── store: siteConfig  (keyPath: host)   按站点保存拖拽/滚轮修饰键配置
 *   └── store: meta        (keyPath: key)    本数据库的说明信息（便于在 devtools 查看）
 *
 * 随页面源（origin）天然隔离，再按 location.hostname 做 key 实现"每站点单独保存"。
 * 当 IndexedDB 不可用（隐私模式等）时优雅降级：上层回退到默认值，仅丢失持久化。
 */

import { getLogger } from './logger.js';

const DB_NAME = 'vrz-config';
const DB_VERSION = 1;
const STORE_SITE = 'siteConfig';
const STORE_META = 'meta';
const META_KEY = 'about';

/** meta 说明记录（在建库/升级时写入，用于在 devtools 中识别本库用途） */
const META_RECORD = {
  key: META_KEY,
  purpose: '视频旋转/缩放/拖拽 用户脚本的每站点配置存储',
  detail:
    'siteConfig: 按 location.hostname 保存鼠标拖拽与滚轮缩放的修饰键配置；meta: 本数据库说明信息。',
  stores: {
    siteConfig: '站点配置，keyPath=host，值形如 {host, drag:{enabled,modifiers}, zoom:{enabled,modifiers}}',
    meta: '说明信息，keyPath=key',
  },
  createdAt: new Date().toISOString(),
};

/**
 * 打开/升级数据库
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前环境不支持 IndexedDB'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      // 关键：onupgradeneeded 期间只有"版本变更事务"在运行，
      // 绝不能用 db.transaction() 另起新事务（否则抛 InvalidStateError）。
      // 必须复用 req.transaction 或 createObjectStore 返回的 store 句柄。
      const versionTx = req.transaction;

      if (!db.objectStoreNames.contains(STORE_SITE)) {
        db.createObjectStore(STORE_SITE, { keyPath: 'host' });
      }

      if (!db.objectStoreNames.contains(STORE_META)) {
        // 新建 store 时用其返回句柄写入说明（属于版本变更事务）
        db.createObjectStore(STORE_META, { keyPath: 'key' }).put(META_RECORD);
      } else {
        // 升级场景：store 已存在，经版本变更事务刷新说明
        versionTx.objectStore(STORE_META).put(META_RECORD);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB 打开被阻塞'));
  });
}

/**
 * 读取某站点配置
 * @param {string} host
 * @returns {Promise<Object|null>}
 */
async function loadSiteConfig(host) {
  let db;
  try {
    db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SITE, 'readonly');
      const req = tx.objectStore(STORE_SITE).get(host);
      req.onsuccess = () => resolve(req.result ? { ...req.result } : null);
      req.onerror = () => reject(req.error);
    });
  } finally {
    if (db) db.close();
  }
}

/**
 * 写入/更新某站点配置（整体覆盖该 host 记录）
 * @param {string} host
 * @param {Object} data
 * @returns {Promise<boolean>}
 */
async function saveSiteConfig(host, data) {
  let db;
  try {
    db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SITE, 'readwrite');
      tx.objectStore(STORE_SITE).put({ host, ...data });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    if (db) db.close();
  }
}

/**
 * 触摸 meta 说明（用于外部主动刷新说明记录）
 */
async function touchMeta() {
  try {
    let db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_META, 'readwrite');
      tx.objectStore(STORE_META).put(META_RECORD);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    getLogger().createChild('Storage').warn('写入 meta 失败', e);
  }
}

export { loadSiteConfig, saveSiteConfig, touchMeta, DB_NAME, STORE_SITE, STORE_META };
