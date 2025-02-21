<template>
    <div class="home">
        <div class="main-content">
            <div class="folder-list">
                <div class="folder-list-header">
                    <span>文件夹</span>
                    <div class="folder-actions">
                        <el-button type="primary" text size="small" @click="handleAddFolder" v-tooltip="'添加文件夹'">
                            <el-icon>
                                <FolderAdd />
                            </el-icon>
                        </el-button>
                    </div>
                </div>
                <div class="folder-list-content">
                    <template v-if="folders.length > 0">
                        <draggable v-model="folders" item-key="path" @end="handleDragEnd" :animation="200">
                            <template #item="{ element }">
                                <FolderTreeItem :folder="convertToTreeFolder(element)" :level="0"
                                    :current-path="currentFolder?.path" @select="handleFolderSelect"
                                    @remove="handleFolderRemove" />
                            </template>
                        </draggable>
                    </template>
                    <div v-else class="empty-folder-list">
                        <el-empty description="暂无文件夹" />
                    </div>
                </div>
            </div>
            <div class="content">
                <!-- 添加面包屑导航 -->
                <div class="breadcrumb">
                    <template v-if="currentFolder">
                        <div class="breadcrumb-item root"
                            @click="handleBreadcrumbClick(getRootFolder(currentFolder)?.path || '')">
                            <el-icon>
                                <FolderOpened />
                            </el-icon>
                            <span>{{ getRootFolder(currentFolder)?.name }}</span>
                        </div>
                        <template v-for="(item, index) in breadcrumbItems" :key="item.path">
                            <div class="breadcrumb-separator" v-if="index > 0">
                                <el-icon>
                                    <ArrowRight />
                                </el-icon>
                            </div>
                            <div class="breadcrumb-item" v-if="index > 0" @click="handleBreadcrumbClick(item.path)">
                                <el-icon>
                                    <Folder v-if="index < breadcrumbItems.length - 1" />
                                    <FolderOpened v-else />
                                </el-icon>
                                <span>{{ item.name }}</span>
                            </div>
                        </template>
                    </template>
                </div>

                <div class="content-header">
                    <div class="header-left">
                        <!-- 返回按钮 -->
                        <div class="control-button" v-if="!isRootFolder" @click="handleGoBack">
                            <el-icon>
                                <Back />
                            </el-icon>
                        </div>
                    </div>
                    <div class="view-controls">
                        <div class="control-buttons">
                            <!-- 刷新按钮 -->
                            <div class="control-button" @click="handleRefreshCurrent" v-tooltip="{
                                content: '刷新当前目录',
                                placement: 'bottom'
                            }">
                                <el-icon :class="{ 'is-refreshing': loading }">
                                    <Refresh />
                                </el-icon>
                            </div>
                            <!-- 时间排序按钮 -->
                            <div class="control-button"
                                :class="{ active: sortType === 'time-asc' || sortType === 'time-desc' }"
                                @click="toggleSort('time')" v-tooltip="{
                                    content: sortType === 'time-asc' ? '按时间降序' : '按时间升序',
                                    placement: 'bottom'
                                }">
                                <el-icon>
                                    <Timer />
                                    <CaretTop v-if="sortType === 'time-asc'" class="sort-icon" />
                                    <CaretBottom v-if="sortType === 'time-desc'" class="sort-icon" />
                                </el-icon>
                            </div>
                            <!-- 名称排序按钮 -->
                            <div class="control-button"
                                :class="{ active: sortType === 'name-asc' || sortType === 'name-desc' }"
                                @click="toggleSort('name')" v-tooltip="{
                                    content: sortType === 'name-asc' ? '按名称降序' : '按名称升序',
                                    placement: 'bottom'
                                }">
                                <el-icon>
                                    <Sort />
                                    <CaretTop v-if="sortType === 'name-asc'" class="sort-icon" />
                                    <CaretBottom v-if="sortType === 'name-desc'" class="sort-icon" />
                                </el-icon>
                            </div>
                            <!-- 视图切换按钮 -->
                            <div class="control-button" :class="{ active: viewMode === 'grid' }"
                                @click="viewMode = viewMode === 'list' ? 'grid' : 'list'" v-tooltip="{
                                    content: viewMode === 'list' ? '切换到网格视图' : '切换到列表视图',
                                    placement: 'bottom-end',
                                    offset: [-16, 8]
                                }">
                                <el-icon>
                                    <Grid v-if="viewMode === 'list'" />
                                    <List v-else />
                                </el-icon>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 列表视图 -->
                <el-table v-if="currentFolder && viewMode === 'list'" v-loading="loading" :data="paginatedContents"
                    style="width: 100%" element-loading-text="正在加载..."
                    :header-cell-style="{ background: 'var(--bg-color)', color: 'var(--text-color)' }"
                    :row-style="{ cursor: 'pointer' }" :hover-row="true" @row-dblclick="handleRowDblClick">
                    <el-table-column label="名称" min-width="200">
                        <template #default="{ row }">
                            <div class="file-name">
                                <el-icon>
                                    <Folder v-if="row.isDirectory" />
                                    <component v-else-if="typeof getDocumentIcon(row.name) === 'object'"
                                        :is="getDocumentIcon(row.name)" />
                                    <component v-else :is="getDocumentIcon(row.name)" />
                                </el-icon>
                                <span>{{ row.name }}</span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="size" label="大小" width="120">
                        <template #default="{ row }">
                            {{ row.isDirectory ? '-' : formatFileSize(row.size) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="modifiedTime" label="修改时间" width="180">
                        <template #default="{ row }">
                            {{ formatDate(row.modifiedTime) }}
                        </template>
                    </el-table-column>
                </el-table>

                <!-- 网格视图 -->
                <div v-else-if="currentFolder && viewMode === 'grid'" class="grid-view" v-loading="loading"
                    element-loading-text="正在加载...">
                    <div class="grid-container">
                        <div v-for="item in paginatedContents" :key="item.path" class="grid-item"
                            @dblclick="handleRowDblClick(item)">
                            <div class="grid-content" v-tooltip="item.name">
                                <div class="grid-icon" v-if="!isImageFile(item.name)">
                                    <el-icon>
                                        <Folder v-if="item.isDirectory" />
                                        <component v-else-if="typeof getDocumentIcon(item.name) === 'object'"
                                            :is="getDocumentIcon(item.name)" />
                                        <component v-else :is="getDocumentIcon(item.name)" />
                                    </el-icon>
                                </div>
                                <div class="grid-thumbnail" v-else>
                                    <img :src="`file:///${item.path.replace(/\\/g, '/')}`" :alt="item.name">
                                </div>
                                <div class="grid-name">{{ item.name }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="empty-content">
                    <el-empty description="请选择文件夹" />
                </div>
            </div>
        </div>
        <SettingsPanel ref="settingsPanelRef" />
        <GlobalLoading :visible="globalLoading" :text="loadingText" />
        <ImagePreview v-model="imagePreview" :path="previewImage?.path || ''" :title="previewImage?.name || ''"
            :files="imageFiles" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, defineComponent, h, provide } from 'vue'
import { Folder, FolderAdd, Timer, Grid, List, CaretTop, CaretBottom, Sort, Back, FolderOpened, ArrowRight, Refresh } from '@element-plus/icons-vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import GlobalLoading from '../components/GlobalLoading.vue'
import { ElMessage } from 'element-plus'
import { useConfig } from '../store/config'
import { formatFileSize, formatDate } from '../utils/format'
import { eventBus } from '../utils/eventBus'
import FolderTreeItem from '../components/FolderTreeItem.vue'
import { FileInfo, FolderInfo as TreeFolderInfo } from '../types'
import ImagePreview from '../components/ImagePreview.vue'
import draggable from 'vuedraggable'

interface FolderInfo {
    name: string
    path: string
}

// 定义自定义图标组件
const WordIcon = defineComponent({
    name: 'WordIcon',
    render() {
        return h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '32',
            height: '32',
            viewBox: '0 0 24 24',
            style: 'width: 1em; height: 1em;'
        }, [
            h('path', {
                fill: 'currentColor',
                d: 'M17 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4zM2.859 2.877l12.57-1.795a.5.5 0 0 1 .571.494v20.848a.5.5 0 0 1-.57.494L2.858 21.123a1 1 0 0 1-.859-.99V3.867a1 1 0 0 1 .859-.99M11 8v4.989L9 11l-1.99 2L7 8H5v8h2l2-2l2 2h2V8z'
            })
        ])
    }
})

const ExcelIcon = defineComponent({
    name: 'ExcelIcon',
    render() {
        return h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '32',
            height: '32',
            viewBox: '0 0 24 24',
            style: 'width: 1em; height: 1em;'
        }, [
            h('path', {
                fill: 'currentColor',
                d: 'm2.859 2.877l12.57-1.795a.5.5 0 0 1 .571.494v20.848a.5.5 0 0 1-.57.494L2.858 21.123a1 1 0 0 1-.859-.99V3.867a1 1 0 0 1 .859-.99M17 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4zm-6.8 9L13 8h-2.4L9 10.286L7.4 8H5l2.8 4L5 16h2.4L9 13.714L10.6 16H13z'
            })
        ])
    }
})

const PowerPointIcon = defineComponent({
    name: 'PowerPointIcon',
    render() {
        return h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '32',
            height: '32',
            viewBox: '0 0 24 24',
            style: 'width: 1em; height: 1em;'
        }, [
            h('path', {
                fill: 'currentColor',
                d: 'M17 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4zM2.859 2.877l12.57-1.795a.5.5 0 0 1 .571.494v20.848a.5.5 0 0 1-.57.494L2.858 21.123a1 1 0 0 1-.859-.99V3.867a1 1 0 0 1 .859-.99M5 8v8h2v-2h6V8zm2 2h4v2H7z'
            })
        ])
    }
})

const DefaultFileIcon = defineComponent({
    name: 'DefaultFileIcon',
    render() {
        return h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '32',
            height: '32',
            viewBox: '0 0 24 24',
            style: 'width: 1em; height: 1em;'
        }, [
            h('path', {
                fill: 'currentColor',
                d: 'M3 9h6a1 1 0 0 0 1-1V2h10.002c.551 0 .998.455.998.992v18.016a.993.993 0 0 1-.993.992H3.993A1 1 0 0 1 3 20.992zm0-2l5-4.997V7z'
            })
        ])
    }
})

const TxtIcon = defineComponent({
    name: 'TxtIcon',
    render() {
        return h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '32',
            height: '32',
            viewBox: '0 0 24 24',
            style: 'width: 1em; height: 1em;'
        }, [
            h('path', {
                fill: 'currentColor',
                d: 'M21 9v11.993A1 1 0 0 1 20.007 22H3.993A.993.993 0 0 1 3 21.008V2.992C3 2.455 3.447 2 3.998 2H14v6a1 1 0 0 0 1 1zm0-2h-5V2.003zM8 7v2h3V7zm0 4v2h8v-2zm0 4v2h8v-2z'
            })
        ])
    }
})

const MarkdownIcon = defineComponent({
    name: 'MarkdownIcon',
    render() {
        return h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '32',
            height: '32',
            viewBox: '0 0 24 24',
            style: 'width: 1em; height: 1em;'
        }, [
            h('path', {
                fill: 'currentColor',
                d: 'M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1m4 12.5v-4l2 2l2-2v4h2v-7h-2l-2 2l-2-2H5v7zm11-3v-4h-2v4h-2l3 3l3-3z'
            })
        ])
    }
})

const PdfIcon = defineComponent({
    name: 'PdfIcon',
    render() {
        return h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '32',
            height: '32',
            viewBox: '0 0 24 24',
            style: 'width: 1em; height: 1em;'
        }, [
            h('path', {
                fill: 'currentColor',
                d: 'M3.999 2A.995.995 0 0 0 3 2.992v18.016a1 1 0 0 0 .993.992h16.014A1 1 0 0 0 21 20.992V7l-5-5zM10.5 7.5h2c0 2.49 2.144 5.16 4.816 6.051l-.457 1.939c-3.136-.448-6.377.89-9.304 2.842l-1.18-1.613c1.086-.869 2.128-2.343 2.9-4.066c.77-1.716 1.225-3.576 1.225-5.153m.6 5.972c.267-.597.504-1.216.704-1.843a9.66 9.66 0 0 0 1.706 1.966c-.982.176-1.943.465-2.875.833c.165-.314.32-.633.465-.956'
            })
        ])
    }
})

const ImageIcon = defineComponent({
    name: 'ImageIcon',
    render() {
        return h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '32',
            height: '32',
            viewBox: '0 0 24 24',
            style: 'width: 1em; height: 1em;'
        }, [
            h('path', {
                fill: 'currentColor',
                d: 'm5 11.1l2-2l5.5 5.5l3.5-3.5l3 3V5H5zM4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1m11.5 7a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3'
            })
        ])
    }
})

const settingsPanelRef = ref()
const { config, updateConfig } = useConfig()
const folders = ref<FolderInfo[]>(config.value.folders || [])
const currentFolder = ref<FolderInfo | null>(null)
const folderContents = ref<FileInfo[]>([])
const loading = ref(false)
const globalLoading = ref(false)
const loadingText = ref('')
const folderTree = ref<TreeFolderInfo[]>([])
const imagePreview = ref(false)
const previewImage = ref<FileInfo | null>(null)
const viewMode = ref<'list' | 'grid'>('list')
const sortType = ref<'name-asc' | 'name-desc' | 'time-asc' | 'time-desc'>('name-asc')

// 记录文件夹历史
const folderHistory = ref<FolderInfo[]>([])

// 添加分页相关的状态
const pageSize = ref(100)
const currentPage = ref(1)

// 分页后的数据
const paginatedContents = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return sortedFolderContents.value.slice(start, end)
})

// 监听滚动事件的处理函数
const handleScroll = (e: Event) => {
    const target = e.target as HTMLElement
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
        // 当滚动到距离底部100px时，加载更多数据
        if (currentPage.value * pageSize.value < sortedFolderContents.value.length) {
            currentPage.value++
        }
    }
}

// 重置分页
const resetPagination = () => {
    currentPage.value = 1
}

// 监听文件夹变化时重置分页
watch(() => currentFolder.value, () => {
    resetPagination()
})

// 判断是否为根目录
const isRootFolder = computed(() => {
    if (!currentFolder.value) return true
    return folders.value.some(f => f.path === currentFolder.value?.path)
})

// 返回上一级文件夹
const handleGoBack = () => {
    if (folderHistory.value.length > 0) {
        const previousFolder = folderHistory.value.pop()
        if (previousFolder) {
            handleSelectFolder(previousFolder, false)
        }
    }
}

// 修改 handleSelectFolder 函数，添加记录历史参数
const handleSelectFolder = async (folder: FolderInfo, recordHistory: boolean = true) => {
    if (recordHistory && currentFolder.value) {
        folderHistory.value.push(currentFolder.value)
    }
    currentFolder.value = folder
    await loadFolderContents(folder.path)
}

const loadFolderContents = async (folderPath: string, showLoading: boolean = false) => {
    try {
        if (showLoading) {
            loading.value = true
        }
        const result = await window.ipcRenderer.invoke('read-folder', folderPath)
        if (result.success) {
            folderContents.value = result.contents
        } else {
            ElMessage.error('读取文件夹内容失败')
        }
    } catch (error) {
        console.error('读取文件夹内容失败:', error)
        ElMessage.error('读取文件夹内容失败')
    } finally {
        if (showLoading) {
            loading.value = false
        }
    }
}

// 排序函数
const sortedFolderContents = computed(() => {
    const contents = [...folderContents.value]

    switch (sortType.value) {
        case 'time-asc':
            contents.sort((a, b) => {
                const timeA = new Date(a.modifiedTime).getTime()
                const timeB = new Date(b.modifiedTime).getTime()
                return timeA - timeB
            })
            break
        case 'time-desc':
            contents.sort((a, b) => {
                const timeA = new Date(a.modifiedTime).getTime()
                const timeB = new Date(b.modifiedTime).getTime()
                return timeB - timeA
            })
            break
        case 'name-desc':
            contents.sort((a, b) => {
                // 文件夹优先
                if (a.isDirectory && !b.isDirectory) return -1
                if (!a.isDirectory && b.isDirectory) return 1
                // 然后按名称降序排序
                return b.name.localeCompare(a.name)
            })
            break
        default: // name-asc
            contents.sort((a, b) => {
                // 文件夹优先
                if (a.isDirectory && !b.isDirectory) return -1
                if (!a.isDirectory && b.isDirectory) return 1
                // 然后按名称升序排序
                return a.name.localeCompare(b.name)
            })
    }

    return contents
})

// 切换排序方式
const toggleSort = (type: 'name' | 'time') => {
    if (type === 'time') {
        sortType.value = sortType.value === 'time-asc' ? 'time-desc' : 'time-asc'
    } else {
        sortType.value = sortType.value === 'name-asc' ? 'name-desc' : 'name-asc'
    }
}

const handleAddFolder = async () => {
    try {
        const result = await window.ipcRenderer.invoke('select-folder')
        if (result.success) {
            const newFolder = {
                name: result.path.split(/[/\\]/).pop() || '未命名文件夹',
                path: result.path
            }

            // 检查是否已存在
            if (folders.value.some(f => f.path === newFolder.path)) {
                ElMessage.warning('该文件夹已添加')
                return
            }

            folders.value.push(newFolder)
            // 保存到配置
            await updateConfig({ folders: folders.value })
            ElMessage.success('添加文件夹成功')

            // 自动选中新添加的文件夹
            handleSelectFolder(newFolder)
        }
    } catch (error) {
        console.error('添加文件夹失败:', error)
        ElMessage.error('添加文件夹失败')
    }
}

const handleRemoveFolder = async (folder: FolderInfo) => {
    const index = folders.value.findIndex(f => f.path === folder.path)
    if (index !== -1) {
        folders.value.splice(index, 1)
        if (currentFolder.value?.path === folder.path) {
            currentFolder.value = null
            folderContents.value = []
        }
        // 保存到配置
        await updateConfig({ folders: folders.value })
        ElMessage.success('移除文件夹成功')
    }
}

const handleRefresh = async () => {
    if (!currentFolder.value) {
        ElMessage.warning('请先选择文件夹')
        return
    }

    try {
        globalLoading.value = true
        loadingText.value = '正在刷新...'
        // 确保 loading 效果至少显示 1.5 秒
        const loadingPromise = new Promise(resolve => setTimeout(resolve, 1500))
        const refreshPromise = loadFolderContents(currentFolder.value.path, false)

        await Promise.all([loadingPromise, refreshPromise])
    } catch (error) {
        console.error('刷新失败:', error)
        ElMessage.error('刷新失败')
    } finally {
        globalLoading.value = false
    }
}

const handleFolderSelect = (folder: FolderInfo) => {
    handleSelectFolder(folder)
}

const handleFolderRemove = (folder: FolderInfo) => {
    handleRemoveFolder(folder)
}

const buildFolderTree = (files: FileInfo[]) => {
    const tree: TreeFolderInfo[] = []
    const map = new Map<string, TreeFolderInfo>()

    files.forEach(file => {
        if (file.isDirectory) {
            const folder: TreeFolderInfo = {
                name: file.name,
                path: file.path,
                children: []
            }
            map.set(file.path, folder)

            const parentPath = file.path.substring(0, file.path.lastIndexOf('\\'))
            const parent = map.get(parentPath)

            if (parent) {
                parent.children?.push(folder)
            } else {
                tree.push(folder)
            }
        }
    })

    return tree
}

watch(folderContents, (newFiles) => {
    if (newFiles) {
        folderTree.value = buildFolderTree(newFiles)
    }
}, { immediate: true })

const convertToTreeFolder = (folder: FolderInfo): TreeFolderInfo => {
    return {
        name: folder.name,
        path: folder.path,
        children: []
    }
}

onMounted(async () => {
    // 加载配置
    const result = await window.ipcRenderer.invoke('load-config')
    if (result.success && result.data.folders) {
        folders.value = result.data.folders
        // 如果有文件夹，自动选中第一个
        if (folders.value.length > 0) {
            handleSelectFolder(folders.value[0])
        }
    }

    // 监听刷新事件
    eventBus.on('refresh-folder', handleRefresh)

    // 监听返回根目录事件
    eventBus.on('return-root', () => {
        // 清空历史记录
        folderHistory.value = []
        // 如果有文件夹，选择第一个根文件夹
        if (folders.value.length > 0) {
            handleSelectFolder(folders.value[0], false)
        }
    })

    // 监听导入文件夹事件
    window.ipcRenderer.on('execute-add-folder', () => {
        handleAddFolder()
    })

    // 添加鼠标后退键监听
    window.addEventListener('mouseup', handleMouseBack)

    // 添加滚动事件监听
    const gridView = document.querySelector('.grid-view')
    if (gridView) {
        gridView.addEventListener('scroll', handleScroll)
    }
    const tableBody = document.querySelector('.el-table__body-wrapper')
    if (tableBody) {
        tableBody.addEventListener('scroll', handleScroll)
    }
})

onUnmounted(() => {
    // 移除事件监听
    eventBus.off('refresh-folder', handleRefresh)
    eventBus.off('return-root')
    // 移除 IPC 监听
    window.ipcRenderer.removeListener('execute-add-folder', handleAddFolder)
    // 移除鼠标后退键监听
    window.removeEventListener('mouseup', handleMouseBack)

    // 移除滚动事件监听
    const gridView = document.querySelector('.grid-view')
    if (gridView) {
        gridView.removeEventListener('scroll', handleScroll)
    }
    const tableBody = document.querySelector('.el-table__body-wrapper')
    if (tableBody) {
        tableBody.removeEventListener('scroll', handleScroll)
    }
})

// 处理鼠标后退
const handleMouseBack = (e: MouseEvent) => {
    // 如果正在预览图片，不处理后退事件
    if (imagePreview.value) return

    // 鼠标后退键 (通常是第3键)
    if (e.button === 3) {
        // 如果不是根目录，则返回上一层
        if (!isRootFolder.value) {
            handleGoBack()
        }
    }
}

// 检查是否是图片文件
const isImageFile = (filename: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext))
}

// 获取文档文件图标
const getDocumentIcon = (filename: string): string | typeof WordIcon | typeof ExcelIcon | typeof PowerPointIcon | typeof TxtIcon | typeof DefaultFileIcon | typeof ImageIcon | typeof MarkdownIcon | typeof PdfIcon => {
    const ext = filename.toLowerCase()
    if (isImageFile(filename)) return ImageIcon
    if (ext.endsWith('.pdf')) return PdfIcon
    if (ext.endsWith('.doc') || ext.endsWith('.docx')) return WordIcon
    if (ext.endsWith('.xls') || ext.endsWith('.xlsx') || ext.endsWith('.csv')) return ExcelIcon
    if (ext.endsWith('.ppt') || ext.endsWith('.pptx')) return PowerPointIcon
    if (ext.endsWith('.txt')) return TxtIcon
    if (ext.endsWith('.md')) return MarkdownIcon
    return DefaultFileIcon
}

// 处理双击事件
const handleRowDblClick = (row: FileInfo) => {
    if (row.isDirectory) {
        // 如果是文件夹，进入该文件夹
        handleSelectFolder({
            name: row.name,
            path: row.path
        }, true)
    } else if (isImageFile(row.name)) {
        // 如果是图片，打开预览
        previewImage.value = row
        imagePreview.value = true
    } else {
        // 打开文件
        window.ipcRenderer.invoke('open-folder', row.path)
            .catch(() => {
                ElMessage.error('打开文件失败')
            })
    }
}

const imageFiles = computed(() => {
    return folderContents.value.filter(file => isImageFile(file.name))
})

// 处理拖拽结束事件
const handleDragEnd = async () => {
    try {
        // 保存新的文件夹顺序到配置
        await updateConfig({ folders: folders.value })
        // ElMessage.success('文件夹排序已保存')
    } catch (error) {
        console.error('保存文件夹顺序失败:', error)
        ElMessage.error('保存文件夹顺序失败')
    }
}

// 计算面包屑导航项
const getRootFolder = (folder: FolderInfo | null): FolderInfo | null => {
    if (!folder) return null
    return folders.value.find(f => folder.path.startsWith(f.path)) || null
}

const breadcrumbItems = computed(() => {
    if (!currentFolder.value) return []
    const rootFolder = getRootFolder(currentFolder.value)
    if (!rootFolder) return []

    const relativePath = currentFolder.value.path.slice(rootFolder.path.length + 1)
    if (!relativePath) return [{ name: rootFolder.name, path: rootFolder.path }]

    const parts = relativePath.split('\\')
    const items: { name: string; path: string }[] = [{ name: rootFolder.name, path: rootFolder.path }]
    let currentPath = rootFolder.path

    for (const part of parts) {
        currentPath = `${currentPath}\\${part}`
        items.push({
            name: part,
            path: currentPath
        })
    }

    return items
})

// 处理面包屑点击
const handleBreadcrumbClick = (path: string) => {
    if (!path) {
        // 点击根目录，返回到根文件夹
        if (folders.value.length > 0) {
            handleSelectFolder(folders.value[0])
        }
        return
    }

    // 查找对应的文件夹
    const targetFolder = {
        name: path.split('\\').pop() || '',
        path: path
    }
    handleSelectFolder(targetFolder)
}

// 提供 handleAddFolder 方法给标题栏组件使用
provide('homeRef', {
    handleAddFolder
})

// 添加 handleRefreshCurrent 方法
const handleRefreshCurrent = async () => {
    if (!currentFolder.value) {
        ElMessage.warning('请先选择文件夹')
        return
    }

    try {
        loading.value = true
        // 创建一个 Promise，延迟 2.5 秒
        const loadingPromise = new Promise(resolve => setTimeout(resolve, 2500))
        // 执行实际的刷新操作
        const refreshPromise = loadFolderContents(currentFolder.value.path, true)

        // 等待两个 Promise 都完成
        await Promise.all([loadingPromise, refreshPromise])
    } catch (error) {
        console.error('刷新失败:', error)
        ElMessage.error('刷新失败')
    } finally {
        loading.value = false
    }
}
</script>

<style lang="scss" scoped>
$folder-list-width: 240px;

.home {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding-top: 36px; // 标题栏高度
    box-sizing: border-box;
}

.main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.folder-list {
    width: $folder-list-width;
    min-width: $folder-list-width;
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    background: var(--bg-color);

    .folder-list-header {
        height: 48px;
        padding: 0 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-color);
        font-size: 14px;
        font-weight: 500;

        .folder-actions {
            display: flex;
            gap: 4px;
        }
    }

    .folder-list-content {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        overflow: overlay;

        :deep(.sortable-ghost) {
            opacity: 0.5;
            background: var(--hover-bg);
            border: 2px dashed var(--el-color-primary);
            border-radius: 6px;
        }

        :deep(.sortable-drag) {
            opacity: 0.8;
            background: var(--bg-color);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            border-radius: 6px;
            transform: scale(1.02);
        }

        &::-webkit-scrollbar {
            width: 6px;
        }

        &::-webkit-scrollbar-thumb {
            border-radius: 3px;
            background-color: var(--el-scrollbar-bg-color);
        }

        &:hover::-webkit-scrollbar-thumb {
            background-color: var(--el-text-color-secondary);
        }

        .empty-folder-list {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-color);
            opacity: 0.6;
        }
    }
}

.content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 16px;
    box-sizing: border-box;
    user-select: none;
    position: relative;

    // 添加加载动画的自定义样式
    :deep(.el-loading-mask) {
        background-color: var(--bg-color);
        opacity: 0.9;

        .el-loading-spinner {
            .circular {
                width: 32px;
                height: 32px;
            }

            .el-loading-text {
                color: var(--text-color);
                font-size: 14px;
                margin-top: 8px;
            }
        }
    }

    // 修改表格和网格视图的加载区域样式
    .el-table,
    .grid-view {
        :deep(.el-loading-mask) {
            background-color: var(--bg-color);
            opacity: 0.9;
            backdrop-filter: blur(4px);
        }
    }

    .breadcrumb {
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--hover-bg);
        padding: 8px 12px;
        border-radius: 8px;

        .breadcrumb-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            color: var(--text-color);
            opacity: 0.8;
            border-radius: 6px;

            &:hover {
                opacity: 1;
                background: var(--active-bg);
            }

            &.root {
                color: var(--el-color-primary);
                opacity: 1;
            }

            .el-icon {
                font-size: 16px;
            }

            span {
                font-size: 13px;
            }
        }

        .breadcrumb-separator {
            color: var(--text-color);
            opacity: 0.4;
            display: flex;
            align-items: center;

            .el-icon {
                font-size: 14px;
            }
        }
    }

    .content-header {
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .header-left {
            display: flex;
            gap: 8px;

            .control-button {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                color: var(--text-color);
                opacity: 0.8;
                background: var(--hover-bg);

                &:hover {
                    opacity: 1;
                    background: var(--active-bg);
                }

                :deep(.el-icon) {
                    font-size: 18px;
                    color: var(--text-color);
                    transition: all 0.2s ease;
                }
            }
        }

        .view-controls {
            display: flex;
            gap: 8px;

            .control-buttons {
                display: flex;
                gap: 4px;
                padding: 4px;
                background: var(--hover-bg);
                border-radius: 8px;
            }

            .control-button {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                color: var(--text-color);
                opacity: 0.8;

                &:hover {
                    opacity: 1;
                    background: var(--active-bg);
                }

                &.active {
                    opacity: 1;
                    background: var(--el-color-primary);
                    color: white;

                    :deep(.el-icon) {
                        color: white;
                    }
                }

                :deep(.el-icon) {
                    font-size: 18px;
                    color: var(--text-color);
                    transition: all 0.2s ease;
                }

                .sort-icon {
                    position: absolute;
                    font-size: 12px;
                    bottom: 2px;
                    right: 2px;
                }
            }
        }
    }

    .grid-view {
        flex: 1;
        overflow: hidden;
        padding: 16px;
        position: relative;

        .grid-container {
            height: 100%;
            overflow: auto;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 16px;
            padding: 16px;
            box-sizing: border-box;

            &::-webkit-scrollbar {
                width: 6px;
            }

            &::-webkit-scrollbar-thumb {
                border-radius: 3px;
                background-color: var(--el-scrollbar-bg-color);
            }

            &:hover::-webkit-scrollbar-thumb {
                background-color: var(--el-text-color-secondary);
            }
        }
    }

    .grid-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        height: 160px;
        width: 100%;
        box-sizing: border-box;

        &:hover {
            background-color: var(--hover-bg);
        }

        .grid-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            width: 100%;
            height: 100%;
        }

        .grid-icon {
            font-size: 64px;
            color: var(--text-color);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 120px;

            :deep(.el-icon) {
                font-size: 64px;
            }
        }

        .grid-thumbnail {
            width: 100%;
            height: 120px;
            border-radius: 6px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--hover-bg);

            img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                background: var(--hover-bg);
            }
        }

        .grid-name {
            font-size: 13px;
            text-align: center;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: var(--text-color);
            padding: 0 8px;
            box-sizing: border-box;
        }
    }

    :deep(.el-table) {
        --el-table-border-color: var(--border-color);
        --el-table-border: 1px solid var(--border-color);
        --el-table-text-color: var(--text-color);
        --el-table-header-text-color: var(--text-color);
        --el-table-row-hover-bg-color: var(--hover-bg);
        --el-table-tr-bg-color: var(--bg-color);
        background: var(--bg-color);

        .el-table__body tr:hover>td {
            background-color: var(--hover-bg) !important;
        }

        .el-table__row {
            transition: background-color 0.2s ease;
        }

        .el-table__body-wrapper {
            &::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }

            &::-webkit-scrollbar-thumb {
                border-radius: 3px;
                background-color: var(--el-scrollbar-bg-color);
            }

            &:hover::-webkit-scrollbar-thumb {
                background-color: var(--el-text-color-secondary);
            }
        }

        .el-table__cell {
            background-color: var(--bg-color);
            border-bottom: 1px solid var(--border-color);
        }
    }

    .empty-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-color);
        opacity: 0.6;
    }

    .table-row {
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
            background-color: var(--hover-bg) !important;

            td {
                background-color: var(--hover-bg) !important;
            }
        }
    }
}

.logo-container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
}

.logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;

    &:hover {
        filter: drop-shadow(0 0 2em #646cffaa);
    }

    &.vue:hover {
        filter: drop-shadow(0 0 2em #42b883aa);
    }
}

.file-name {
    display: flex;
    align-items: center;
    gap: 8px;

    .el-icon {
        font-size: 16px;
    }
}

// 添加刷新动画样式
:deep(.el-icon) {
    &.is-refreshing {
        animation: rotate 1s linear infinite;
    }
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>