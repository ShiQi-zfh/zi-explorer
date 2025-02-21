<template>
    <div class="folder-tree-item" :style="{ paddingLeft: level * 20 + 'px' }">
        <div class="folder-item" :class="{ 'active': isActive }" @click="handleClick"
            @contextmenu.prevent="handleContextMenu">
            <div class="folder-content">
                <el-icon class="expand-icon" @click.stop="toggleExpand">
                    <CaretRight v-if="hasChildren && !expanded" />
                    <CaretBottom v-if="hasChildren && expanded" />
                </el-icon>
                <el-icon>
                    <Folder />
                </el-icon>
                <span class="folder-name" ref="folderNameRef" v-tooltip="isTextTruncated ? folder.name : undefined">{{
                    folder.name }}</span>
            </div>
            <div class="folder-item-actions">
                <el-button type="danger" text size="small" @click.stop="$emit('remove', folder)" v-tooltip="'从列表中移除'">
                    <el-icon>
                        <Delete />
                    </el-icon>
                </el-button>
            </div>
        </div>
        <div v-if="expanded && hasChildren" class="subfolder-list">
            <FolderTreeItem v-for="subfolder in subfolders" :key="subfolder.path" :folder="subfolder" :level="level + 1"
                :current-path="currentPath" @select="$emit('select', $event)" @remove="$emit('remove', $event)" />
        </div>

        <!-- 右键菜单 -->
        <Teleport to="body">
            <div v-show="contextMenuVisible" class="context-menu" :style="contextMenuStyle" @click.stop>
                <div class="menu-item" v-if="hasChildren" @click="handleExpandClick">
                    <el-icon>
                        <CaretBottom v-if="!expanded" />
                        <CaretTop v-else />
                    </el-icon>
                    <span>{{ expanded ? '折叠' : '展开' }}</span>
                </div>
                <div class="menu-divider" v-if="hasChildren"></div>
                <div class="menu-item" @click="handleCopyPath">
                    <el-icon>
                        <DocumentCopy />
                    </el-icon>
                    <span>复制路径</span>
                </div>
                <div class="menu-item" @click="handleOpenFolder">
                    <el-icon>
                        <FolderOpened />
                    </el-icon>
                    <span>打开文件夹</span>
                </div>
                <div class="menu-divider"></div>
                <div class="menu-item" @click="handleRemoveClick">
                    <el-icon>
                        <Delete />
                    </el-icon>
                    <span>从列表中移除</span>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, inject } from 'vue'
import { Folder, Delete, CaretRight, CaretBottom, CaretTop, DocumentCopy, FolderOpened } from '@element-plus/icons-vue'
import { FolderInfo } from '../types'
import { MENU_KEY, type MenuState } from '../store/menuState'
import { ElMessage } from 'element-plus'

const props = defineProps<{
    folder: FolderInfo
    level: number
    currentPath: string | undefined
}>()

const emit = defineEmits<{
    select: [folder: FolderInfo]
    remove: [folder: FolderInfo]
}>()

const expanded = ref(false)
const subfolders = ref<FolderInfo[]>([])
const menuId = Symbol('menuId')
const contextMenuPosition = ref({ x: 0, y: 0 })
const folderNameRef = ref<HTMLElement | null>(null)

// 注入全局菜单状态
const menuState = inject<MenuState>(MENU_KEY)
if (!menuState) {
    throw new Error('Menu state not provided')
}

const isActive = computed(() => props.currentPath?.startsWith(props.folder.path) || false)
const hasChildren = computed(() => props.folder.children && props.folder.children.length > 0)
const contextMenuVisible = computed(() => menuState.activeMenu.value === menuId)

const contextMenuStyle = computed(() => ({
    left: contextMenuPosition.value.x + 'px',
    top: contextMenuPosition.value.y + 'px'
}))

// 检查文本是否被截断
const isTextTruncated = computed(() => {
    if (!folderNameRef.value) return false
    return folderNameRef.value.scrollWidth > folderNameRef.value.clientWidth
})

const handleClick = () => {
    emit('select', props.folder)
}

const toggleExpand = () => {
    if (hasChildren.value) {
        expanded.value = !expanded.value
    }
}

const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    contextMenuPosition.value = { x: e.clientX, y: e.clientY }
    menuState.activeMenu.value = menuId
}

const handleExpandClick = () => {
    toggleExpand()
    menuState.activeMenu.value = null
}

const handleCopyPath = () => {
    navigator.clipboard.writeText(props.folder.path)
        .then(() => {
            ElMessage.success('路径已复制到剪贴板')
            menuState.activeMenu.value = null
        })
        .catch(() => {
            ElMessage.error('复制失败')
        })
}

const handleOpenFolder = () => {
    window.ipcRenderer.invoke('open-folder', props.folder.path)
        .then(() => {
            menuState.activeMenu.value = null
        })
        .catch(() => {
            ElMessage.error('打开文件夹失败')
        })
}

const handleRemoveClick = () => {
    emit('remove', props.folder)
    menuState.activeMenu.value = null
}

const handleClickOutside = (_: MouseEvent) => {
    if (menuState.activeMenu.value === menuId) {
        menuState.activeMenu.value = null
    }
}

watch(() => props.folder.children, (newChildren) => {
    if (newChildren) {
        subfolders.value = newChildren
    }
}, { immediate: true })

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    if (menuState.activeMenu.value === menuId) {
        menuState.activeMenu.value = null
    }
})
</script>

<style lang="scss" scoped>
.folder-tree-item {
    display: flex;
    flex-direction: column;
    user-select: none;
    margin-bottom: 2px;

    &:last-child {
        margin-bottom: 0;
    }
}

.folder-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    color: var(--text-color);
    transition: all 0.2s ease;

    &:hover {
        background-color: var(--hover-bg);

        .folder-item-actions {
            opacity: 1;
        }
    }

    &.active {
        background-color: var(--active-bg);
    }

    .folder-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;
    }

    .expand-icon {
        width: 16px;
        height: 16px;
        cursor: pointer;
        transition: transform 0.2s ease;

        &:hover {
            color: var(--el-color-primary);
        }
    }

    .folder-name {
        flex: 1;
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .folder-item-actions {
        opacity: 0;
        transition: opacity 0.2s ease;
    }
}

.subfolder-list {
    display: flex;
    flex-direction: column;
    margin-top: 2px;
}

.context-menu {
    position: fixed;
    z-index: 9999;
    background: var(--dropdown-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    padding: 4px 0;
    min-width: 160px;

    .menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        font-size: 13px;
        color: var(--text-color);
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
            background-color: var(--hover-bg);
        }

        .el-icon {
            font-size: 16px;
        }
    }

    .menu-divider {
        height: 1px;
        background-color: var(--border-color);
        margin: 4px 0;
    }
}
</style>