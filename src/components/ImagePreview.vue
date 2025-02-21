<template>
    <div v-show="visible" class="viewer-container" ref="viewerContainer">
        <div class="images-wrapper">
            <img v-for="file in imageFiles" :key="file.path" :src="formatPath(file.path)" :alt="file.name"
                :data-original="formatPath(file.path)" ref="previewImages" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import type { FileInfo } from '../types'
import 'viewerjs/dist/viewer.css'
import Viewer from 'viewerjs'

const props = defineProps<{
    modelValue: boolean
    path: string
    title: string
    files?: FileInfo[]
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

const visible = ref(props.modelValue)
const viewerContainer = ref<HTMLElement | null>(null)
const previewImages = ref<HTMLImageElement[]>([])
let viewer: Viewer | null = null

// 格式化文件路径
const formatPath = (path: string) => {
    return `file:///${path.replace(/\\/g, '/')}`
}

// 过滤出图片文件
const imageFiles = computed(() => {
    if (!props.files) return []
    return props.files.filter(file => {
        const ext = file.name.toLowerCase()
        return ext.endsWith('.jpg') || ext.endsWith('.jpeg') ||
            ext.endsWith('.png') || ext.endsWith('.gif') ||
            ext.endsWith('.bmp') || ext.endsWith('.webp')
    })
})

// 初始化查看器
const initViewer = () => {
    if (!viewerContainer.value) return

    // 销毁旧的查看器
    if (viewer) {
        viewer.destroy()
    }

    // 创建新的查看器
    viewer = new Viewer(viewerContainer.value, {
        inline: false,
        title: false,
        toolbar: {
            zoomIn: true,
            zoomOut: true,
            oneToOne: true,
            reset: true,
            prev: true,
            next: true,
            rotateLeft: true,
            rotateRight: true,
        },
        transition: false,
        hidden: () => {
            emit('update:modelValue', false)
        },
        view(_) {
            if (viewer) {
                viewer.zoomTo(1)
            }
        },
        // 添加鼠标按钮导航
        button: true,
        navbar: true, // 启用底部导航栏，它包含了内置的计数器
        keyboard: true,
        movable: true,
        rotatable: true,
        scalable: true,
        slideOnTouch: true,
        toggleOnDblclick: true,
        tooltip: true,
        zoomOnWheel: true,
        zoomRatio: 0.1,
    })

    // 添加鼠标前进后退键监听
    window.addEventListener('mouseup', handleMouseNavigation)
}

// 处理鼠标导航
const handleMouseNavigation = (e: MouseEvent) => {
    if (!viewer || !visible.value) return

    // 鼠标前进键 (通常是第4键)
    if (e.button === 3) {
        viewer.prev()
    }
    // 鼠标后退键 (通常是第3键)
    else if (e.button === 4) {
        viewer.next()
    }
}

// 监听 modelValue 变化
watch(() => props.modelValue, (val) => {
    visible.value = val
    if (val) {
        // 确保 DOM 更新后再初始化和显示查看器
        nextTick(() => {
            initViewer()
            if (viewer) {
                viewer.show()
            }
        })
    } else {
        if (viewer) {
            viewer.hide()
        }
    }
})

onMounted(() => {
    nextTick(() => {
        initViewer()
    })
})

onUnmounted(() => {
    if (viewer) {
        viewer.destroy()
    }
    // 移除鼠标事件监听
    window.removeEventListener('mouseup', handleMouseNavigation)
})
</script>

<style lang="scss" scoped>
.viewer-container {
    display: none;
}

.images-wrapper {
    display: none;
}

:deep(.viewer-toolbar > ul > li) {
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    margin: 0 2px;

    &:hover {
        background-color: rgba(0, 0, 0, 0.8);
    }
}

:deep(.viewer-navbar) {
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
}
</style>