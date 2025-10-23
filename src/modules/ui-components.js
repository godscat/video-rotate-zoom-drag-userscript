import { formatText } from './config.js';

/**
 * UI组件模块 - 创建和管理视频控制按钮界面
 */
export class UIComponents {
  /**
   * 创建控制按钮UI
   * @param {Object} config - 配置对象
   * @returns {Object|null} 包含所有控制按钮元素的对象，如果UI被禁用则返回null
   */
  static createControlButtons(config) {
    const { selectors, cssClasses, uiText, parameters, ui } = config;

    // 检查UI控制按钮是否被禁用
    if (!ui.controls.enabled) {
      return null;
    }

    const controlsContainer = document.querySelector(selectors.controlsContainer);
    if (!controlsContainer || document.getElementById(selectors.customControlsId))
      return null;

    // 创建自定义控制容器
    const customControls = document.createElement("div");
    customControls.id = selectors.customControlsId;
    customControls.className = cssClasses.customControls;

    // 缩放控制
    const zoomContainer = this._createZoomControls(config);

    // 旋转控制
    const rotateLeftBtn = this._createRotateButton(
      uiText.symbols.rotateLeft,
      uiText.buttons.rotateLeft,
      cssClasses.controlBtn
    );
    const rotateRightBtn = this._createRotateButton(
      uiText.symbols.rotateRight,
      uiText.buttons.rotateRight,
      cssClasses.controlBtn
    );

    // 旋转指示器
    const rotateIndicator = this._createRotateIndicator(
      formatText(uiText.formats.rotation, parameters.rotation.default),
      cssClasses.rotateIndicator
    );

    // 还原按钮
    const resetBtn = this._createResetButton(rotateIndicator, config);

    // 添加到容器
    customControls.appendChild(zoomContainer);
    customControls.appendChild(rotateLeftBtn);
    customControls.appendChild(rotateRightBtn);
    customControls.appendChild(resetBtn);

    // 插入到控制栏
    controlsContainer.insertBefore(
      customControls,
      controlsContainer.firstChild
    );

    return {
      customControls,
      zoomContainer,
      zoomOutBtn: zoomContainer.querySelector(`.${cssClasses.zoomBtn}:first-child`),
      zoomDisplay: zoomContainer.querySelector(`.${cssClasses.zoomDisplay}`),
      zoomInBtn: zoomContainer.querySelector(`.${cssClasses.zoomBtn}:last-child`),
      rotateLeftBtn,
      rotateRightBtn,
      resetBtn,
      rotateIndicator
    };
  }

  /**
   * 创建缩放控件
   * @private
   * @param {Object} config - 配置对象
   * @returns {HTMLElement} 缩放控件容器
   */
  static _createZoomControls(config) {
    const { cssClasses, uiText, parameters } = config;

    const zoomContainer = document.createElement("div");
    zoomContainer.className = cssClasses.zoomControls;

    const zoomOutBtn = document.createElement("button");
    zoomOutBtn.className = cssClasses.zoomBtn;
    zoomOutBtn.innerHTML = uiText.symbols.zoomOut;
    zoomOutBtn.title = uiText.buttons.zoomOut;

    const zoomDisplay = document.createElement("div");
    zoomDisplay.className = cssClasses.zoomDisplay;
    zoomDisplay.textContent = formatText(uiText.formats.zoom, parameters.zoom.default);

    const zoomInBtn = document.createElement("button");
    zoomInBtn.className = cssClasses.zoomBtn;
    zoomInBtn.innerHTML = uiText.symbols.zoomIn;
    zoomInBtn.title = uiText.buttons.zoomIn;

    zoomContainer.appendChild(zoomOutBtn);
    zoomContainer.appendChild(zoomDisplay);
    zoomContainer.appendChild(zoomInBtn);

    return zoomContainer;
  }

  /**
   * 创建旋转按钮
   * @private
   * @param {string} symbol - 旋转符号
   * @param {string} title - 按钮标题
   * @param {string} className - CSS类名
   * @returns {HTMLElement} 旋转按钮元素
   */
  static _createRotateButton(symbol, title, className) {
    const rotateBtn = document.createElement("button");
    rotateBtn.className = className;
    rotateBtn.innerHTML = symbol;
    rotateBtn.title = title;
    return rotateBtn;
  }

  /**
   * 创建旋转指示器
   * @private
   * @param {string} initialText - 初始文本
   * @param {string} className - CSS类名
   * @returns {HTMLElement} 旋转指示器元素
   */
  static _createRotateIndicator(initialText, className) {
    const rotateIndicator = document.createElement("div");
    rotateIndicator.className = className;
    rotateIndicator.textContent = initialText;
    return rotateIndicator;
  }

  /**
   * 创建还原按钮
   * @private
   * @param {HTMLElement} rotateIndicator - 旋转指示器元素
   * @param {Object} config - 配置对象
   * @returns {HTMLElement} 还原按钮元素
   */
  static _createResetButton(rotateIndicator, config) {
    const { cssClasses, uiText, styles } = config;

    const resetBtn = document.createElement("button");
    resetBtn.className = `${cssClasses.controlBtn} ${cssClasses.resetBtn}`;
    resetBtn.innerHTML = uiText.buttons.reset;
    resetBtn.title = uiText.buttons.resetTitle;
    resetBtn.style.background = styles.resetButton.background;
    resetBtn.appendChild(rotateIndicator);
    return resetBtn;
  }
}