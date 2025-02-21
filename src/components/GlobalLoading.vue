<template>
    <Transition name="fade">
        <div v-if="visible" class="global-loading">
            <div class="loading-content" v-loading="true" element-loading-background="transparent">
                <span class="loading-text">{{ text || '加载中...' }}</span>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
defineProps<{
    visible: boolean
    text?: string
}>()
</script>

<style lang="scss" scoped>
.global-loading {
    position: fixed;
    top: 36px; // 标题栏高度
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-color);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9998;
    backdrop-filter: blur(4px);
}

.loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    min-height: 120px;
    min-width: 120px;

    :deep(.el-loading-spinner) {
        .circular {
            width: 48px;
            height: 48px;
        }

        .el-loading-text {
            color: var(--text-color);
            font-size: 14px;
            margin-top: 16px;
        }
    }
}

.loading-text {
    font-size: 14px;
    color: var(--text-color);
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