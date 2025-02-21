<template>
    <Transition name="settings-panel">
        <div class="settings-overlay" v-if="visible" @click.self="close">
            <div class="settings-panel">
                <div class="panel-header">
                    <h2>设置</h2>
                    <el-icon class="close-icon" @click="close">
                        <Close />
                    </el-icon>
                </div>
                <div class="panel-content">
                    <div class="settings-section">
                        <div class="section-title">主题设置</div>
                        <div class="section-content">
                            <el-switch v-model="isDarkTheme" inline-prompt :active-icon="Moon" :inactive-icon="Sunny"
                                @change="handleThemeChange" />
                            <span class="setting-label">{{ isDarkTheme ? '深色主题' : '浅色主题' }}</span>
                        </div>
                    </div>

                    <div class="settings-section">
                        <div class="section-title">安全设置</div>
                        <div class="section-content password-section">
                            <el-form ref="formRef" :model="form" :rules="rules">
                                <el-form-item prop="password">
                                    <el-input v-model="form.password" type="password" placeholder="请输入新密码" show-password
                                        clearable @keyup.enter="handleUpdatePassword">
                                        <template #append>
                                            <el-button @click="handleUpdatePassword" :loading="updating">
                                                更新
                                            </el-button>
                                        </template>
                                    </el-input>
                                </el-form-item>
                            </el-form>
                        </div>
                    </div>

                    <div class="settings-section">
                        <div class="section-title">快捷键设置</div>
                        <div class="section-content">
                            <div class="shortcut-item">
                                <span class="setting-label">老板键</span>
                                <el-input v-model="bossKey" placeholder="点击输入快捷键" readonly
                                    @keydown.prevent="handleKeyDown" @focus="handleShortcutFocus"
                                    @blur="handleShortcutBlur" />
                                <el-button @click="resetBossKey" text type="info">重置</el-button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, reactive, inject } from 'vue'
import { Moon, Sunny, Close } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useConfig } from '../store/config'
import { ElMessage } from 'element-plus'
import { Ref } from 'vue'

const visible = ref(false)
const updating = ref(false)
const formRef = ref<FormInstance>()
const shortcutEnabled = inject('shortcutEnabled') as Ref<boolean>

const { config, updateConfig, updatePassword, checkShortcutConflict } = useConfig()
const isDarkTheme = ref(config.value.theme === 'dark')

const form = reactive({
    password: ''
})

const rules: FormRules = {
    password: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
    ]
}

const defaultBossKey = 'ctrl+shift+l'
const bossKey = ref(config.value.bossKey)
let recordingKeys = false
let tempShortcut = '' // 缓存当前快捷键

const handleShortcutFocus = () => {
    shortcutEnabled.value = false
    // 缓存当前快捷键
    tempShortcut = bossKey.value
    // 清空输入框
    bossKey.value = ''
}

const handleShortcutBlur = () => {
    shortcutEnabled.value = true
    recordingKeys = false
    // 如果没有设置新的快捷键，恢复原来的值
    if (!bossKey.value) {
        bossKey.value = tempShortcut
    }
}

const handleKeyDown = (e: KeyboardEvent) => {
    e.preventDefault()
    if (!recordingKeys) {
        recordingKeys = true
        bossKey.value = ''
    }

    const keys = []
    if (e.ctrlKey) keys.push('ctrl')
    if (e.shiftKey) keys.push('shift')
    if (e.altKey) keys.push('alt')

    // 只记录修饰键和字母键
    if (e.key.length === 1) {
        keys.push(e.key.toLowerCase())
    }

    if (keys.length > 0) {
        const newShortcut = keys.join('+')
        bossKey.value = newShortcut
        // 如果包含了字母键，说明快捷键设置完成
        if (e.key.length === 1) {
            recordingKeys = false
            // 检查快捷键冲突
            if (checkShortcutConflict(newShortcut, 'bossKey')) {
                ElMessage.error('该快捷键已被占用')
                bossKey.value = ''
                return
            }
            // 保存新的快捷键
            updateConfig({
                bossKey: newShortcut,
                shortcuts: {
                    ...config.value.shortcuts,
                    custom: {
                        ...config.value.shortcuts.custom,
                        bossKey: newShortcut
                    }
                }
            })
            tempShortcut = newShortcut // 更新缓存的快捷键
        }
    }
}

const resetBossKey = async () => {
    bossKey.value = defaultBossKey
    tempShortcut = defaultBossKey // 更新缓存的快捷键
    await updateConfig({
        bossKey: defaultBossKey,
        shortcuts: {
            ...config.value.shortcuts,
            custom: {
                ...config.value.shortcuts.custom,
                bossKey: defaultBossKey
            }
        }
    })
}

const handleThemeChange = async (value: boolean) => {
    const theme = value ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    // 保存主题设置到配置文件
    try {
        await updateConfig({ theme })
    } catch (error) {
        console.error('保存主题设置失败:', error)
    }
}

const handleUpdatePassword = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            try {
                updating.value = true
                await updatePassword(form.password)
                ElMessage.success('密码更新成功')
                form.password = ''
                formRef.value?.clearValidate()
            } catch (error) {
                ElMessage.error('密码更新失败')
            } finally {
                updating.value = false
            }
        }
    })
}

const open = () => {
    visible.value = true
    form.password = ''
}

const close = () => {
    visible.value = false
    form.password = ''
    formRef.value?.clearValidate()
    shortcutEnabled.value = true
    recordingKeys = false
    // 如果输入框是空的，恢复原来的值
    if (!bossKey.value) {
        bossKey.value = tempShortcut
    }
}

defineExpose({
    open
})
</script>

<style lang="scss" scoped>
.settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.settings-panel {
    width: 480px;
    max-width: 90vw;
    max-height: 90vh;
    background: var(--dropdown-bg);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--border-color);
}

.panel-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
        color: var(--text-color);
    }

    .close-icon {
        font-size: 20px;
        color: var(--text-color);
        opacity: 0.6;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.2s ease;

        &:hover {
            opacity: 1;
            background: var(--hover-bg);
        }
    }
}

.panel-content {
    padding: 24px;
    overflow-y: auto;
}

.settings-section {
    margin-bottom: 32px;

    &:last-child {
        margin-bottom: 0;
    }

    .section-title {
        font-size: 16px;
        font-weight: 500;
        color: var(--text-color);
        margin-bottom: 16px;
        opacity: 0.8;
    }

    .section-content {
        display: flex;
        align-items: center;
        gap: 12px;

        .setting-label {
            color: var(--text-color);
            font-size: 14px;
        }
    }

    .password-section {
        :deep(.el-form) {
            width: 100%;

            .el-input-group__append {
                padding: 0;
                background-color: transparent;
                border-color: var(--border-color);

                .el-button {
                    height: 38px;
                    border: none;
                    padding: 0 16px;
                    border-radius: 0;

                    &:hover {
                        background-color: var(--hover-bg);
                    }

                    &:active {
                        background-color: var(--active-bg);
                    }
                }
            }

            .el-input__wrapper {
                background-color: transparent;
                border-color: var(--border-color);
                transition: all 0.2s ease;

                &:hover {
                    border-color: var(--text-color);
                }

                &.is-focus {
                    border-color: var(--text-color);
                    box-shadow: 0 0 0 1px var(--text-color);
                }
            }

            .el-input__inner {
                height: 38px;
                color: var(--text-color);
                font-size: 14px;
                text-transform: uppercase;
                font-family: 'Segoe UI', system-ui, sans-serif;
                letter-spacing: 1px;

                &::placeholder {
                    color: var(--text-color);
                    opacity: 0.5;
                    text-transform: none;
                }
            }
        }
    }
}

.shortcut-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;

    .setting-label {
        min-width: 60px;
    }

    :deep(.el-input) {
        flex: 1;

        .el-input__wrapper {
            background-color: transparent;
            border-color: var(--border-color);
            transition: all 0.2s ease;

            &:hover {
                border-color: var(--text-color);
            }

            &.is-focus {
                border-color: var(--text-color);
                box-shadow: 0 0 0 1px var(--text-color);
            }
        }

        .el-input__inner {
            height: 38px;
            color: var(--text-color);
            font-size: 14px;
            text-transform: uppercase;
            font-family: 'Segoe UI', system-ui, sans-serif;
            letter-spacing: 1px;

            &::placeholder {
                color: var(--text-color);
                opacity: 0.5;
                text-transform: none;
            }
        }
    }
}

// 动画
.settings-panel-enter-active,
.settings-panel-leave-active {
    transition: all 0.3s ease;

    .settings-panel {
        transition: all 0.3s ease;
    }
}

.settings-panel-enter-from,
.settings-panel-leave-to {
    opacity: 0;

    .settings-panel {
        transform: scale(0.95);
    }
}

.settings-panel-enter-to,
.settings-panel-leave-from {
    opacity: 1;

    .settings-panel {
        transform: scale(1);
    }
}
</style>