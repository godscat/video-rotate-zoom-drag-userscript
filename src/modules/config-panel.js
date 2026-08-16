/**
 * 配置面板模块 - 修饰键（按站点）+ 显示选项（全局）配置模态
 *
 * 修饰键分区（拖拽 / 滚轮缩放），每区：
 *  - 启用/禁用 切换按钮（默认启用）
 *  - alt / ctrl / shift 多选（启用时默认 shift）
 *
 * 显示选项（全局，经 config Proxy 持久化）：
 *  - 暂停时常驻：视频暂停时是否保持工具条常驻显示
 *  - 全局唤醒键 Alt+`：全屏时唤醒工具条（默认开启）
 *  - 工具条垂直偏移：A 方案（±2px 微调）
 *
 * 规则：
 *  - 修饰键：启用时强制至少 1 个修饰键（min-1）；按站点持久化
 *  - 显示选项：全局（个人习惯，非站点差异）
 */

import config from './config.js';
import { setHTML } from "./util.js";

const SECTION_LABEL = {
  drag: '配置鼠标拖拽「前置键」',
  zoom: '配置鼠标滚轮缩放「前置键」',
};

class ConfigPanel {
  /**
   * @param {SiteConfig} siteConfig
   */
  constructor(siteConfig, callbacks = {}) {
    this.siteConfig = siteConfig;
    this.callbacks = callbacks;
    this.el = null;
    this._hintTimer = null;
  }

  _ensure() {
    if (this.el) return;
    const overlay = document.createElement('div');
    overlay.className = 'vrz-modal-overlay hidden';
    setHTML(overlay, `
      <div class="vrz-modal" role="dialog" aria-modal="true">
        <div class="vrz-modal-title">配置</div>
        <div class="vrz-modal-sub">修饰键按站点保存（当前站点：<span class="vrz-host"></span>）｜显示选项全局生效</div>
        <div class="vrz-modal-sections"></div>
        <div class="vrz-modal-kb-section"></div>
        <div class="vrz-modal-ui-section"></div>
        <div class="vrz-modal-hint"></div>
        <div class="vrz-modal-actions">
          <button class="vrz-modal-close">关闭</button>
        </div>
      </div>`);

    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) this.close();
    });
    overlay.querySelector('.vrz-modal-close').addEventListener('click', () => this.close());

    const sections = overlay.querySelector('.vrz-modal-sections');
    sections.appendChild(this._buildSection('drag'));
    sections.appendChild(this._buildSection('zoom'));

    overlay.querySelector('.vrz-modal-kb-section').appendChild(this._buildKbSection());
    overlay.querySelector('.vrz-modal-ui-section').appendChild(this._buildUiOptions());

    overlay.querySelector('.vrz-host').textContent = this.siteConfig.host;
    document.body.appendChild(overlay);
    this.el = overlay;
    this._hintEl = overlay.querySelector('.vrz-modal-hint');
    this._refresh();
  }

  _buildSection(key) {
    const sec = document.createElement('div');
    sec.className = 'vrz-modal-section';
    sec.dataset.key = key;
    setHTML(sec, `
      <div class="vrz-modal-section-title">${SECTION_LABEL[key]}</div>
      <div class="vrz-mod-row">
        <button class="vrz-toggle" data-act="toggle">启用</button>
        <button class="vrz-mod" data-mod="alt">alt</button>
        <button class="vrz-mod" data-mod="ctrl">ctrl</button>
        <button class="vrz-mod" data-mod="shift">shift</button>
      </div>`);

    const getConfig = () =>
      key === 'drag' ? this.siteConfig.getDragConfig() : this.siteConfig.getZoomConfig();
    const setter = (partial) =>
      key === 'drag' ? this.siteConfig.setDrag(partial) : this.siteConfig.setZoom(partial);

    sec.querySelector('[data-act="toggle"]').addEventListener('click', (e) => {
      const cfg = getConfig();
      const nextEnabled = !cfg.enabled;
      setter({ enabled: nextEnabled, modifiers: nextEnabled ? ['shift'] : [] }).then(() => this._refresh());
      e.stopPropagation();
    });

    sec.querySelectorAll('[data-mod]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const cfg = getConfig();
        if (!cfg.enabled) return;
        const m = btn.dataset.mod;
        let next = cfg.modifiers.slice();
        if (next.includes(m)) {
          // min-1：禁止取消最后一个
          if (next.length <= 1) {
            this._hint('至少需要保留 1 个修饰键（否则会与点击暂停冲突）');
            this._flash(btn);
            return;
          }
          next = next.filter((x) => x !== m);
        } else {
          next.push(m);
        }
        setter({ modifiers: next }).then(() => this._refresh());
        e.stopPropagation();
      });
    });

    return sec;
  }

  /** 显示选项（全局）：暂停时常驻 / 全局唤醒键 / 工具条垂直偏移 */
  _buildUiOptions() {
    const sec = document.createElement('div');
    sec.className = 'vrz-modal-section vrz-ui-options';
    setHTML(sec, `
      <div class="vrz-modal-section-title">显示选项（全局）</div>
      <div class="vrz-mod-row">
        <button class="vrz-toggle" data-act="persist-on-pause">暂停时常驻</button>
        <button class="vrz-toggle" data-act="wake-key">唤醒键 Alt&#96;</button>
      </div>
      <div class="vrz-mod-row vrz-offset-row">
        <span class="vrz-offset-label">工具条垂直偏移</span>
        <button class="vrz-toggle" data-act="offset-dec">−</button>
        <span class="vrz-offset-value" data-act="offset-value">4px</span>
        <button class="vrz-toggle" data-act="offset-inc">＋</button>
      </div>
      <div class="vrz-mod-row vrz-offset-row">
        <span class="vrz-offset-label">工具条水平偏移</span>
        <button class="vrz-toggle" data-act="offset-h-dec">−</button>
        <span class="vrz-offset-value" data-act="offset-h-value">4px</span>
        <button class="vrz-toggle" data-act="offset-h-inc">＋</button>
      </div>`);

    sec.querySelector('[data-act="persist-on-pause"]').addEventListener('click', (e) => {
      config.ui.persistOnPause = !config.ui.persistOnPause;
      this._refresh();
      if (typeof this.callbacks.onPersistOnChange === 'function') this.callbacks.onPersistOnChange();
      e.stopPropagation();
    });

    sec.querySelector('[data-act="wake-key"]').addEventListener('click', (e) => {
      config.ui.wakeKeyEnabled = !config.ui.wakeKeyEnabled;
      this._refresh();
      e.stopPropagation();
    });

    sec.querySelector('[data-act="offset-dec"]').addEventListener('click', (e) => {
      config.ui.verticalOffset = Math.max(0, (config.ui.verticalOffset || 0) - 2);
      this._refresh();
      if (typeof this.callbacks.onUiChange === 'function') this.callbacks.onUiChange();
      e.stopPropagation();
    });

    sec.querySelector('[data-act="offset-inc"]').addEventListener('click', (e) => {
      config.ui.verticalOffset = Math.min(60, (config.ui.verticalOffset || 0) + 2);
      this._refresh();
      if (typeof this.callbacks.onUiChange === 'function') this.callbacks.onUiChange();
      e.stopPropagation();
    });

    sec.querySelector('[data-act="offset-h-dec"]').addEventListener('click', (e) => {
      config.ui.horizontalOffset = Math.max(0, (config.ui.horizontalOffset || 0) - 2);
      this._refresh();
      if (typeof this.callbacks.onUiChange === 'function') this.callbacks.onUiChange();
      e.stopPropagation();
    });

    sec.querySelector('[data-act="offset-h-inc"]').addEventListener('click', (e) => {
      config.ui.horizontalOffset = Math.min(60, (config.ui.horizontalOffset || 0) + 2);
      this._refresh();
      if (typeof this.callbacks.onUiChange === 'function') this.callbacks.onUiChange();
      e.stopPropagation();
    });
    return sec;
  }

  /** 键盘快捷键开关（全局）*/
  _buildKbSection() {
    const LABELS = {
      zoom: '缩放', rotate: '旋转', fullscreen: '全屏', reset: '还原',
      move: '移动', abLoop: 'A-B循环', panels: '面板',
    };

    const sec = document.createElement('div');
    sec.className = 'vrz-modal-section vrz-kb-options';

    setHTML(sec, `
      <div class="vrz-modal-section-title">键盘快捷键（全局）</div>
      <div class="vrz-mod-row vrz-kb-master-row">
        <button class="vrz-toggle" data-act="kb-master">启用额外快捷键</button>
      </div>
      <div class="vrz-mod-row vrz-kb-groups-row"></div>`);

    // 总开关（分组默认全开，经 config.shortcuts.groups 合并默认值）
    sec.querySelector('[data-act="kb-master"]').addEventListener('click', (e) => {
      config.shortcuts.enabled = !config.shortcuts.enabled;
      this._refresh();
      e.stopPropagation();
    });

    // 分组开关
    const groupsRow = sec.querySelector('.vrz-kb-groups-row');
    config.shortcutGroups && Object.keys(config.shortcutGroups).forEach((group) => {
      const btn = document.createElement('button');
      btn.className = 'vrz-toggle';
      btn.dataset.act = 'kb-group';
      btn.dataset.group = group;
      btn.textContent = LABELS[group] || group;
      btn.addEventListener('click', (e) => {
        if (!config.shortcuts.enabled) {
          this._hint('请先启用键盘快捷键总开关');
          return;
        }
        const groups = { ...config.shortcuts.groups };
        groups[group] = !groups[group];
        config.shortcuts.groups = groups;
        this._refresh();
        e.stopPropagation();
      });
      groupsRow.appendChild(btn);
    });

    return sec;
  }

  _refresh() {
    if (!this.el) return;
    this.el.querySelectorAll('.vrz-modal-section').forEach((sec) => {
      const key = sec.dataset.key;
      if (!key) return; // 跳过非修饰键区（显示选项等）
      const cfg = key === 'drag' ? this.siteConfig.getDragConfig() : this.siteConfig.getZoomConfig();

      const toggleBtn = sec.querySelector('[data-act="toggle"]');
      toggleBtn.textContent = cfg.enabled ? '禁用' : '启用';
      toggleBtn.classList.toggle('on', cfg.enabled);
      toggleBtn.title = cfg.enabled ? '当前：已启用，点击禁用' : '当前：已禁用，点击启用';

      sec.querySelectorAll('[data-mod]').forEach((btn) => {
        const m = btn.dataset.mod;
        btn.classList.toggle('active', cfg.enabled && cfg.modifiers.includes(m));
        btn.disabled = !cfg.enabled;
      });
    });

    // 显示选项：暂停时常驻（全局）
    const persistBtn = this.el.querySelector('[data-act="persist-on-pause"]');
    if (persistBtn) {
      persistBtn.classList.toggle('on', config.ui.persistOnPause);
      persistBtn.title = config.ui.persistOnPause ? '当前：暂停时常驻，点击关闭' : '当前：暂停时自动隐藏，点击开启';
    }

    // 显示选项：全局唤醒键（Alt+`）
    const wakeBtn = this.el.querySelector('[data-act="wake-key"]');
    if (wakeBtn) {
      wakeBtn.classList.toggle('on', config.ui.wakeKeyEnabled);
      wakeBtn.title = config.ui.wakeKeyEnabled ? '当前：已开启（Alt+` 唤醒工具条），点击关闭' : '当前：已关闭，点击开启';
    }

    // 显示选项：工具条垂直/水平偏移
    const offsetVal = this.el.querySelector('[data-act="offset-value"]');
    if (offsetVal) offsetVal.textContent = (config.ui.verticalOffset || 0) + 'px';
    const offsetHVal = this.el.querySelector('[data-act="offset-h-value"]');
    if (offsetHVal) offsetHVal.textContent = (config.ui.horizontalOffset || 0) + 'px';

    // 键盘快捷键（全局）
    const kbMaster = this.el.querySelector('[data-act="kb-master"]');
    if (kbMaster) {
      const kbOn = !!config.shortcuts.enabled;
      kbMaster.textContent = kbOn ? '禁用' : '启用额外快捷键';
      kbMaster.classList.toggle('on', kbOn);
      kbMaster.title = kbOn ? '当前：已启用，点击禁用全部快捷键' : '当前：全部禁用，点击启用快捷键';

      const groups = config.shortcuts.groups;
      this.el.querySelectorAll('[data-act="kb-group"]').forEach((btn) => {
        const g = btn.dataset.group;
        const gOn = !!groups[g];
        btn.classList.toggle('on', kbOn && gOn);
        btn.disabled = !kbOn;
      });
    }
  }

  _hint(text) {
    if (!this._hintEl) return;
    this._hintEl.textContent = text;
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => {
      this._hintEl.textContent = '';
    }, 2500);
  }

  _flash(btn) {
    btn.classList.add('vrz-flash');
    setTimeout(() => btn.classList.remove('vrz-flash'), 350);
  }

  open() {
    this._ensure();
    this._refresh();
    this.el.classList.remove('hidden');
  }

  close() {
    if (this.el) this.el.classList.add('hidden');
  }

  toggle() {
    if (this.el && !this.el.classList.contains('hidden')) this.close();
    else this.open();
  }
}

export { ConfigPanel };
