/**
 * @typedef { 'alt' | 'ctrl' | 'shift'} ValidMod
 * @typedef { 'altKey' | 'ctrlKey' | 'shiftKey'} ValidKeyName
 */

 /**
  * 常量（仅放带类型定义的技术映射表；业务数值参数归 config.js）
  */
const CONSTANTS = {
  /**
   * 合法的修饰键
   * Windows 按键对应的 Mac 按键，其对应关系列表如下：
   * | Windows 键 | Mac 按键 | KeyboardEvent 键名 |
   * | ---------- | -------- | ------------------ |
   * | Windows | Command | metaKey   |
   * | Alt | Option | altKey |
   * | Ctrl | Control | ctrlKey |
   * | Shift | Shift | shiftKey |
   * @type {ValidMod[]}
   */
  VALID_MODS: ["alt", "ctrl", "shift"],

  /**
   * 合法的修饰键对应的键名
   * @type {Record<ValidMod, ValidKeyName[]>}
   */
  VALID_MODS_KEYNAMES: {
    alt: ["altKey"],
    ctrl: ["ctrlKey"],
    shift: ["shiftKey"],
  },

  /**
   * 平台键名显示
   * @type {Record<'windows' | 'mac', Record<ValidMod, string>>}
   */
  VALID_MODS_KEYDISPLAY: {
    windows: {
      alt: "Alt",
      ctrl: "Ctrl",
      shift: "Shift",
    },
    mac: {
      alt: "Option",
      ctrl: "Control",
      shift: "Shift",
    },
  },
};

export { CONSTANTS };
