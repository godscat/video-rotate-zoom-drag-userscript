// ==UserScript==
// @name         chimo-chimo-loop - HTML5 Video Enhancer
// @name:ja      chimo-chimo-loop - HTML5動画プレーヤー拡張
// @name:zh-CN   chimo-chimo-loop (HTML5 视频增强器)
// @namespace    https://github.com/ryu-dayo/chimo-chimo-loop
// @version      1.6.1
// @description  Supercharge HTML5 video playback with Picture-in-Picture (PiP), A-B loop, speed control, mirror/rotate, lossless screenshots, and advanced media statistics.
// @description:ja     HTML5の動画再生を強化。ピクチャインピクチャ、A-Bリピート、再生速度調整、動画を左右反転（ミラー）と回転、高画質スクリーンショット、詳細なメディア統計などの高度な機能を追加します。
// @description:zh-CN  HTML5 视频增强神器：支持画中画、A-B区间循环、倍速调节、镜像翻转与旋转、无损截图以及硬核的媒体统计信息（实时FPS、色彩空间等）。
// @author       ryu-dayo
// @match        https://www.douyin.com/*
// @match        https://www.facebook.com/*
// @match        https://www.instagram.com/*
// @match        https://www.threads.com/*
// @match        https://x.com/*
// @match        https://www.xiaohongshu.com/*
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=douyin.com
// @match        http://dell-server:8084/*
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @license      GPL-3.0
// @downloadURL https://update.greasyfork.org/scripts/556184/chimo-chimo-loop%20-%20HTML5%20Video%20Enhancer.user.js
// @updateURL https://update.greasyfork.org/scripts/556184/chimo-chimo-loop%20-%20HTML5%20Video%20Enhancer.meta.js
// ==/UserScript==

(function () {
    'use strict';

    const ICONS = {
        enterPip: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 101 82"><path d="M12.5 63.3h55.7q12.6 0 12.5-12.3V12.3Q80.7 0 68.2 0H12.5Q0 0 0 12.3V51q0 12.3 12.5 12.3M7 50.6v-38Q7.1 7 12.5 7h55.6q5.4.1 5.5 5.6v38q-.1 5.6-5.5 5.6H12.5q-5.4 0-5.5-5.6"/><path d="M31 16.8c-.2-1.2-1.8-2.6-3.4-1L23.4 20l-5.8-6c-1-1-2.8-1-3.8 0s-1 2.7 0 3.8l5.9 5.8-4.1 4.2c-1.7 1.6-.3 3.2 1 3.4l14 2.1q1 .1 2-.6.6-.8.5-1.8zm19.5 64.8h37.2q12.4 0 12.4-12.2V44.8q0-12.3-12.4-12.3H50.5Q38 32.5 38 44.8v24.6q0 12.3 12.5 12.2"/></svg>`,
        exitPip: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 101 82"><path d="M12.5 63.3h55.7q12.6 0 12.5-12.3V12.3Q80.7 0 68.2 0H12.5Q0 0 0 12.3V51q0 12.3 12.5 12.3M7 50.6v-38Q7.1 7 12.5 7h55.6q5.4.1 5.5 5.6v38q-.1 5.6-5.5 5.6H12.5q-5.4 0-5.5-5.6"/><path d="M15.1 29.9c.2 1.2 1.8 2.6 3.4 1l4.2-4.1 5.9 5.8c1 1 2.7 1 3.7 0s1-2.7 0-3.7l-5.8-6 4-4.1c1.7-1.6.3-3.2-1-3.4l-14-2q-1.2-.3-1.9.5t-.6 1.9zm35.4 51.7h37.2q12.4 0 12.4-12.2V44.8q0-12.3-12.4-12.3H50.5Q38 32.5 38 44.8v24.6q0 12.3 12.5 12.2"/></svg>`,
        enableLoop: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 70"><path  d="M34.9 66.6V41.9q0-2.6-2.8-2.6-1.1 0-2.1.8L15.4 52.4c-1.2 1-1.3 2.6 0 3.8L30 68.5q1 .7 2.1.7 2.7 0 2.8-2.6m45.3-33.5c-2 0-3.5 1.5-3.5 3.6v3.7c0 6.2-4.6 10.5-11.2 10.5H29.2c-2 0-3.6 1.6-3.6 3.5 0 2 1.6 3.6 3.6 3.6h35.6c11.6 0 19-6.7 19-17v-4.3c0-2-1.5-3.6-3.6-3.6M49 2.6v24.7q0 2.6 2.7 2.6 1.1 0 2.1-.7l14.6-12.3c1.3-1 1.4-2.7 0-3.8L53.8.8q-1-.8-2.1-.8Q49 .1 49 2.6M3.6 36.2c2 0 3.6-1.6 3.6-3.6v-3.7c0-6.3 4.5-10.5 11-10.5h36.4a3.5 3.5 0 0 0 0-7.1H19c-11.6 0-19 6.6-19 17v4.3c0 2 1.6 3.6 3.6 3.6"/></svg>`,
        disableLoop: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 79 79"><path d="M39.4 0a39.5 39.5 0 1 1 0 79 39.5 39.5 0 0 1 0-79m22.5 37.8a3 3 0 0 0-3 3V43c0 3.5-2.5 5.8-6.2 5.8H37.2V44q-.1-2.3-2.4-2.4a3 3 0 0 0-1.8.6L24 50q-2 1.7 0 3.5l9 7.7q.8.6 1.8.6 2.3-.1 2.4-2.4v-4.7h15c7.6 0 12.6-4.4 12.6-11.3v-2.6a3 3 0 0 0-3-3M44 17.1q-2.2.1-2.3 2.4v4.7h-15C19 24.2 14 28.7 14 35.6v2.6a3 3 0 0 0 3 3 3 3 0 0 0 3-3v-2.3c0-3.5 2.4-5.8 6-5.8h15.7v4.8q.1 2.3 2.3 2.4 1 0 1.8-.6l9-7.7c1.3-1 1.3-2.5 0-3.5l-9-7.7q-.7-.7-1.8-.7"/></svg>`,
        more: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 73 69"><path d="M38.2 68.2q1.8 0 2.9-1.3l30.1-30q1.3-1.2 1.3-2.8a4 4 0 0 0-1.3-2.9l-30.1-30A4 4 0 0 0 38.2 0a4 4 0 0 0-4 4q0 1.7 1.2 3l29.5 29.3v-4.5L35.4 61.2q-1.1 1.2-1.2 3a4 4 0 0 0 4 4"/><path d="M4 68.2q1.8 0 2.9-1.3L37 37q1.1-1.2 1.2-2.8a4 4 0 0 0-1.2-2.9L6.9 1.2A4 4 0 0 0 4 0a4 4 0 0 0-4 4q0 1.7 1.2 3l29.5 29.3v-4.5L1.2 61.2Q0 62.4 0 64.2a4 4 0 0 0 4 4"/></svg>`,
        setPointB: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><path d="M12.5 71.2h46.2Q71 71.2 71 58.9V12.3Q71.2 0 58.7 0H12.5Q0 0 0 12.3v46.6q0 12.3 12.5 12.3m0-7q-5.4 0-5.5-5.7V12.6q.1-5.5 5.5-5.5h46q5.5 0 5.6 5.5v46Q64 64 58.6 64z"/><path d="M26.7 52.7h11c8.1 0 13.4-4 13.4-10 0-4.6-3.2-7.9-8.4-8.5v-.3c4-1 6.3-3.9 6.3-7.7 0-5.3-4.3-8.7-11-8.7H26.6q-3.9 0-4 4v27.3q.1 3.7 4 3.9m2.8-20.5v-9.6h7c3.6 0 5.9 1.8 5.9 4.7q0 5-7.9 5zm0 15.5V36.9H37q7 .1 7.2 5.5.1 5.4-9 5.3z"/></svg>`,
        screenshot: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 95 74"><path d="M80.2 30a4.9 4.9 0 0 1 0-9.7 4.9 4.9 0 0 1 0 9.8M12.5 73.8h70q12.4 0 12.4-12.3v-40Q95 9.3 82.5 9.3H71.7c-3 0-4-.7-5.6-2.5l-3-3.4c-1.9-2-4-3.3-8-3.3H39.8c-4 0-6.1 1.3-8 3.3l-3 3.4c-1.6 1.8-2.6 2.5-5.5 2.5H12.5Q0 9.2 0 21.5v40q0 12.2 12.5 12.2m35-11.7a20.7 20.7 0 0 1-20.8-20.8 20.7 20.7 0 1 1 41.5 0C68.2 52.8 59 62 47.5 62m0-6.6a14.2 14.2 0 1 0-14.3-14.2c0 8 6.4 14.2 14.3 14.2"/></svg>`,
        mirror: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 92 85"><path d="M6.4 84.6h30.2q7.1 0 7-6.9V32.1c0-3.9-3-5.9-6-5.9q-3.1 0-5.4 3L1.3 74.5Q0 76.7 0 79c0 3.1 2 5.7 6.4 5.7m79 0c4.4 0 6.4-2.6 6.4-5.7q.1-2.2-1.3-4.4L59.7 29.2q-2.2-3-5.5-3c-3 0-5.9 2-5.9 5.9v45.6q-.1 7 7 7zM69.7 3v15.7c0 3 2.8 4 5 2.2L85.5 13a2.7 2.7 0 0 0 0-4.3L74.8 1c-2.3-2-5.1-.8-5.1 2M22.2 18.7V3c0-2.8-2.8-4-5.2-2L6.4 8.7a2.7 2.7 0 0 0 0 4.3l10.7 8c2.2 1.6 5 .8 5-2.3m53-5.3q2.3-.2 2.5-2.5c0-1.3-1.1-2.5-2.5-2.5H16.6a2.5 2.5 0 0 0-2.5 2.5q.2 2.3 2.5 2.5z"/></svg>`,
        rotateLeft: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 78 86"><path d="M10.4 85.2H48q10.4.2 10.4-10.4V37.2q0-10.5-10.4-10.4H10.4Q0 26.7 0 37.2v37.6C0 82 3.5 85.2 10.4 85.2M59 17.3V3c0-3.1-2.3-3.8-4.6-2l-9.7 7.2Q42 10 44.7 12l9.7 7.2c2.3 1.7 4.6 1 4.6-2m-4.2-9.7a2.5 2.5 0 0 0-2.5 2.5c0 1.3 1.2 2.5 2.5 2.5h5c7.6 0 12.6 5.3 12.6 13.3v5.7c0 1.5 1.2 2.7 2.7 2.7s2.7-1.2 2.7-2.7V26c0-11-7.2-18.3-18-18.3z"/></svg>`
    };

    const LOCALE = {
        'en': {
            starGitHub: 'Support on GitHub (⭐)',
            feedback: 'Feedback / Suggestions',
            playbackSpeed: 'Playback Speed',
            speedUnit: '×',
            statsLabel: 'Show Media Statistics',
            sourceType: 'Source',
            viewport: 'Viewport',
            frameInfo: 'Frames',
            resolution: 'Resolution',
            codecInfo: 'Codecs',
            colorProfile: 'Color',
            screenshotError: 'Screenshot failed due to CORS restrictions.',
            file: 'File',
            mediaSource: 'Media Source',
        },
        'ja': {
            starGitHub: 'GitHubで応援 (⭐)',
            feedback: 'フィードバック / ご要望',
            playbackSpeed: '再生速度',
            speedUnit: '×',
            statsLabel: 'メディアの統計情報を表示',
            sourceType: 'ソース',
            viewport: 'ビューポート',
            frameInfo: 'フレーム',
            resolution: '解像度',
            codecInfo: 'コーデック',
            colorProfile: 'カラー',
            screenshotError: 'CORS制限によりスクリーンショットに失敗しました。',
            file: 'ファイル',
            mediaSource: 'メディアソース',
        },
        'zh-CN': {
            starGitHub: '在 GitHub 上支持本项目 (⭐)',
            feedback: '反馈 Bug / 建议',
            playbackSpeed: '播放速度',
            speedUnit: '倍',
            statsLabel: '显示媒体统计数据',
            sourceType: '来源',
            viewport: '视口',
            frameInfo: '帧',
            resolution: '分辨率',
            codecInfo: '编解码器',
            colorProfile: '色彩',
            screenshotError: '由于跨域限制 (CORS)，截图失败。',
            file: '文件',
            mediaSource: '媒体源',
        },
    };

    const t = (k) => (LOCALE[navigator.language] || LOCALE[navigator.language.split('-')[0]] || LOCALE.en)[k] || k;

    // Define common playback speed steps
    const SPEED_STEPS = [0.5, 1, 1.25, 1.5, 2];

    const STYLE = `
        .ccl-controls-container, .ccl-controls-container * {
            font-size: 12px;
            line-height: 16px;
            font-family: sans-serif;
            font-weight: bold;
            color: white;
        }

        .ccl-controls-container {
            position: fixed;
            z-index: 999;
            pointer-events: none;
            will-change: top, left, width, height;
        }

        .ccl-controls {
            display: flex;
            flex-direction: row;
            align-items: flex-start;
            gap: 16px;
            padding: 6px;
            pointer-events: none;
        }
        .ccl-controls.hidden { display: none; }

        .ccl-bar {
            display: inline-flex;
            height: 31px;
            flex-shrink: 0;
            border-radius: 24px;
            background-color: rgba(0, 0, 0, 0.55);
            -webkit-backdrop-filter: saturate(180%) blur(17.5px);
            backdrop-filter: saturate(180%) blur(17.5px);
            pointer-events: auto;
        }

        .ccl-control-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            border: 0;
            padding: 0;
            cursor: pointer;
            background: transparent !important;
        }
        .ccl-control-btn:active { transform: scale(0.89); }

        .ccl-icon {
            width: 16px;
            height: 12px;
            background-color: white;
            mix-blend-mode: plus-lighter;
            -webkit-mask: var(--icon) no-repeat center / contain;
            mask: var(--icon) no-repeat center / contain;
            transition: transform 150ms;
            pointer-events: none;
        }

        .ccl-icon-pip { --icon: url('${ICONS.enterPip}'); }
        .ccl-icon-pip[data-active="true"] { --icon: url('${ICONS.exitPip}'); }
        .ccl-icon-loop { --icon: url('${ICONS.enableLoop}'); }
        .ccl-icon-loop[data-active="true"] { --icon: url('${ICONS.disableLoop}'); }
        .ccl-icon-more { --icon: url('${ICONS.more}'); }
        .ccl-icon-ab { --icon: url('${ICONS.setPointB}'); }
        .ccl-icon-screenshot { --icon: url('${ICONS.screenshot}'); }
        .ccl-icon-mirror { --icon: url('${ICONS.mirror}'); }
        .ccl-icon-rotate-left { --icon: url('${ICONS.rotateLeft}'); }

        .ccl-btn-container {
            display: flex;
            gap: 16px;
            justify-content: center;
            align-items: center;
            padding: 0 16px;
        }

        .ccl-menu {
            position: relative;
            display: none;
            border-radius: 8px;
            cursor: default;
            pointer-events: auto;
            white-space: nowrap;
        }

        .ccl-menu.visible { display: flex; }
        .ccl-menu.visible::before {
            content: '';
            position: fixed;
            inset: 0;
            background: transparent;
            pointer-events: auto;
        }

        .ccl-menu-bg {
            position: absolute;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            -webkit-backdrop-filter:saturate(180%) blur(17.5px);
            backdrop-filter: saturate(180%) blur(17.5px);
            border-radius: 8px;
        }

        .ccl-menu-container {
            position: relative;
            padding: 4px 8px;
        }

        .ccl-menu-head {
            color: rgba(255, 255, 255, 0.2);
            padding: 4px 8px;
            pointer-events: none;
            white-space: nowrap;
        }

        .ccl-menu-hr {
            border: 0;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            margin: 4px 8px;
            background: transparent;
        }

        .ccl-menu-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;
            pointer-events: auto;
            white-space: nowrap;
        }
        .ccl-menu-item:hover { background: rgba(255, 255, 255, 0.2) !important; }

        .ccl-menu-item::before {
            content: '✔';
            visibility: hidden;
            color: white;
            font-weight: bold;
        }
        .ccl-menu-item.active::before { visibility: visible; }

        .ccl-menu-item-stats { justify-content: center; }
        .ccl-menu-item-stats::before { display: none; }
        .ccl-menu-item-stats.active { justify-content: flex-start; }

        .ccl-menu-item-stats.active::before {
            display: block;
            visibility: visible;
        }

        .ccl-stats-container {
            position: absolute;
            width: 100%; height: 100%;
            top: 0;
            justify-content: center;
            align-items: center;
            pointer-events: none;
            display: none;
        }

        .ccl-stats-container.visible { display: flex; }

        .ccl-stats-container > table {
            padding: 4px;
            background-color: rgba(64, 64, 64, 0.6);
            border-radius: 6px;
            -webkit-backdrop-filter: blur(5px);
            backdrop-filter: blur(5px);
        }

        .ccl-stats-container th {
            padding-inline-end: 6px;
            text-align: end;
        }
    `;

    const el = (tag, className, text = '', click = null) => {
        const e = document.createElement(tag);
        if (className) e.className = className;
        if (text) e.textContent = text;
        if (click) {
            e.addEventListener('click', (ev) => {
                ev.stopPropagation();
                click(ev);
            });
        }
        return e;
    }

    const applyGlobalTransform = (video, rotateAngle, scale, scaleX) => {
        if (!video) return;

        video.setAttribute('data-ccl-active', 'true');

        if (rotateAngle === 0 && scale === 1 && scaleX === 1) {
            video.removeAttribute('data-ccl-active');
            const existingStyle = document.getElementById('ccl-dynamic-transform');
            if (existingStyle) existingStyle.textContent = '';
            return;
        }

        let styleEl = document.getElementById('ccl-dynamic-transform');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'ccl-dynamic-transform';
            document.head.appendChild(styleEl);
        }

        styleEl.textContent = `
            video[data-ccl-active="true"] {
                transform: rotate(${rotateAngle}deg) scale(${scale}) scaleX(${scaleX}) !important;
                transition: transform 0.2s ease-out !important;
                transform-origin: center center !important;
            }
        `;
    }

    class BaseControl {
        constructor(iconClass, onClick) {
            this.video = null;
            this.el = el('button', 'ccl-control-btn', '', (e) => onClick(e));
            this.icon = el('picture', `ccl-icon ${iconClass}`);
            this.el.appendChild(this.icon);
        }

        setVideo(v) { this.video = v; this.update(); }
        update() { }
    }

    class PipControl extends BaseControl {
        constructor() {
            super('ccl-icon-pip', () => this.handlePip());
        }

        handlePip() {
            if (typeof this.video.webkitSetPresentationMode === 'function') {
                const mode = this.video.webkitPresentationMode;
                this.video.webkitSetPresentationMode(mode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
            } else {
                if (document.pictureInPictureElement === this.video) document.exitPictureInPicture();
                else this.video.requestPictureInPicture();
            }
        }

        setVideo(v) {
            this.video = v;

            if (!this.isPipSupport(v)) this.el.style.display = 'none';
            else { this.el.style.display = 'flex'; this.update(); }
        }

        isPipSupport(video) {
            const isStandard = document.pictureInPictureEnabled && !video.disablePictureInPicture;
            const isSafari = typeof video.webkitSetPresentationMode === 'function';
            return isStandard || isSafari;
        }

        update() {
            const active = document.pictureInPictureElement === this.video || this.video.webkitPresentationMode === 'picture-in-picture';
            this.icon.dataset.active = active;
        }
    }

    class LoopControl extends BaseControl {
        constructor(onLoopToggle) {
            super('ccl-icon-loop', () => {
                this.video.loop = !this.video.loop;
                this.update();
                this.onLoopToggle(this.video.loop, this.video);
            });
            this.observer = null;
            this.onLoopToggle = onLoopToggle;
        }

        setVideo(v) {
            super.setVideo(v);

            if (this.observer) this.observer.disconnect();
            this.observer = new MutationObserver(() => {
                this.update()
                this.onLoopToggle(this.video.loop, this.video);
            });
            this.observer.observe(v, { attributes: true, attributeFilter: ['loop'] });
        }

        update() { this.icon.dataset.active = this.video.loop; }
    }

    class ABControl extends BaseControl {
        constructor() {
            super('ccl-icon-ab', () => this.handleClick());
            this.el.style.display = 'none';

            this.startTime = null;
            this.endTime = null;

            this.loopHandlerBound = this.loopHandler.bind(this);
        }

        setVideo(v) {
            this.reset();
            super.setVideo(v);
        }

        setDirectA(time) {
            this.startTime = time;
            this.show();
        }

        handleClick() {
            if (!this.video) return;
            const now = this.video.currentTime;

            if (this.startTime) {
                if (now <= this.startTime) {
                    alert('Please select a future time to start the loop.');
                    return;
                }

                this.endTime = now;
                this.hide();

                this.video.addEventListener('timeupdate', this.loopHandlerBound);
                this.video.currentTime = this.startTime;
                this.video.play();
            }
        }

        loopHandler() {
            if (this.endTime && this.video.currentTime >= this.endTime) {
                this.video.currentTime = this.startTime;
            }
        }

        reset() {
            if (this.video) this.video.removeEventListener('timeupdate', this.loopHandlerBound);
            this.startTime = null;
            this.endTime = null;
            this.hide();
        }

        show() { this.el.style.display = 'flex'; }
        hide() { this.el.style.display = 'none'; }
    }

    class ScreenshotControl extends BaseControl {
        constructor() {
            super('ccl-icon-screenshot', () => this.handleScreenshot());
        }

        handleScreenshot() {
            if (!this.video) return;

            try {
                // Create a canvas with the original video resolution
                const canvas = document.createElement('canvas');
                canvas.width = this.video.videoWidth;
                canvas.height = this.video.videoHeight;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);

                // Export to PNG format (lossless highest quality)
                const dataUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = dataUrl;

                // Generate file name
                const now = new Date();
                const yyyy = now.getFullYear();
                const MM = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const hh = String(now.getHours()).padStart(2, '0');
                const mm = String(now.getMinutes()).padStart(2, '0');
                const ss = String(now.getSeconds()).padStart(2, '0');

                const timestamp = `${yyyy}${MM}${dd}_${hh}${mm}${ss}`;

                a.download = `chimo-chimo-loop_${timestamp}.png`;
                a.click();

            } catch (err) {
                // Fails if the video source is cross-origin without proper CORS headers
                console.error('[chimo-chimo-loop] Screenshot failed:', err);
                alert(t('screenshotError'));
            }
        }
    }

    class MoreControl extends BaseControl {
        constructor(onToggle) {
            super('ccl-icon-more', () => onToggle());
        }
    }

    class MirrorControl extends BaseControl {
        constructor(rotateControl) {
            super('ccl-icon-mirror', () => this.handleMirror());
            this.isMirrored = false;
            this.rotateControl = rotateControl;
        }

        handleMirror() {
            if (!this.video) return;

            this.isMirrored = !this.isMirrored;
            this.applyMirror();
            this.update();
        }

        applyMirror() {
            const scaleX = this.isMirrored ? -1 : 1;
            const rotate = this.rotateControl ? this.rotateControl.rotationAngle : 0;
            const scale = this.rotateControl && rotate !== 0 ? this.rotateControl.calculateScale(this.video) : 1;

            applyGlobalTransform(this.video, rotate, scale, scaleX);
        }

        setVideo(v) {
            super.setVideo(v);
            // Reset mirror state when setting a new video
            this.isMirrored = false;
        }
    }

    class RotateControl extends BaseControl {
        constructor() {
            super('ccl-icon-rotate-left', () => this.handleRotate());
            this.rotationAngle = 0;
            this.mirrorControl = null;

            // Listen for player size changes, recalculate scale in real-time
            this.resizeObserver = new ResizeObserver(() => {
                if (this.rotationAngle !== 0) {
                    this.applyRotation();
                }
            });
            this.isObserving = false;
        }

        handleRotate() {
            if (!this.video) return;

            this.rotationAngle -= 90;

            this.applyRotation();
        }

        applyRotation() {
            const v = this.video;

            if (!this.isObserving) {
                this.resizeObserver.observe(v);
                this.isObserving = true;
            }

            const scale = this.rotationAngle !== 0 ? this.calculateScale(v) : 1;
            const scaleX = (this.mirrorControl && this.mirrorControl.isMirrored) ? -1 : 1;

            applyGlobalTransform(v, this.rotationAngle, scale, scaleX);
        }

        // Core math formula: Calculate the scaling factor needed in pure visual state
        calculateScale(v) {
            const isPortrait = Math.abs(this.rotationAngle % 180) === 0;
            if (isPortrait) return 1;

            const cw = v.clientWidth || v.parentElement.clientWidth;
            const ch = v.clientHeight || v.parentElement.clientHeight;

            const vw = v.videoWidth;
            const vh = v.videoHeight;

            if (!vw || !vh || !cw || !ch) return 1;

            // 1. Original scaling ratio under object-fit: contain state
            const k1 = Math.min(cw / vw, ch / vh);

            // 2. Originally drawn image dimensions
            const paintedWidth = vw * k1;
            const paintedHeight = vh * k1;

            // 3. After rotating 90 degrees, width and height are reversed
            const rotatedWidth = paintedHeight;
            const rotatedHeight = paintedWidth;

            // 4. Calculate: how many times to zoom in/out to fill the safe area again
            const scaleX = cw / rotatedWidth;
            const scaleY = ch / rotatedHeight;

            // Take minimum value to ensure image is not cropped (take maximum for cover effect)
            return Math.min(scaleX, scaleY);
        }

        resetRotation() {
            const v = this.video;
            if (!v) return;

            this.rotationAngle = 0;

            if (this.isObserving) {
                this.resizeObserver.disconnect();
                this.isObserving = false;
            }

            const scaleX = (this.mirrorControl && this.mirrorControl.isMirrored) ? -1 : 1;
            applyGlobalTransform(v, 0, 1, scaleX);
        }

        setVideo(v) {
            if (this.video && this.video !== v) {
                this.resetRotation();
            }

            super.setVideo(v);

            if (v) {
                this.resetRotation();
            }
        }
    }

    class ControlsBar {
        constructor(onMenuToggle) {
            this.pipControl = new PipControl();
            this.loopControl = new LoopControl((isLooping, video) => {
                if (isLooping && video) this.abControl.setDirectA(video.currentTime);
                else this.abControl.reset();
            });
            this.abControl = new ABControl();
            this.screenshotControl = new ScreenshotControl();
            this.rotateControl = new RotateControl();
            this.mirrorControl = new MirrorControl(this.rotateControl);
            this.rotateControl.mirrorControl = this.mirrorControl;
            this.moreControl = new MoreControl(() => onMenuToggle());

            this.controls = [this.pipControl, this.loopControl, this.abControl, this.screenshotControl, this.mirrorControl, this.rotateControl, this.moreControl];

            const container = el('div', 'ccl-btn-container')
            this.controls.forEach(c => container.appendChild(c.el));

            this.el = el('div', 'ccl-bar');
            this.el.appendChild(container);
        }

        setVideo(video) { this.controls.forEach(c => c.setVideo(video)); }
    }

    class MediaControls {
        constructor(onStatsToggle, onStatsVisible) {
            this.el = el('div', 'ccl-controls');
            this.controlsBar = new ControlsBar(() => this.menu.toggle());
            this.menu = new Menu(onStatsToggle, onStatsVisible);

            this.components = [this.controlsBar, this.menu];
            this.components.forEach(c => this.el.appendChild(c.el));
        }

        show() { this.el.classList.remove('hidden'); };
        hide() { this.el.classList.add('hidden'); };
        setVideo(video) { this.components.forEach(c => c.setVideo(video)); }
    }

    class Menu {
        constructor(onToggleStats, checkStatsState) {
            this.video = null;
            this.checkStatsState = checkStatsState;

            this.el = el('div', 'ccl-menu');
            this.container = el('div', 'ccl-menu-container');
            this.el.append(el('div', 'ccl-menu-bg'), this.container);

            this.container.appendChild(el('div', 'ccl-menu-head', t('playbackSpeed')));

            SPEED_STEPS.forEach(r => {
                const item = el('div', 'ccl-menu-item', `${r} ${t('speedUnit')}`, () => {
                    if (this.video) this.video.playbackRate = r;
                    this.hide();
                });
                item.dataset.rate = r;
                this.container.appendChild(item);
            })

            this.container.appendChild(el('hr', 'ccl-menu-hr'));

            this.statsItem = el('div', 'ccl-menu-item ccl-menu-item-stats', t('statsLabel'), () => {
                onToggleStats();
                this.hide();
            })
            this.container.appendChild(this.statsItem);

            this.el.addEventListener('click', () => { if (this.visible) this.hide(); });
        }

        update() {
            if (!this.video) return;
            Array.from(this.container.children).forEach(item => {
                if (item.dataset.rate) {
                    const rate = parseFloat(item.dataset.rate);
                    item.classList.toggle('active', Math.abs(this.video.playbackRate - rate) < 0.01);
                }
            });

            if (this.checkStatsState) this.statsItem.classList.toggle('active', this.checkStatsState());
        }

        get visible() { return this.el.classList.contains('visible'); }
        show() { this.el.classList.add('visible'); this.update(); }
        hide() { this.el.classList.remove('visible'); }
        toggle() { this.visible ? this.hide() : this.show(); }
        setVideo(v) { this.video = v; this.hide(); }
    }

    class StatsContainer {
        constructor() {
            this.video = null;
            this.el = el('div', 'ccl-stats-container');
            this.table = el('table');
            this.el.appendChild(this.table);

            this.isTracking = false;
            this.updateInterval = null;
            this.lastTime = 0;

            this.currentFps = '0.0';
            this.cachedColorSpace = null;

            this.cells = {};
            this.initTableDOM();
        }

        getSourceType() {
            if (!this.video) return 'Unknown';

            const src = this.video.currentSrc || this.video.src || '';

            if (src.startsWith('blob:')) return t('mediaSource');
            if (src.toLowerCase().includes('m3u8')) return 'HLS';
            if (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:')) return t('file');
            return 'Unknown';
        };

        getColorSpace() {
            if (this.cachedColorSpace) return this.cachedColorSpace;

            try {
                if (typeof VideoFrame === 'undefined') return 'Unsupported';
                const frame = new VideoFrame(this.video);
                const cs = frame.colorSpace;
                frame.close();

                if (cs) {
                    const primaries = cs.primaries || 'unknown';
                    const transfer = cs.transfer || 'unknown';
                    const matrix = cs.matrix || 'unknown';
                    this.cachedColorSpace = `${primaries} / ${transfer} / ${matrix}`;
                    return this.cachedColorSpace;
                }
            } catch (e) {
                return 'Unsupported';
            }
            return 'Unknown';
        }

        initTableDOM() {
            const addRow = (key, label) => {
                const r = el('tr');
                r.appendChild(el('th', '', label));
                const td = el('td', '', '');
                r.appendChild(td);
                this.table.appendChild(r);
                this.cells[key] = td;
            };

            addRow('source', t('sourceType'));
            addRow('viewport', t('viewport'));
            addRow('frameInfo', t('frameInfo'));
            addRow('resolution', t('resolution'));
            addRow('color', t('colorProfile'));
        }

        updateStaticUI() {
            if (!this.video) return;
            this.cells.source.textContent = this.getSourceType();
            this.cells.color.textContent = this.getColorSpace();
        }

        updateDynamicUI() {
            if (!this.video) return;
            this.cells.viewport.textContent = `${this.video.clientWidth}×${this.video.clientHeight} (${window.devicePixelRatio}x)`;
            this.cells.frameInfo.textContent = this.currentFps;
            this.cells.resolution.textContent = `${this.video.videoWidth}×${this.video.videoHeight}`;
        }

        startTracking() {
            this.stopTracking();
            if (!this.video) return;

            this.isTracking = true;
            let frameCount = 0;

            if ('requestVideoFrameCallback' in this.video) {
                const loop = () => {
                    if (!this.isTracking) return;
                    frameCount++;
                    this.video.requestVideoFrameCallback(loop);
                };
                this.video.requestVideoFrameCallback(loop);
            }

            this.lastTime = performance.now();
            this.updateInterval = setInterval(() => {
                const now = performance.now();
                const deltaMs = now - this.lastTime;

                if (deltaMs > 0) this.currentFps = (frameCount / (deltaMs / 1000)).toFixed(1);

                frameCount = 0;
                this.lastTime = now;

                this.updateDynamicUI();
            }, 500);
        }

        stopTracking() {
            this.isTracking = false;
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        }

        show() {
            this.el.classList.add('visible');
            this.updateStaticUI();
            this.updateDynamicUI();
            this.startTracking();
        }

        hide() {
            this.el.classList.remove('visible');
            this.stopTracking();
        }

        toggle() { this.el.classList.contains('visible') ? this.hide() : this.show(); }
        get visible() { return this.el.classList.contains('visible'); }

        setVideo(v) {
            this.video = v;
            this.cachedColorSpace = null;
            this.currentFps = '0.0';
            this.hide();
        }
    }

    class UIManager {
        constructor() {
            const style = document.createElement('style');
            style.textContent = STYLE;
            document.head.appendChild(style);

            this.stats = new StatsContainer();
            this.mediaControls = new MediaControls(() => this.stats.toggle(), () => this.stats.visible);

            this.video = null;
            this.components = [this.mediaControls, this.stats];

            this.container = el('div', 'ccl-controls-container');
            this.components.forEach(c => this.container.appendChild(c.el));
            document.body.appendChild(this.container);
        }

        attach(video) {
            this.video = video;
            this.components.forEach(c => c.setVideo(video));
        }

        detach() {
            this.video = null;
            this.components.forEach(c => c.hide());
        }

        reposition(rect) {
            if (!rect) return;
            this.container.style.top = rect.top + 'px';
            this.container.style.left = rect.left + 'px';
            this.container.style.width = rect.width + 'px';
            this.container.style.height = rect.height + 'px';
        }

        show() { this.mediaControls.show(); }
        hide() { this.mediaControls.hide(); }
    }

    class App {
        constructor() {
            this.ui = new UIManager();
            this.activeVideo = null;
            this.videoRect = null;

            this.isPaused = false

            this.hideTimeout = null;
            this.isThrottled = false;
            this.pollingId = null;
            this.layoutObserver = null;

            this.setupMenuCommands();
            this.setupEvents();
            this.setupKeyboardShortcuts();
            this.scan();
        }

        setupMenuCommands() {
            if (typeof GM_registerMenuCommand !== 'undefined') {
                const githubUrl = "https://github.com/ryu-dayo/chimo-chimo-loop";

                GM_registerMenuCommand(t('starGitHub'), () => {
                    GM_openInTab(githubUrl, { active: true });
                });

                GM_registerMenuCommand(t('feedback'), () => {
                    GM_openInTab(`${githubUrl}/issues`, { active: true });
                });
            }
        }

        setupEvents() {
            const onPlay = (e) => {
                if (e.target instanceof HTMLVideoElement) this.activate(e.target);
                this.isPaused = false;
                this.showAndTimer();
            };

            const onPause = () => {
                this.isPaused = true;
                this.showPersistent();
            };

            document.addEventListener('play', onPlay, true);
            document.addEventListener('pause', onPause, true);

            document.addEventListener('scroll', () => this.updateRectAndPosition(), { passive: true });
            window.addEventListener('resize', () => this.updateRectAndPosition(), { passive: true });

            const pip = this.ui.mediaControls.controlsBar.pipControl;

            document.addEventListener('enterpictureinpicture', () => pip.update(), true);
            document.addEventListener('leavepictureinpicture', () => pip.update(), true);
            document.addEventListener('webkitpresentationmodechanged', () => pip.update(), true);

            window.addEventListener('pointermove', (e) => this.handleGlobalPointer(e), { passive: true });
        }

        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ignore keys pressed in input fields
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

                // If Ctrl, Cmd, or Shift key is pressed, do not process to avoid conflicts with browser shortcuts
                if (e.ctrlKey || e.metaKey || e.shiftKey) return;

                const v = this.activeVideo;
                const bar = this.ui.mediaControls.controlsBar;
                const menu = this.ui.mediaControls.menu;

                // Use Alt/Option key as modifier to avoid conflicts with page shortcuts
                if (v && e.altKey) {
                    const handlers = {
                        'Space': () => { v.paused ? v.play() : v.pause(); },
                        'ArrowUp': () => { v.volume = Math.min(1, v.volume + 0.1); },
                        'ArrowDown': () => { v.volume = Math.max(0, v.volume - 0.1); },
                        'ArrowLeft': () => { v.currentTime -= 5; },
                        'ArrowRight': () => { v.currentTime += 5; },
                        'Equal': () => this.adjustPlaybackSpeed(0.25),
                        'Minus': () => this.adjustPlaybackSpeed(-0.25),
                        'Digit0': () => { v.playbackRate = 1.0; menu.update(); },
                        'KeyP': () => bar.pipControl.handlePip(),
                        'KeyL': () => { v.loop = !v.loop; bar.loopControl.update(); },
                        'KeyS': () => bar.screenshotControl.handleScreenshot(),
                        'KeyM': () => bar.mirrorControl.handleMirror(),
                        'KeyI': () => {
                            this.ui.stats.toggle();

                            if (!menu.el.classList.contains('hidden')) menu.statsItem.classList.toggle('active');
                        },
                        'KeyU': () => { v.muted = !v.muted; },
                        'KeyB': () => bar.abControl.handleClick(),
                        'KeyR': () => bar.rotateControl.handleRotate(),
                    };

                    const action = handlers[e.code];
                    if (action) {
                        e.stopImmediatePropagation();
                        e.preventDefault();
                        action();
                        return;
                    }
                }
            }, true);
        }

        adjustPlaybackSpeed(delta) {
            const v = this.activeVideo;

            if (!v) return;

            // Use the global SPEED_STEPS constant to ensure consistency
            const currentSpeed = v.playbackRate;

            // Find the closest speed step to the current speed
            let closestIndex = 0;
            let minDiff = Math.abs(SPEED_STEPS[0] - currentSpeed);

            for (let i = 1; i < SPEED_STEPS.length; i++) {
                const diff = Math.abs(SPEED_STEPS[i] - currentSpeed);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestIndex = i;
                }
            }

            // Adjust to the next or previous step based on delta
            let newIndex = closestIndex + (delta > 0 ? 1 : -1);

            // Ensure the index is within valid range
            newIndex = Math.max(0, Math.min(newIndex, SPEED_STEPS.length - 1));

            // Set the new playback speed
            v.playbackRate = SPEED_STEPS[newIndex];

            // Update the menu display
            this.ui.mediaControls.menu.update();
        }

        showPersistent() {
            this.clearHideTimer();
            this.ui.show();
        }

        updateRectAndPosition() {
            if (!this.activeVideo) return;

            if (!this.activeVideo.isConnected) {
                this.detach();
                return;
            }

            this.videoRect = this.activeVideo.getBoundingClientRect();
            this.ui.reposition(this.videoRect);
        }

        activate(video) {
            if (!this.shouldSwitchVideo(video)) return;
            this.activeVideo = video;
            this.ui.attach(video);

            this.startPolling(500);

            this.observerCleanup();
            this.observeVideoLayout(video);
        }

        detach() {
            this.ui.detach();
            this.activeVideo = null;
            this.observerCleanup();
        }

        shouldSwitchVideo(newVideo) {
            const oldVideo = this.activeVideo;
            if (!oldVideo) return true;
            if (oldVideo === newVideo) return false;
            if (!oldVideo.isConnected) return true;

            const o = this.videoRect;
            const n = newVideo.getBoundingClientRect();

            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            const dNew = Math.hypot(n.left + n.width / 2 - cx, n.top + n.height / 2 - cy);
            const dOld = Math.hypot(o.left + o.width / 2 - cx, o.top + o.height / 2 - cy);
            if (dNew < dOld) return true;

            if (!oldVideo.paused) {
                if (o.width * o.height > n.width * n.height) return false;
            }
            return true;
        }

        observeVideoLayout(video) {
            this.layoutObserver = new ResizeObserver(() => {
                if (!video.isConnected || video.style.display === 'none') {
                    this.ui.hide();
                    return;
                }

                if (this.activeVideo === video) {
                    this.updateRectAndPosition();
                }
            })
            this.layoutObserver.observe(video);
        }

        observerCleanup() {
            if (this.layoutObserver) {
                this.layoutObserver.disconnect();
                this.layoutObserver = null;
            }
        }

        scan() {
            const v = document.querySelector('video');
            if (v) this.activate(v);
        }

        handleGlobalPointer(e) {
            if (this.isThrottled) return;
            this.isThrottled = true;
            setTimeout(() => { this.isThrottled = false; }, 200);

            if (this.activeVideo && !this.activeVideo.isConnected) {
                this.detach();
                return;
            }
            if (!this.activeVideo || !this.videoRect || this.isPaused) return;

            const menu = this.ui.container.querySelector('.ccl-menu');
            if (menu.classList.contains('visible')) return;

            const rect = this.videoRect;
            const isOverVideo = (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
            );
            const isOverControls = this.ui.container.contains(e.target);
            if (isOverVideo || isOverControls) {
                this.showAndTimer();
            } else {
                this.ui.hide();
            }
        }

        showAndTimer(timeout = 3000) {
            this.clearHideTimer();
            this.ui.show();

            this.hideTimeout = setTimeout(() => {
                const menu = this.ui.container.querySelector('.ccl-menu');
                if (menu.classList.contains('visible')) return;
                this.ui.hide();
            }, timeout);
        }

        clearHideTimer() {
            if (!this.hideTimeout) return;
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        startPolling(duration) {
            this.stopPolling();
            const startTime = performance.now();

            const poll = (now) => {
                this.updateRectAndPosition();
                if (now - startTime < duration) {
                    this.pollingId = requestAnimationFrame(poll);
                }
            };
            this.pollingId = requestAnimationFrame(poll);
        }

        stopPolling() {
            if (!this.pollingId) return;
            cancelAnimationFrame(this.pollingId);
            this.pollingId = null;
        }
    }

    new App();
})();
