<template>
    <div class="lock-screen" v-if="isLocked">
        <div class="lock-content">
            <div class="lock-icon">
                <el-icon>
                    <Lock />
                </el-icon>
            </div>
            <h2>已锁定</h2>
            <div class="password-input">
                <el-input v-model="password" type="password" placeholder="请输入密码解锁" @keyup.enter="unlock" />
                <el-button class="unlock-button" circle @click="unlock">
                    <el-icon>
                        <Key />
                    </el-icon>
                </el-button>
            </div>
            <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Lock, Key } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useConfig } from '../store/config'

const { verifyPassword } = useConfig()

const isLocked = ref(false)
const password = ref('')
const errorMessage = ref('')

const lock = () => {
    isLocked.value = true
    password.value = ''
    errorMessage.value = ''
}

const unlock = () => {
    if (verifyPassword(password.value)) {
        isLocked.value = false
        password.value = ''
        errorMessage.value = ''
        ElMessage.success('解锁成功')
    } else {
        errorMessage.value = '密码错误'
        password.value = ''
    }
}

defineExpose({
    lock,
    isLocked
})
</script>

<style lang="scss" scoped>
.lock-screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-color);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: fadeIn 0.3s ease;
    backdrop-filter: blur(10px);
}

.lock-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 48px;
    border-radius: 16px;
    background: var(--dropdown-bg);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    min-width: 380px;
    border: 1px solid var(--border-color);

    .lock-icon {
        font-size: 48px;
        color: var(--text-color);
        opacity: 0.8;
        margin-bottom: 8px;
    }

    h2 {
        color: var(--text-color);
        margin: 0;
        font-size: 24px;
        font-weight: 500;
    }

    .password-input {
        width: 100%;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;

        :deep(.el-input) {
            width: 100%;

            .el-input__wrapper {
                background: transparent;
                border: none;
                box-shadow: none !important;
                padding: 0;
                border-radius: 0;
                border-bottom: 2px solid var(--border-color);
                transition: all 0.3s ease;

                &:hover,
                &.is-focus {
                    border-bottom-color: var(--text-color);
                }

                .el-input__inner {
                    height: 42px;
                    color: var(--text-color);
                    font-size: 16px;
                    padding: 0;
                    letter-spacing: 2px;

                    &::placeholder {
                        color: var(--text-color);
                        opacity: 0.5;
                    }
                }
            }
        }

        .unlock-button {
            font-size: 22px;
            width: 48px;
            height: 48px;
            color: var(--text-color);
            background: transparent;
            border: 2px solid var(--border-color);
            transition: all 0.3s ease;
            margin-top: 8px;

            &:hover {
                background: var(--text-color);
                border-color: var(--text-color);
                color: var(--bg-color);

                :deep(.el-icon) {
                    color: var(--bg-color);
                }
            }

            &:active {
                transform: scale(0.92);
            }

            :deep(.el-icon) {
                transition: all 0.3s ease;
            }
        }
    }

    .error-message {
        color: #f56c6c;
        font-size: 14px;
        margin-top: -8px;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.98);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>