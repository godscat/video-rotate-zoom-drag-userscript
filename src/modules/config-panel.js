/**
 * 配置面板模块 - 修饰键配置模态
 *
 * 两个分区（拖拽 / 滚轮缩放），每区：
 *  - 启用/禁用 切换按钮（默认启用）
 *  - alt / ctrl / shift 多选（启用时默认 shift）
 *
 * 规则：
 *  - 启用时强制至少 1 个修饰键（min-1）：取消最后一个会被阻止并提示
 *  - 禁用时三个多选清空并灰化（disabled）
 *  - 任一变更立即写回 SiteConfig（持久化到 IndexedDB，按站点保存）
 */

import { setHTML } from "./util";

const SECTION_LABEL = {
  drag: '配置鼠标拖拽「前置键」',
  zoom: '配置鼠标滚轮缩放「前置键」',
};

class ConfigPanel {
  /**
   * @param {SiteConfig} siteConfig
   */
  constructor(siteConfig) {
    this.siteConfig = siteConfig;
    this.el = null;
    this._hintTimer = null;
  }

  _ensure() {
    if (this.el) return;
    const overlay = document.createElement('div');
    overlay.className = 'vrz-modal-overlay hidden';
    setHTML(overlay, `
      <div class="vrz-modal" role="dialog" aria-modal="true">
        <div class="vrz-modal-title">修饰键配置</div>
        <div class="vrz-modal-sub">按站点保存（当前站点：<span class="vrz-host"></span>）</div>
        <div class="vrz-modal-sections"></div>
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

  _refresh() {
    if (!this.el) return;
    this.el.querySelectorAll('.vrz-modal-section').forEach((sec) => {
      const key = sec.dataset.key;
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
