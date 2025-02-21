<template>
    <div class="custom-tooltip-trigger" @mouseenter="showTooltip" @mouseleave="hideTooltip">
        <slot></slot>
        <Transition name="tooltip">
            <div v-if="isVisible" class="custom-tooltip">
                {{ text }}
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
    text: string
}>()

const isVisible = ref(false)

const showTooltip = () => {
    isVisible.value = true
}

const hideTooltip = () => {
    isVisible.value = false
}
</script>

<style lang="scss" scoped>
.custom-tooltip-trigger {
    position: relative;
    display: inline-flex;
}

.custom-tooltip {
    position: absolute;
    z-index: 9999;
    padding: 6px 8px;
    font-size: 12px;
    line-height: 1.2;
    white-space: nowrap;
    color: var(--text-color);
    background: var(--dropdown-bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    pointer-events: none;

    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 8px;

    &::before {
        content: '';
        position: absolute;
        top: -4px;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
        width: 8px;
        height: 8px;
        background: var(--dropdown-bg);
        border-left: 1px solid var(--border-color);
        border-top: 1px solid var(--border-color);
    }
}

.tooltip-enter-active,
.tooltip-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-enter-from,
.tooltip-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-8px);
}

.tooltip-enter-to,
.tooltip-leave-from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}
</style>