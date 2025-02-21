import { ref } from "vue";
import { ElMessage } from "element-plus";
import CryptoJS from "crypto-js";

export interface AppConfig {
  theme: "dark" | "light";
  password: string; // 存储加密后的密码
  bossKey: string; // 老板键快捷键
  shortcuts: {
    preset: {
      // 预设快捷键，不允许修改
      openFolder: string;
      exit: string;
      undo: string;
      redo: string;
      cut: string;
      copy: string;
      paste: string;
    };
    custom: {
      // 自定义快捷键
      bossKey: string;
      // 其他自定义快捷键...
    };
  };
  folders: Array<{
    name: string;
    path: string;
  }>;
  // 在这里添加其他配置项
}

// 加密密码
const encryptPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

// 验证密码
const verifyPassword = (
  inputPassword: string,
  hashedPassword: string
): boolean => {
  const hashedInput = encryptPassword(inputPassword);
  return hashedInput === hashedPassword;
};

const defaultConfig: AppConfig = {
  theme: "dark",
  password: encryptPassword("123456"), // 默认密码加密存储
  bossKey: "ctrl+shift+l", // 默认老板键
  shortcuts: {
    preset: {
      openFolder: "ctrl+o",
      exit: "alt+f4",
      undo: "ctrl+z",
      redo: "ctrl+y",
      cut: "ctrl+x",
      copy: "ctrl+c",
      paste: "ctrl+v",
    },
    custom: {
      bossKey: "ctrl+shift+l",
    },
  },
  folders: [],
};

const config = ref<AppConfig>({ ...defaultConfig });

// 获取要保存的配置（只包含需要保存的字段）
const getConfigForSave = (config: AppConfig): Partial<AppConfig> => {
  // 创建一个新的对象，只包含需要保存的字段
  return {
    theme: config.theme,
    password: config.password,
    bossKey: config.bossKey,
    shortcuts: {
      preset: { ...config.shortcuts.preset },
      custom: { ...config.shortcuts.custom },
    },
    folders: config.folders,
  };
};

export function useConfig() {
  const loadConfig = async () => {
    try {
      const result = await window.ipcRenderer.invoke("load-config");
      if (result.success) {
        // 确保合并后的配置包含所有必要的字段
        config.value = {
          ...defaultConfig,
          ...result.data,
          shortcuts: {
            preset: {
              ...defaultConfig.shortcuts.preset,
              ...result.data?.shortcuts?.preset,
            },
            custom: {
              ...defaultConfig.shortcuts.custom,
              ...result.data?.shortcuts?.custom,
            },
          },
        };
        // 同步主题
        document.documentElement.setAttribute("data-theme", config.value.theme);
        return result;
      } else {
        ElMessage.warning("无法读取配置文件，已使用默认配置");
        return { success: false, data: defaultConfig };
      }
    } catch (error) {
      console.error("加载配置失败:", error);
      ElMessage.error("加载配置失败");
      return { success: false, data: defaultConfig };
    }
  };

  const saveConfig = async () => {
    try {
      // 只保存需要的配置字段，并确保是纯对象
      const configToSave = getConfigForSave(config.value);
      const result = await window.ipcRenderer.invoke(
        "save-config",
        JSON.parse(JSON.stringify(configToSave))
      );
      if (!result.success) {
        ElMessage.error("保存配置失败");
      }
    } catch (error) {
      console.error("保存配置失败:", error);
      ElMessage.error("保存配置失败");
    }
  };

  const updateConfig = async (newConfig: Partial<AppConfig>) => {
    // 如果更新包含密码，先进行加密
    if (newConfig.password) {
      newConfig.password = encryptPassword(newConfig.password);
    }
    config.value = { ...config.value, ...newConfig };
    await saveConfig();
  };

  // 更新密码的专用方法
  const updatePassword = async (newPassword: string) => {
    const hashedPassword = encryptPassword(newPassword);
    config.value.password = hashedPassword;
    await saveConfig();
  };

  // 检查快捷键是否冲突
  const checkShortcutConflict = (
    shortcut: string,
    ignoreKey?: string
  ): boolean => {
    // 检查是否与预设快捷键冲突
    const presetValues = Object.values(config.value.shortcuts.preset);
    if (presetValues.includes(shortcut)) {
      return true;
    }

    // 检查是否与其他自定义快捷键冲突（除了要忽略的键）
    const customValues = Object.entries(config.value.shortcuts.custom)
      .filter(([key]) => key !== ignoreKey)
      .map(([_, value]) => value);

    return customValues.includes(shortcut);
  };

  return {
    config,
    loadConfig,
    saveConfig,
    updateConfig,
    updatePassword,
    verifyPassword: (inputPassword: string) =>
      verifyPassword(inputPassword, config.value.password),
    checkShortcutConflict,
  };
}
