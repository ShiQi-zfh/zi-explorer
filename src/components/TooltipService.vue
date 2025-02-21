<template>
    <Teleport to="body">
        <Transition name="tooltip">
            <div v-if="visible" class="tooltip" :style="tooltipStyle" :class="placement">{{ text }}</div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

interface Position {
    left: string
    top: string
}

interface TooltipOptions {
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'bottom-start' | 'bottom-end'
    offset?: [number, number]
}

const visible = ref(false)
const text = ref('')
const position = reactive<Position>({
    left: '0px',
    top: '0px'
})
const placement = ref<string>('bottom')
const offset = reactive<[number, number]>([0, 8])

const tooltipStyle = computed(() => {
    const style: Record<string, string> = { ...position }
    return style
})

// 显示 tooltip
const show = (newText: string, target: HTMLElement, options: TooltipOptions = {}) => {
    text.value = newText
    placement.value = options.placement || 'bottom'
    offset[0] = options.offset?.[0] ?? 0
    offset[1] = options.offset?.[1] ?? 8

    // 获取目标元素的位置和尺寸
    const rect = target.getBoundingClientRect()

    // 根据不同的位置计算 tooltip 的位置
    switch (placement.value) {
        case 'bottom':
            position.left = `${rect.left + rect.width / 2}px`
            position.top = `${rect.bottom + offset[1]}px`
            break
        case 'bottom-start':
            position.left = `${rect.left + offset[0]}px`
            position.top = `${rect.bottom + offset[1]}px`
            break
        case 'bottom-end':
            position.left = `${rect.right - offset[0]}px`
            position.top = `${rect.bottom + offset[1]}px`
            break
        case 'top':
            position.left = `${rect.left + rect.width / 2}px`
            position.top = `${rect.top - offset[1]}px`
            break
        case 'left':
            position.left = `${rect.left - offset[0]}px`
            position.top = `${rect.top + rect.height / 2}px`
            break
        case 'right':
            position.left = `${rect.right + offset[0]}px`
            position.top = `${rect.top + rect.height / 2}px`
            break
        default:
            position.left = `${rect.left + rect.width / 2}px`
            position.top = `${rect.bottom + offset[1]}px`
    }

    visible.value = true
}

// 隐藏 tooltip
const hide = () => {
    visible.value = false
}

// 导出方法供外部使用
defineExpose({
    show,
    hide
})
</script>

<style lang="scss" scoped>
.tooltip {
    position: fixed;
    z-index: 9999;
    padding: 4px 8px;
    font-size: 12px;
    line-height: 1.2;
    white-space: nowrap;
    color: var(--text-color);
    background: var(--dropdown-bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    pointer-events: none;

    &.bottom {
        transform: translateX(-50%);
    }

    &.bottom-end {
        transform: translateX(-100%);
    }

    &.top {
        transform: translateX(-50%) translateY(-100%);
    }

    &.left {
        transform: translateX(-100%) translateY(-50%);
    }

    &.right {
        transform: translateY(-50%);
    }
}

.tooltip-enter-active,
.tooltip-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-enter-from,
.tooltip-leave-to {
    opacity: 0;
}

.tooltip-enter-to,
.tooltip-leave-from {
    opacity: 1;
}
</style>