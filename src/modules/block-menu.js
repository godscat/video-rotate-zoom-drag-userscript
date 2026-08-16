/**
 * 黑白名单菜单模块 - GM 菜单入口 + 懒加载管理面板
 *
 * GM 菜单仅注册一项「管理黑白名单」，点击后才创建 DOM、注入样式、绑定事件。
 * 面板内可：启禁用黑白名单、增删站点，实时保存（GM_setValue）。
 *
 * 即使站点被拦截（脚本不启动），菜单仍可操作——解决「看不到配置面板」的问题。
 */

import { setHTML } from './util.js';
import config from './config.js';
import { Styles } from './styles.js';

class BlockMenu {
  /**
   * @param {string} hostname
   * @param {Object} block - { useBlacklist, useWhitelist, blacklist[], whitelist[] }
   */
  constructor(hostname, block) {
    this.hostname = hostname;
    this.block = block;
    this._panel = null;
    this._dirty = false;
  }

  register() {
    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand('VRZ: 管理黑白名单', () => this._open());
    }
  }

  // ── iframe 域名监听（面板打开时启动，关闭时停止）──

  _startIframeWatch() {
    if (this._iframeObserver) return;
    this._lastHosts = this._scanHosts();
    this._iframeObserver = new MutationObserver(() => {
      clearTimeout(this._iframeTimer);
      this._iframeTimer = setTimeout(() => {
        const newHosts = this._scanHosts();
        const changed = this._lastHosts.length !== newHosts.length
          || newHosts.some((h) => !this._lastHosts.includes(h));
        if (changed) {
          this._lastHosts = newHosts;
          this._refreshDiscovered();
        }
      }, 300);
    });
    this._iframeObserver.observe(document.body, { childList: true, subtree: true });
  }

  _stopIframeWatch() {
    if (this._iframeObserver) {
      this._iframeObserver.disconnect();
      this._iframeObserver = null;
    }
    clearTimeout(this._iframeTimer);
  }

  // ── 面板 ──

  _open() {
    if (!this._panel) this._build();
    this._dirty = false;
    this._refresh();
    this._panel.classList.remove('hidden');
    this._startIframeWatch();
  }

  _close() {
    if (this._panel) this._panel.classList.add('hidden');
    this._stopIframeWatch();
  }

  _build() {
    Styles.inject();

    const overlay = document.createElement('div');
    overlay.className = 'vrz-modal-overlay hidden';
    setHTML(overlay, `
      <div class="vrz-modal" role="dialog" aria-modal="true" style="width:420px">
        <div class="vrz-modal-title">黑白名单管理</div>
        <div class="vrz-modal-sub">当前站点：<span class="vrz-host"></span></div>
        <div class="vrz-modal-sections"></div>
        <div class="vrz-modal-actions">
          <button class="vrz-block-reload" disabled>刷新页面</button>
          <button class="vrz-modal-close">关闭</button>
        </div>
      </div>`);

    overlay.querySelector('.vrz-host').textContent = this.hostname;

    const sections = overlay.querySelector('.vrz-modal-sections');
    sections.appendChild(this._buildDiscovered());
    sections.appendChild(this._buildSection('blacklist', '黑名单', 'bl'));
    sections.appendChild(this._buildSection('whitelist', '白名单', 'wl'));

    overlay.querySelector('.vrz-block-reload').addEventListener('click', () => {
      location.reload();
    });
    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) this._close();
    });
    overlay.querySelector('.vrz-modal-close').addEventListener('click', () => this._close());

    document.body.appendChild(overlay);
    this._panel = overlay;
  }

  /**
   * 扫描当前页面所有 iframe 的 hostname（实时读取 DOM，不持久化）
   */
  _scanHosts() {
    const hosts = [this.hostname];
    document.querySelectorAll('iframe[src]').forEach((iframe) => {
      try {
        const h = new URL(iframe.src).hostname;
        if (h && !hosts.includes(h)) hosts.push(h);
      } catch (e) {}
    });
    return hosts;
  }

  _buildDiscovered() {
    const sec = document.createElement('div');
    sec.className = 'vrz-modal-section';
    sec.dataset.key = 'discovered';
    setHTML(sec, `
      <div class="vrz-modal-section-title">本页发现的域名</div>
      <div class="vrz-block-discovered"></div>`);
    return sec;
  }

  _refreshDiscovered() {
    const sec = this._panel.querySelector('[data-key="discovered"]');
    if (!sec) return;
    const container = sec.querySelector('.vrz-block-discovered');
    while (container.firstChild) container.removeChild(container.firstChild);

    const hosts = this._scanHosts();
    hosts.forEach((host) => {
      const inBl = this.block.blacklist.includes(host);
      const inWl = this.block.whitelist.includes(host);
      const isCurrent = host === this.hostname;

      const row = document.createElement('div');
      row.className = 'vrz-block-item';

      const name = document.createElement('span');
      name.className = 'vrz-block-host';
      let suffix = isCurrent ? ' （当前）' : '';
      if (inBl) suffix += ' [黑名单]';
      if (inWl) suffix += ' [白名单]';
      name.textContent = host + suffix;

      const actions = document.createElement('div');
      actions.className = 'vrz-block-quick';

      const blBtn = document.createElement('button');
      blBtn.className = 'vrz-block-tag' + (inBl ? ' active' : '');
      blBtn.textContent = '黑';
      blBtn.title = inBl ? '移出黑名单' : '加入黑名单';
      blBtn.addEventListener('click', () => {
        if (inBl) {
          this.block.blacklist = this.block.blacklist.filter((h) => h !== host);
        } else {
          this._addToBlacklist(host);
        }
        this._save();
        this._refresh();
      });

      const wlBtn = document.createElement('button');
      wlBtn.className = 'vrz-block-tag' + (inWl ? ' active' : '');
      wlBtn.textContent = '白';
      wlBtn.title = inWl ? '移出白名单' : '加入白名单';
      wlBtn.addEventListener('click', () => {
        if (inWl) {
          this.block.whitelist = this.block.whitelist.filter((h) => h !== host);
        } else {
          this._addToWhitelist(host);
        }
        this._save();
        this._refresh();
      });

      actions.appendChild(blBtn);
      actions.appendChild(wlBtn);
      row.appendChild(name);
      row.appendChild(actions);
      container.appendChild(row);
    });
  }

  _buildSection(key, label, prefix) {
    const sec = document.createElement('div');
    sec.className = 'vrz-modal-section';
    sec.dataset.key = key;
    setHTML(sec, `
      <div class="vrz-modal-section-title">${label}</div>
      <div class="vrz-mod-row">
        <button class="vrz-toggle" data-act="${prefix}-toggle"></button>
        <button class="vrz-mod" data-act="${prefix}-current"></button>
      </div>
      <div class="vrz-block-list" data-list="${key}"></div>
      <div class="vrz-block-add-row">
        <input class="vrz-block-input" type="text" placeholder="hostname" />
        <button class="vrz-toggle" data-act="${prefix}-add">添加</button>
      </div>`);

    sec.querySelector(`[data-act="${prefix}-toggle"]`).addEventListener('click', () => {
      const k = key === 'blacklist' ? 'useBlacklist' : 'useWhitelist';
      this.block[k] = !this.block[k];
      this._save();
      this._refresh();
    });

    sec.querySelector(`[data-act="${prefix}-current"]`).addEventListener('click', () => {
      if (this.block[key].includes(this.hostname)) {
        this.block[key] = this.block[key].filter((h) => h !== this.hostname);
      } else if (key === 'blacklist') {
        this._addToBlacklist(this.hostname);
      } else {
        this._addToWhitelist(this.hostname);
      }
      this._save();
      this._refresh();
    });

    sec.querySelector(`[data-act="${prefix}-add"]`).addEventListener('click', () => {
      const input = sec.querySelector('.vrz-block-input');
      const val = input.value.trim();
      if (val && !this.block[key].includes(val)) {
        if (key === 'blacklist') this._addToBlacklist(val);
        else this._addToWhitelist(val);
        input.value = '';
        this._save();
        this._refresh();
      }
    });

    sec.querySelector('.vrz-block-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sec.querySelector(`[data-act="${prefix}-add"]`).click();
      }
    });

    return sec;
  }

  _refresh() {
    if (!this._panel) return;
    this._refreshDiscovered();
    this._refreshSection('blacklist', 'useBlacklist', 'bl', '黑名单');
    this._refreshSection('whitelist', 'useWhitelist', 'wl', '白名单');
    this._refreshReload();
  }

  _refreshSection(key, useKey, prefix, label) {
    const sec = this._panel.querySelector(`[data-key="${key}"]`);
    if (!sec) return;

    // 启禁用开关
    const enabled = this.block[useKey];
    const toggleBtn = sec.querySelector(`[data-act="${prefix}-toggle"]`);
    toggleBtn.textContent = enabled ? '\u2713 已启用（点击禁用）' : '\u2717 已禁用（点击启用）';
    toggleBtn.classList.toggle('on', enabled);

    // 当前站点快捷操作
    const inList = this.block[key].includes(this.hostname);
    const currentBtn = sec.querySelector(`[data-act="${prefix}-current"]`);
    currentBtn.textContent = inList
      ? `移出当前站点（${this.hostname}）`
      : `加入当前站点（${this.hostname}）`;
    currentBtn.classList.toggle('active', inList);

    // 站点列表（始终显示，无论启用/禁用）
    const listEl = sec.querySelector(`[data-list="${key}"]`);
    while (listEl.firstChild) listEl.removeChild(listEl.firstChild);

    const list = this.block[key];
    if (list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'vrz-block-empty';
      empty.textContent = '（空）';
      listEl.appendChild(empty);
      return;
    }

    list.forEach((host) => {
      const item = document.createElement('div');
      item.className = 'vrz-block-item';

      const name = document.createElement('span');
      name.className = 'vrz-block-host';
      name.textContent = host + (host === this.hostname ? ' （当前）' : '');

      const remove = document.createElement('button');
      remove.className = 'vrz-block-remove';
      remove.textContent = '\u00d7';
      remove.title = `移除 ${host}`;
      remove.addEventListener('click', () => {
        this.block[key] = this.block[key].filter((h) => h !== host);
        this._save();
        this._refresh();
      });

      item.appendChild(name);
      item.appendChild(remove);
      listEl.appendChild(item);
    });
  }

  _refreshReload() {
    const btn = this._panel.querySelector('.vrz-block-reload');
    if (!btn) return;
    if (this._dirty) {
      btn.disabled = false;
      btn.textContent = '列表已修改，点我刷新生效';
    } else {
      btn.disabled = true;
      btn.textContent = '刷新页面';
    }
  }

  // ── 互斥：加入一个列表时自动从另一个移除 ──

  _addToBlacklist(host) {
    if (!this.block.blacklist.includes(host)) this.block.blacklist.push(host);
    this.block.whitelist = this.block.whitelist.filter((h) => h !== host);
  }

  _addToWhitelist(host) {
    if (!this.block.whitelist.includes(host)) this.block.whitelist.push(host);
    this.block.blacklist = this.block.blacklist.filter((h) => h !== host);
  }

  _save() {
    config.block = this.block;
    this._dirty = true;
  }
}

export { BlockMenu };
