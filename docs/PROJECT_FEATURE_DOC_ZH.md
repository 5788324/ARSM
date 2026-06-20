# ARSM 项目功能文档

日期：2026-06-20 | 最新提交：ee55c58 | Phase 4 已完成

> 定位：评审材料。供 Codex 审查使用，非唯一交接文档。交接见 docs/PROJECT_HANDOFF_ZH.md。

---

## 一、项目概览

ARSM — 私人音频图书馆。自动从 asmr.one 采集同人音声作品，本地私有化存储，Web 端播放管理。

| 项目 | 信息 |
|------|------|
| 仓库 | github.com/5788324/ARSM |
| 技术栈 | Next.js 16 + TypeScript + Prisma 5 + SQLite + NextAuth v5 + Tailwind 4 |
| 测试 | 43/43 通过 (7 个测试文件) |
| 构建 | 通过 |

---

## 二、已实现功能

### 2.1 核心采集链路

用户输入 RJ 编号，后台异步任务：inspect → download → import → metadata → 入库

| 模块 | 状态 |
|------|------|
| Provider 注册中心 + 接口 | 完成 |
| asmr.one Provider | 完成 |
| Runner 编排器 | 完成 |
| AcquisitionJob 模型 | 完成 |
| 统一 API /api/acquisition/jobs | 完成 |
| 采集后台页 /admin/acquisition | 完成 |

采集链路特性：流式下载、3 次重试 + 超时、一次点击全自动、目录白名单、groupByTop 合并、文件级进度条。

### 2.2 导入系统

共享 import service + 重复检测 (CJK 滑窗) + 子文件夹分组 (groupPath/groupLabel) + 字幕识别 (.vtt/.srt/.lrc/.txt/.pdf) + review 队列。

### 2.3 播放器

全局底部播放器、倍速 (0.75x-2x)、自动连续播放、曲目按分组展示。

### 2.4 元数据自动匹配

采集后自动从 asmr.one 补全：标题、发售日、社团、标签、声优。

### 2.5 页面清单

| 路由 | 功能 | 状态 |
|------|------|------|
| / | 首页 | 完成 |
| /works | 作品库 | 搜索框待修复 |
| /works/[id] | 详情 + 分组播放 + 字幕 | 完成 |
| /admin/acquisition | 采集任务 + 进度条 | 完成 |
| /admin/import | 手动导入 | 完成 |
| /admin/metadata | 元数据 | 完成 |

### 2.6 数据库

17 个模型 (SQLite)：User, Work, Track, TrackFile, Circle, VoiceActor, Tag, WorkTag, WorkVoiceActor, WorkSource, StorageRepository, ListeningHistory, Favorite, ImportJob, MetadataJob, AcquisitionJob, TrackSubtitle。

### 2.7 启动方式

双击 启动ARSM.bat，浏览器打开 localhost:3000，用户名 admin 密码 admin。

---

## 三、已知问题

| 优先级 | 问题 |
|--------|------|
| P1 | /works 搜索框无功能 |
| P1 | durationSec 除零风险 |
| P1 | metadata 页面 DLsite 选项无效 |
| P2 | 7 处英语 UI 残留 |

---

## 四、功能缺口（Phase 4 完成后）

| 优先级 | 功能 |
|--------|------|
| P2 | 修复搜索 |
| P2 | VA/社团点击筛选 |
| P2 | 评分系统 |
| P2 | 深色模式切换 |
| P3 | 播放列表管理 |
| P4 | AI 字幕翻译 |
| P4 | 多源接入 (dlsite/hvdb) |
