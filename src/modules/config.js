/**
 * 配置文件 - 统一管理所有硬编码的配置项
 * 支持不同平台的配置扩展
 */

const CONFIG = {
  // 当前平台配置
  platform: "bilibili",

  // DOM选择器配置
  selectors: {
    // 控制容器选择器
    controlsContainer: ".bpx-player-control-bottom-center,.fp-controls",
    // 视频容器选择器
    videoContainer: ".bpx-player-video-wrap,.fp-player",
    // 全屏按钮选择器
    fullscreenBtn: ".bpx-player-ctrl-full",
    // 自定义控制容器ID
    customControlsId: "biliCustomControls",
    // 忽略输入的标签
    ignoreInputTag: "INPUT",
  },

  // CSS类名配置
  cssClasses: {
    prefix: "bili",
    customControls: "bili-custom-controls",
    controlBtn: "bili-control-btn",
    zoomControls: "bili-zoom-controls",
    zoomBtn: "bili-zoom-btn",
    zoomDisplay: "bili-zoom-display",
    rotateBtn: "bili-rotate-btn",
    resetBtn: "resetBtn",
    rotateIndicator: "bili-rotate-indicator",
  },

  // 样式配置
  styles: {
    // 主容器样式
    container: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginLeft: "15px",
      marginBottom: "4px",
      marginRight: "15px",
    },
    // 按钮样式
    button: {
      background: "rgba(0, 0, 0, 0.5)",
      border: "none",
      borderRadius: "4px",
      color: "white",
      cursor: "pointer",
      fontSize: "14px",
      height: "22px",
      padding: "0 12px",
      display: "flex",
      alignItems: "center",
      transition: "all 0.2s ease",
    },
    // 按钮悬停样式
    buttonHover: {
      background: "rgba(255, 255, 255, 0.2)",
    },
    // 还原按钮特殊样式
    resetButton: {
      background: "rgba(255, 50, 50, 0.6)",
    },
    // 缩放按钮样式
    zoomButton: {
      width: "32px",
      fontSize: "18px",
      justifyContent: "center",
    },
    // 缩放显示样式
    zoomDisplay: {
      minWidth: "50px",
      textAlign: "center",
      fontSize: "14px",
      color: "white",
    },
    // 旋转指示器样式
    rotateIndicator: {
      position: "absolute",
      top: "-5px",
      right: "-5px",
      background: "#ff4e4e",
      color: "white",
      borderRadius: "50%",
      width: "18px",
      height: "18px",
      fontSize: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    // 视频容器样式
    videoContainer: {
      transition: "transform 0.3s ease",
      transformOrigin: "center center",
      cursor: "grab",
    },
    // 视频容器激活状态样式
    videoContainerActive: {
      cursor: "grabbing",
    },
  },

  // 功能参数配置
  parameters: {
    // 缩放配置
    zoom: {
      min: 50,
      max: 300,
      step: 5,
      default: 100,
      dragThreshold: 100, // 大于此值才能拖拽
      enableDragThreshold: false, // 是否启用拖拽阈值
    },
    // 旋转配置
    rotation: {
      step: 90, // 每次旋转的角度
      default: 0,
    },
    // 移动配置
    move: {
      stepSize: 20, // Shift+Up 移动的像素
    },
  },
  eventHandling: {
    captureEvents: true, // 使用捕获模式
    preventPropagation: true, // 阻止事件冒泡
    preventDefault: true, // 阻止默认行为
  },
  // UI文本配置
  uiText: {
    // 按钮文本
    buttons: {
      reset: "还原",
      zoomOut: "缩小视频",
      zoomIn: "放大视频",
      rotateLeft: "向左旋转90°",
      rotateRight: "向右旋转90°",
      resetTitle: "还原视频到初始状态",
    },
    // 按钮符号
    symbols: {
      rotateLeft: "↺",
      rotateRight: "↻",
      zoomOut: "-",
      zoomIn: "+",
    },
    // 显示格式
    formats: {
      zoom: "{value}%",
      rotation: "{value}°",
    },
  },

  // 键盘快捷键配置
  shortcuts: {
    // 缩放快捷键
    zoom: {
      in: {
        keys: ["shift", "+"],
      },
      out: {
        keys: ["shift", "-"],
      },
    },
    // 旋转快捷键
    rotation: {
      left: {
        keys: ["shift", "l"],
      },
      right: {
        keys: ["shift", "r"],
      },
    },
    // 功能快捷键
    actions: {
      reset: {
        keys: ["shift", "0"],
      },
      fullscreen: {
        keys: ["shift", "space"],
      },
      moveUp: {
        keys: ["shift", "arrowup"],
      },
      moveDown: {
        keys: ["shift", "arrowdown"],
      },
      moveLeft: {
        keys: ["shift", "arrowleft"],
      },
      moveRight: {
        keys: ["shift", "arrowright"],
      },
    },
  },

  // 滚轮缩放配置
  wheel: {
    enabled: true, // 是否启用滚轮缩放
    modifier: "shift", // 修饰键: 'ctrl', 'shift', 'alt'
    preventPageScroll: true, // 阻止页面滚动
  },

  // 拖拽功能配置
  drag: {
    enabled: true, // 是否启用拖拽功能
    modifier: null, // 修饰键: 'ctrl', 'shift', 'alt', null 表示不需要修饰键
    preventDefault: true, // 是否阻止默认行为
  },

  // UI 控制配置
  ui: {
    controls: {
      enabled: true, // 是否显示控制按钮
    },
  },

  // 平台特定配置
  platforms: {
    bilibili: {
      // B站特定的配置覆盖
      selectors: {
        controlsContainer: ".bpx-player-control-bottom-center,.fp-controls",
        videoContainer: ".bpx-player-video-wrap,.fp-player",
        fullscreenBtn: ".bpx-player-ctrl-full",
      },
      // B站拖拽配置
      drag: {
        modifier: "ctrl", // B站需要按住 Ctrl 才能拖拽
      },
    },
    youtube: {
      // YouTube特定配置
      selectors: {
        controlsContainer: ".ytp-left-controls",
        videoContainer: ".html5-video-container",
        fullscreenBtn: ".ytp-fullscreen-button",
      },
      // YouTube拖拽配置
      drag: {
        modifier: "ctrl", // YouTube需要按住 Ctrl 才能拖拽
      },
    },
    iwara: {
      // Iwara特定配置
      selectors: {
        controlsContainer: ".vjs-control-bar",
        videoContainer: ".video-js",
        fullscreenBtn: ".vjs-fullscreen-control",
      },
      // Iwara拖拽配置
      drag: {
        modifier: "ctrl", // Iwara需要按住 Ctrl 才能拖拽
      },
      // Iwara UI 配置
      ui: {
        controls: {
          enabled: false, // Iwara 平台默认关闭控制按钮
        },
      },
    },
    // 可以继续添加其他平台配置
  },
};

/**
 * 获取当前平台的配置
 * @param {string} platform - 平台名称
 * @returns {Object} 平台特定配置
 */
function getPlatformConfig(platform = CONFIG.platform) {
  const baseConfig = CONFIG;
  const platformConfig = CONFIG.platforms[platform];

  if (!platformConfig) {
    return baseConfig;
  }

  // 深度合并配置
  return {
    ...baseConfig,
    platform,
    selectors: {
      ...baseConfig.selectors,
      ...platformConfig.selectors,
    },
    drag: {
      ...baseConfig.drag,
      ...(platformConfig.drag || {}),
    },
    ui: {
      ...baseConfig.ui,
      ...(platformConfig.ui || {}),
    },
    // 合并平台特定的参数和事件处理配置
    ...(platformConfig.parameters && {
      parameters: { ...baseConfig.parameters, ...platformConfig.parameters },
    }),
    ...(platformConfig.eventHandling && {
      eventHandling: platformConfig.eventHandling,
    }),
  };
}

/**
 * 格式化显示文本
 * @param {string} format - 格式字符串
 * @param {*} value - 值
 * @returns {string} 格式化后的文本
 */
function formatText(format, value) {
  return format.replace("{value}", value);
}

export default CONFIG;
export { getPlatformConfig, formatText };
