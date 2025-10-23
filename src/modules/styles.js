/**
 * 样式模块 - 管理视频控制器的CSS样式
 */
export class Styles {
  /**
   * 样式对象转CSS字符串
   * @param {Object} styles - 样式对象
   * @returns {string} CSS字符串
   */
  static _stylesToCSS(styles) {
    return Object.entries(styles)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');
  }

  /**
   * 生成动态CSS样式
   * @param {Object} config - 配置对象
   * @returns {string} CSS样式字符串
   */
  static _generateStyles(config) {
    const { cssClasses, styles } = config;

    return `
      .${cssClasses.customControls} {
        ${this._stylesToCSS(styles.container)}
      }

      .fp-controls {
        .${cssClasses.customControls} {
            position: absolute;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-left: 350px;
            margin-top: 14px; margin-bottom: 0;
          }
      }

      .${cssClasses.controlBtn} {
        ${this._stylesToCSS(styles.button)}
      }

      .${cssClasses.controlBtn}:hover {
        ${this._stylesToCSS(styles.buttonHover)}
      }

      .${cssClasses.controlBtn} i {
        margin-right: 6px;
        font-size: 16px;
      }

      .${cssClasses.zoomControls} {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .${cssClasses.zoomBtn} {
        ${this._stylesToCSS({ ...styles.button, ...styles.zoomButton })}
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        cursor: pointer;
      }

      .${cssClasses.zoomDisplay} {
        ${this._stylesToCSS(styles.zoomDisplay)}
      }

      .${cssClasses.rotateBtn} {
        position: relative;
      }

      .${cssClasses.resetBtn} {
         position: relative;
      }

      .${cssClasses.resetBtn} .${cssClasses.rotateIndicator} {
        ${this._stylesToCSS(styles.rotateIndicator)}
      }

      .bpx-player-container .bpx-player-video-wrap {
        ${this._stylesToCSS(styles.videoContainer)}
      }

      .bpx-player-container .bpx-player-video-wrap:active {
        ${this._stylesToCSS(styles.videoContainerActive)}
      }
    `;
  }

  /**
   * 注入自定义CSS样式
   * @param {Object} config - 配置对象
   */
  static injectStyles(config) {
    const styles = this._generateStyles(config);
    GM_addStyle(styles);
  }
}