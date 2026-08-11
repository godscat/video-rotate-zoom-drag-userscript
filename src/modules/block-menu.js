/**
 * 黑白名单菜单模块 - 通过 GM_registerMenuCommand 提供 Tampermonkey 菜单管理
 *
 * 即使站点被黑白名单拦截（脚本不启动），菜单仍可操作，
 * 解决「被拦截的站点看不到配置面板」的鸡生蛋问题。
 *
 * 菜单结构（页面加载时按当前状态一次性注册）：
 *   VRZ: ✓/✗ 黑名单已启用/禁用（点击切换）
 *   VRZ: ✓/✗ 白名单已启用/禁用（点击切换）
 *   VRZ: ═══ 黑名单 ═══           ← 仅黑名单启用时显示
 *   VRZ: 加入/移出黑名单（hostname）
 *   VRZ: ═══ 白名单 ═══           ← 仅白名单启用时显示
 *   VRZ: 加入/移出白名单（hostname）
 *
 * 操作后保存配置并刷新页面——黑白名单变更本身就需要刷新才生效，
 * 刷新后菜单自然呈现正确状态，无需 GM_unregisterMenuCommand。
 */

import { setPref } from './util.js';

const SEP = '\u2550\u2550\u2550';

class BlockMenu {
  /**
   * @param {string} hostname
   * @param {Object} block - { useBlacklist, useWhitelist, blacklist[], whitelist[] }
   */
  constructor(hostname, block) {
    this.hostname = hostname;
    this.block = block;
  }

  /**
   * 按当前状态注册菜单项（仅在页面加载时调用一次）
   */
  register() {
    if (typeof GM_registerMenuCommand !== 'function') return;

    // ── 启禁用开关 ──
    GM_registerMenuCommand(
      this.block.useBlacklist
        ? 'VRZ: \u2713 黑名单已启用（点击禁用）'
        : 'VRZ: \u2717 黑名单已禁用（点击启用）',
      () => this._act(() => { this.block.useBlacklist = !this.block.useBlacklist; }),
    );
    GM_registerMenuCommand(
      this.block.useWhitelist
        ? 'VRZ: \u2713 白名单已启用（点击禁用）'
        : 'VRZ: \u2717 白名单已禁用（点击启用）',
      () => this._act(() => { this.block.useWhitelist = !this.block.useWhitelist; }),
    );

    // ── 黑名单操作（仅黑名单启用时显示）──
    if (this.block.useBlacklist) {
      GM_registerMenuCommand(`VRZ: ${SEP} 黑名单 ${SEP}`, () => {});
      if (this.block.blacklist.includes(this.hostname)) {
        GM_registerMenuCommand(
          `VRZ: 移出黑名单（${this.hostname}）`,
          () => this._act(() => {
            this.block.blacklist = this.block.blacklist.filter((h) => h !== this.hostname);
          }),
        );
      } else {
        GM_registerMenuCommand(
          `VRZ: 加入黑名单（${this.hostname}）`,
          () => this._act(() => { this.block.blacklist.push(this.hostname); }),
        );
      }
    }

    // ── 白名单操作（仅白名单启用时显示）──
    if (this.block.useWhitelist) {
      GM_registerMenuCommand(`VRZ: ${SEP} 白名单 ${SEP}`, () => {});
      if (this.block.whitelist.includes(this.hostname)) {
        GM_registerMenuCommand(
          `VRZ: 移出白名单（${this.hostname}）`,
          () => this._act(() => {
            this.block.whitelist = this.block.whitelist.filter((h) => h !== this.hostname);
          }),
        );
      } else {
        GM_registerMenuCommand(
          `VRZ: 加入白名单（${this.hostname}）`,
          () => this._act(() => { this.block.whitelist.push(this.hostname); }),
        );
      }
    }
  }

  /**
   * 执行操作 → 保存 → 刷新页面
   * 黑白名单变更需要刷新才生效，菜单也自然刷新为正确状态。
   */
  _act(fn) {
    fn();
    setPref('block', this.block);
    setTimeout(() => location.reload(), 100);
  }
}

export { BlockMenu };
