import { app, BrowserWindow, ipcMain, dialog, protocol, shell } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "fs/promises";

createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 768,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      nodeIntegration: true,
      webSecurity: false,
    },
  });

  //阻止F11进入全屏
  win.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F11") {
      // 阻止默认行为
      event.preventDefault();
    }
  });

  // 在开发环境下打开开发者工具
  if (VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools();
  }

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// 窗口控制
ipcMain.on("window-min", () => {
  win?.minimize();
});

// 添加导入文件夹的 IPC 处理
ipcMain.on("trigger-import-folder", () => {
  win?.webContents.send("execute-add-folder");
});

ipcMain.on("window-max", () => {
  if (win?.isMaximized()) {
    win?.restore();
  } else {
    win?.maximize();
  }
});

ipcMain.on("window-close", () => {
  win?.close();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  // 注册本地文件协议
  protocol.registerFileProtocol("file", (request, callback) => {
    const filePath = decodeURI(request.url.replace("file://", ""));
    callback({ path: filePath });
  });

  createWindow();
});

// 获取配置文件路径
const getConfigPath = () => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "config.json");
};

// 加载配置
ipcMain.handle("load-config", async () => {
  try {
    const configPath = getConfigPath();
    try {
      const data = await fs.readFile(configPath, "utf-8");
      return { success: true, data: JSON.parse(data) };
    } catch (error) {
      // 如果文件不存在，创建默认配置
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        const defaultConfig = {
          theme: "dark",
          password: "123456",
        };
        await fs.writeFile(
          configPath,
          JSON.stringify(defaultConfig, null, 2),
          "utf-8"
        );
        return { success: true, data: defaultConfig };
      }
      throw error;
    }
  } catch (error) {
    console.error("加载配置失败:", error);
    return { success: false, error: String(error) };
  }
});

// 保存配置
ipcMain.handle("save-config", async (_, config) => {
  try {
    const configPath = getConfigPath();
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
    return { success: true };
  } catch (error) {
    console.error("保存配置失败:", error);
    return { success: false, error: String(error) };
  }
});

// 选择文件夹
ipcMain.handle("select-folder", async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (!result.canceled) {
      return { success: true, path: result.filePaths[0] };
    }
    return { success: false };
  } catch (error) {
    console.error("选择文件夹失败:", error);
    return { success: false, error: String(error) };
  }
});

// 读取文件夹内容
ipcMain.handle("read-folder", async (_, folderPath: string) => {
  try {
    const files = await fs.readdir(folderPath);
    const contents = await Promise.all(
      files.map(async (file) => {
        const fullPath = path.join(folderPath, file);
        const stats = await fs.stat(fullPath);
        return {
          name: file,
          path: fullPath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modifiedTime: stats.mtime,
        };
      })
    );
    return { success: true, contents };
  } catch (error) {
    console.error("读取文件夹失败:", error);
    return { success: false, error: String(error) };
  }
});

// 打开本地文件夹
ipcMain.handle("open-folder", async (_, folderPath: string) => {
  try {
    await shell.openPath(folderPath);
    return { success: true };
  } catch (error) {
    console.error("打开文件夹失败:", error);
    return { success: false, error: String(error) };
  }
});
