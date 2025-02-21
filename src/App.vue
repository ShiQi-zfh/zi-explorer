<script setup lang="ts">
import TitleBar from './components/TitleBar.vue'
import LockScreen from './components/LockScreen.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import TooltipService from './components/TooltipService.vue'
import SplashScreen from './components/SplashScreen.vue'
import { ref, provide, onMounted, onUnmounted } from 'vue'
import { useConfig } from './store/config'
import { useTheme } from './store/theme'
import { setTooltipService } from './directives/tooltip'
import { ElMessage } from 'element-plus'

const lockScreenRef = ref()
const settingsPanelRef = ref()
const tooltipRef = ref()
const shortcutEnabled = ref(true)
const showSplash = ref(true)

provide('lockScreenRef', lockScreenRef)
provide('settingsPanelRef', settingsPanelRef)
provide('shortcutEnabled', shortcutEnabled)

const { loadConfig, config } = useConfig()
const { setTheme } = useTheme()

// 处理快捷键
const handleKeyDown = (e: KeyboardEvent) => {
  // 如果是在输入框中，不处理快捷键
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return
  }

  const keys = []
  if (e.ctrlKey) keys.push('ctrl')
  if (e.shiftKey) keys.push('shift')
  if (e.altKey) keys.push('alt')
  if (e.key.length === 1) keys.push(e.key.toLowerCase())

  const shortcut = keys.join('+')

  // 检查是否匹配预设快捷键
  switch (shortcut) {
    case config.value.shortcuts.preset.openFolder:
      handleOpenFolder()
      break
    case config.value.shortcuts.preset.exit:
      window.ipcRenderer.send('window-close')
      break
    case config.value.shortcuts.preset.undo:
      // TODO: 实现撤销功能
      break
    case config.value.shortcuts.preset.redo:
      // TODO: 实现重做功能
      break
    case config.value.shortcuts.preset.cut:
      // TODO: 实现剪切功能
      break
    case config.value.shortcuts.preset.copy:
      // TODO: 实现复制功能
      break
    case config.value.shortcuts.preset.paste:
      // TODO: 实现粘贴功能
      break
  }

  // 检查是否匹配自定义快捷键
  if (shortcut === config.value.shortcuts.custom.bossKey) {
    handleBossKey()
  }
}

const handleOpenFolder = () => {
  window.ipcRenderer.send('trigger-import-folder')
}

const handleBossKey = () => {
  if (!config.value?.password) {
    ElMessage.warning('请先在设置中设置密码')
    return
  }
  if (lockScreenRef.value) {
    lockScreenRef.value.lock()
  }
}

onMounted(async () => {
  // 加载配置
  const result = await loadConfig()
  // 根据配置设置主题
  if (result?.data?.theme) {
    setTheme(result.data.theme)
  }
  // 设置 tooltip 服务实例
  if (tooltipRef.value) {
    setTooltipService(tooltipRef.value)
  }
  // 添加快捷键监听
  window.addEventListener('keydown', handleKeyDown)

  // 延迟关闭启动页面
  setTimeout(() => {
    showSplash.value = false
  }, 2000)
})

onUnmounted(() => {
  // 移除快捷键监听
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="app">
    <SplashScreen :visible="showSplash" />
    <TitleBar />
    <router-view v-show="!showSplash"></router-view>
    <LockScreen ref="lockScreenRef" />
    <SettingsPanel ref="settingsPanelRef" />
    <TooltipService ref="tooltipRef" />
  </div>
</template>

<style>
html,
body,
#app {
  margin: 0 !important;
  padding: 0 !important;
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
}

.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 全局消息提示样式 */
.el-message {
  z-index: 99999 !important;
}
</style>
