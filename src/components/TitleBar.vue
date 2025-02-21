<template>
  <div class="title-bar" :class="{ 'theme-light': !isDarkTheme }">
    <div class="title-section">
      <div class="title">Zi Explorer</div>
      <div class="menu-bar">
        <div class="menu-wrapper">
          <div class="menu-button" :class="{ 'menu-active': fileMenuActive }" @click="toggleFileMenu"
            @mouseenter="handleMenuHover('file')">
            <span>文件</span>
          </div>
          <div class="menu-dropdown" v-show="fileMenuActive">
            <div class="menu-dropdown-item" @click="handleOpenFolder">
              <span>导入文件夹...</span>
              <span class="shortcut">Ctrl+O</span>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-dropdown-item" @click="handleExit">
              <span>退出</span>
              <span class="shortcut">Alt+F4</span>
            </div>
          </div>
        </div>
        <div class="menu-wrapper">
          <div class="menu-button" :class="{ 'menu-active': editMenuActive }" @click="toggleEditMenu"
            @mouseenter="handleMenuHover('edit')">
            <span>编辑</span>
          </div>
          <div class="menu-dropdown" v-show="editMenuActive">
            <div class="menu-dropdown-item">
              <span>撤销</span>
              <span class="shortcut">Ctrl+Z</span>
            </div>
            <div class="menu-dropdown-item">
              <span>重做</span>
              <span class="shortcut">Ctrl+Y</span>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-dropdown-item">
              <span>剪切</span>
              <span class="shortcut">Ctrl+X</span>
            </div>
            <div class="menu-dropdown-item">
              <span>复制</span>
              <span class="shortcut">Ctrl+C</span>
            </div>
            <div class="menu-dropdown-item">
              <span>粘贴</span>
              <span class="shortcut">Ctrl+V</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="action-buttons">
      <div class="action-button" @click="handleRefresh" v-tooltip="'刷新页面'">
        <el-icon>
          <Refresh />
        </el-icon>
      </div>
      <div class="action-button" @click="handleThemeChange" v-tooltip="isDarkTheme ? '切换到浅色主题' : '切换到深色主题'">
        <el-icon>
          <Moon v-if="isDarkTheme" />
          <Sunny v-else />
        </el-icon>
      </div>
      <div class="action-button" @click="openSettings" v-tooltip="'设置'">
        <el-icon>
          <Setting />
        </el-icon>
      </div>
      <div class="action-button" @click="lockApp" v-tooltip="'锁定'">
        <el-icon>
          <Lock />
        </el-icon>
      </div>
    </div>
    <div class="window-controls">
      <div class="control-button" @click="minimize">
        <el-icon>
          <Minus />
        </el-icon>
      </div>
      <div class="control-button" @click="maximize">
        <el-icon>
          <FullScreen />
        </el-icon>
      </div>
      <div class="control-button close" @click="close">
        <el-icon>
          <Close />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, Ref } from 'vue'
import { Minus, FullScreen, Close, Moon, Sunny, Lock, Refresh, Setting } from '@element-plus/icons-vue'
import { IpcRenderer } from 'electron'
import { useTheme } from '../store/theme'
import { useConfig } from '../store/config'
import { ElMessage } from 'element-plus'
import type { AppConfig } from '../store/config'
import { eventBus } from '../utils/eventBus'

interface LockScreenInstance {
  lock: () => void
  isLocked: boolean
}

interface SettingsPanelInstance {
  open: () => void
}

declare global {
  interface Window {
    ipcRenderer: IpcRenderer
  }
}

const { isDarkTheme, toggleTheme } = useTheme()
const { config, updateConfig } = useConfig() as { config: Ref<AppConfig>, updateConfig: (newConfig: Partial<AppConfig>) => Promise<void> }
const fileMenuActive = ref(false)
const editMenuActive = ref(false)
const menuActivated = ref(false)

const lockScreenRef = inject<Ref<LockScreenInstance>>('lockScreenRef')
const settingsPanelRef = inject<Ref<SettingsPanelInstance>>('settingsPanelRef')

const toggleFileMenu = () => {
  fileMenuActive.value = !fileMenuActive.value
  if (fileMenuActive.value) {
    editMenuActive.value = false
    menuActivated.value = true
  }
}

const toggleEditMenu = () => {
  editMenuActive.value = !editMenuActive.value
  if (editMenuActive.value) {
    fileMenuActive.value = false
    menuActivated.value = true
  }
}

const handleMenuHover = (menuType: 'file' | 'edit') => {
  if (!menuActivated.value) return

  if (menuType === 'file') {
    fileMenuActive.value = true
    editMenuActive.value = false
  } else {
    editMenuActive.value = true
    fileMenuActive.value = false
  }
}

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.menu-wrapper')) {
    fileMenuActive.value = false
    editMenuActive.value = false
    menuActivated.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const minimize = () => {
  window.ipcRenderer.send('window-min')
}

const maximize = () => {
  window.ipcRenderer.send('window-max')
}

const close = () => {
  window.ipcRenderer.send('window-close')
}

const lockApp = () => {
  // 检查密码是否为空或未定义
  if (!config.value?.password) {
    ElMessage.warning('请先在设置中设置密码')
    return
  }

  if (lockScreenRef?.value) {
    lockScreenRef.value.lock()
  }
}

const handleThemeChange = async () => {
  const newTheme = toggleTheme()
  // 保存主题设置到配置文件
  try {
    await updateConfig({ theme: newTheme })
  } catch (error) {
    console.error('保存主题设置失败:', error)
  }
}

const handleOpenFolder = () => {
  window.ipcRenderer.send('trigger-import-folder')
  // 关闭菜单
  fileMenuActive.value = false
  menuActivated.value = false
}

const handleExit = () => {
  window.ipcRenderer.send('window-close')
}

const handleRefresh = async () => {
  // 重新加载配置
  const result = await window.ipcRenderer.invoke('load-config')
  if (result.success && result.data) {
    // 更新主题
    if (result.data.theme) {
      const theme = result.data.theme
      document.documentElement.setAttribute('data-theme', theme)
      isDarkTheme.value = theme === 'dark'
    }
  }
  // 返回根目录
  eventBus.emit('return-root')
  // 触发文件夹刷新
  eventBus.emit('refresh-folder')
}

const openSettings = () => {
  if (settingsPanelRef?.value) {
    settingsPanelRef.value.open()
  }
}
</script>

<style lang="scss" scoped>
$bg-color-light: #f3f3f3;
$text-color-light: #2c2c2c;
$hover-bg-light: #e5e5e5;
$active-bg-light: #d0d0d0;
$border-color-light: #e0e0e0;

$bg-color: #1e1e1e;
$text-color: #cccccc;
$hover-bg: #2a2d2e;
$active-bg: #37373d;
$border-color: #454545;
$close-hover: #c42b1c;

.title-bar {
  height: 36px;
  min-height: 36px;
  background: var(--bg-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  -webkit-app-region: drag;
  user-select: none;
  border-bottom: 1px solid var(--border-color);
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  z-index: 1000;
  transition: all 0.3s ease;

  &.theme-light {
    background: $bg-color-light;
    border-bottom-color: $border-color-light;

    .title {
      color: $text-color-light;
    }

    .menu-item {
      color: $text-color-light;

      &:hover {
        background-color: $hover-bg-light;
      }

      &.menu-active {
        background-color: $active-bg-light;
      }
    }

    .menu-dropdown {
      background: $bg-color-light;
      border-color: $border-color-light;
      color: $text-color-light;

      &-item:hover {
        background-color: $hover-bg-light;
      }
    }

    .menu-divider {
      background-color: $border-color-light;
    }

    .control-button {
      color: $text-color-light;

      &:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      :deep(.el-icon) {
        color: $text-color-light;
      }
    }
  }
}

.title-section {
  display: flex;
  align-items: center;
  flex: 1;

  .title {
    font-size: 12px;
    color: var(--text-color);
    margin-left: 12px;
    opacity: 0.6;
    font-weight: normal;
  }
}

.menu-bar {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
  margin-left: 12px;
}

.menu-wrapper {
  position: relative;

  .menu-button {
    height: 28px;
    padding: 0 12px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    font-size: 13px;
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s ease;
    background: transparent;
    border: 1px solid transparent;

    &:hover {
      background-color: var(--hover-bg);
      border-color: var(--border-color);
    }

    &.menu-active {
      background-color: var(--active-bg);
      border-color: var(--border-color);
    }
  }

  .menu-dropdown {
    position: absolute;
    top: calc(100% + 2px);
    left: 0;
    min-width: 260px;
    background: var(--dropdown-bg);
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    z-index: 1000;
    padding: 4px;
    animation: dropdownFadeIn 0.15s ease-out;
    color: var(--text-color);

    &-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 8px;
      height: 28px;
      font-size: 13px;
      cursor: pointer;
      color: inherit;
      transition: all 0.1s ease;
      border-radius: 4px;
      margin: 0;

      >span {
        &:first-child {
          padding-left: 8px;
        }

        &:last-child {
          padding-right: 8px;
        }
      }

      &:hover {
        background-color: var(--hover-bg);
      }
    }
  }
}

.menu-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 4px 0;
}

.shortcut {
  color: #858585;
  font-size: 13px;
  margin-left: 40px;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.action-buttons {
  display: flex;
  gap: 4px;
  margin-left: auto;
  margin-right: 8px;
  height: 100%;
  align-items: center;
  -webkit-app-region: no-drag;

  :deep(.custom-tooltip-trigger) {
    height: 100%;
    display: flex;
    align-items: center;
  }

  .action-button {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text-color);

    &:hover {
      background-color: var(--hover-bg);
    }

    .el-icon {
      font-size: 18px;
    }
  }
}

.window-controls {
  display: flex;
  -webkit-app-region: no-drag;
  height: 100%;

  .control-button {
    height: 100%;
    width: 46px;
    min-width: 46px;
    padding: 0;
    margin: 0;
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s ease;
    color: var(--text-color);
    cursor: pointer;
    background: transparent;

    &:hover {
      background-color: var(--hover-bg);

      :deep(.el-icon) {
        opacity: 1;
      }
    }

    &.close {
      width: 48px;
      min-width: 48px;

      &:hover {
        background-color: #c42b1c;

        :deep(.el-icon) {
          color: #ffffff;
          opacity: 1;
        }
      }
    }
  }

  .control-button.theme-toggle {
    width: 46px;
    min-width: 46px;
  }
}

:deep(.el-icon) {
  font-size: 18px;
  color: var(--text-color);
  opacity: 0.8;
  transition: all 0.1s ease;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>