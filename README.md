# Zi Explorer

一个基于 Electron + Vue 3 开发的现代化文件浏览器，支持多文件夹管理、图片预览、主题切换等功能。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Electron](https://img.shields.io/badge/electron-30.0.1-blue.svg)
![Vue](https://img.shields.io/badge/vue-3.4.21-green.svg)
![Element Plus](https://img.shields.io/badge/element--plus-2.5.6-blue.svg)

## ✨ 功能特性

- 📁 多文件夹管理

  - 支持添加多个根文件夹
  - 文件夹树形结构展示
  - 拖拽排序文件夹
  - 右键菜单快捷操作

- 🖼️ 图片预览

  - 支持主流图片格式（JPG、PNG、GIF、BMP、WEBP）
  - 缩放、旋转、全屏预览
  - 鼠标前进后退键快速切换图片
  - 底部导航栏和缩略图预览

- 🎨 主题切换

  - 内置深色/浅色主题
  - 平滑过渡动画
  - 主题配置持久化

- ⌨️ 快捷键支持

  - 自定义老板键（Boss Key）
  - 常用操作快捷键（Ctrl+O、Alt+F4 等）
  - 支持快捷键配置

- 🔒 安全特性

  - 应用锁定功能
  - 密码保护
  - 配置文件加密存储

- 🎯 其他功能
  - 文件列表/网格视图切换
  - 多种排序方式（名称、时间）
  - 面包屑导航
  - 文件大小/修改时间显示
  - 文件图标分类显示

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装步骤

1. 克隆项目

```bash
git clone https://github.com/yourusername/zi-explorer.git
cd zi-explorer
```

2. 安装依赖

```bash
npm install
```

3. 开发模式运行

```bash
npm run dev
```

4. 打包应用

```bash
npm run build
```

## 📖 使用说明

### 添加文件夹

1. 点击左侧文件夹列表顶部的"+"按钮
2. 选择要添加的文件夹
3. 文件夹将被添加到列表中

### 浏览文件

- 单击文件夹：进入文件夹
- 双击文件：打开文件
- 双击图片：进入预览模式
- 使用鼠标前进/后退键：在预览模式下切换图片

### 视图切换

- 点击右上角的视图切换按钮可在列表视图和网格视图之间切换
- 网格视图支持图片缩略图预览

### 排序功能

- 点击工具栏的排序按钮可按名称或时间排序
- 支持升序和降序切换

### 主题切换

- 点击右上角的主题切换按钮切换深色/浅色主题
- 主题设置会被保存

### 快捷键

- `Ctrl + O`: 添加文件夹
- `Alt + F4`: 退出应用
- `自定义老板键`: 快速锁定应用（默认为 Ctrl + Shift + L）

### 安全功能

- 点击右上角的锁定按钮可锁定应用
- 在设置中可修改解锁密码
- 默认密码：123456

## 🛠️ 技术栈

- Electron 30.0.1
- Vue 3.4.21
- TypeScript
- Element Plus 2.5.6
- Vite
- SCSS

## 📝 配置文件

配置文件位于用户数据目录下的 `config.json`，包含以下配置：

- 主题设置
- 文件夹列表
- 快捷键配置
- 密码设置

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request。在提交 PR 之前，请确保：

1. 更新了相关的文档
2. 添加了必要的测试
3. 通过了所有的测试
4. 代码风格符合项目规范

## 📄 开源协议

本项目基于 [MIT 协议](LICENSE) 开源，可自由使用、修改和分发。

## 🙏 致谢

- [Electron](https://www.electronjs.org/)
- [Vue.js](https://vuejs.org/)
- [Element Plus](https://element-plus.org/)
- [Viewer.js](https://fengyuanchen.github.io/viewerjs/)

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 Issue
- 发送邮件至：[laleiuyo@gmail.com]

## 🔄 更新日志

### v1.0.1

- 优化图片预览功能
- 添加鼠标导航支持
- 优化主题切换过渡效果
- 修复已知问题

### v1.0.0

- 首次发布
