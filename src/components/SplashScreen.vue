<template>
    <Transition name="fade">
        <div v-if="visible" class="splash-screen">
            <div class="splash-content">
                <div class="logo">
                    <el-icon class="logo-icon">
                        <Picture />
                    </el-icon>
                </div>
                <h1 class="title">Zi Explorer</h1>
                <div class="loading">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { Picture } from '@element-plus/icons-vue'

defineProps<{
    visible: boolean
}>()
</script>

<style lang="scss" scoped>
.splash-screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-color);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 99999;
}

.splash-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
}

.logo {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    background: var(--el-color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 2s infinite;

    .logo-icon {
        font-size: 40px;
        color: white;
    }
}

.title {
    font-size: 24px;
    font-weight: 500;
    color: var(--text-color);
    margin: 0;
}

.loading {
    display: flex;
    gap: 8px;
    margin-top: 8px;

    .dot {
        width: 8px;
        height: 8px;
        background: var(--el-color-primary);
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out both;

        &:nth-child(1) {
            animation-delay: -0.32s;
        }

        &:nth-child(2) {
            animation-delay: -0.16s;
        }
    }
}

@keyframes pulse {
    0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0.7);
    }

    70% {
        transform: scale(1);
        box-shadow: 0 0 0 16px rgba(var(--el-color-primary-rgb), 0);
    }

    100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0);
    }
}

@keyframes bounce {

    0%,
    80%,
    100% {
        transform: scale(0);
    }

    40% {
        transform: scale(1);
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>