# ARSM 项目功能文档

日期：2026-06-20 | 最新提交：ee55c58 | Phase 4 已完成

> 定位：评审材料。供 Codex 审查使用，非唯一交接文档。交接见 docs/PROJECT_HANDOFF_ZH.md。

---

## 一、项目概览

ARSM — 私人音频图书馆。自动从 asmr.one 采集同人音声作品，本地私有化存储，Web 端播放管理。

| 项目 | 信息 |
|------|------|
| 仓库 | github.com/5788324/ARSM |
| 工作区 | G:\Hermes Agent\ARSM\ARSM |
| 技术栈 | Next.js 16 + TypeScript + Prisma 5 + SQLite + NextAuth v5 + Tailwind 4 |
| 测试 | 43/43 通过 (7 个测试文件) |
| 构建 | 通过 |
| TypeCheck | 通过 |

---

## 二、已实现功能

### 2.1 核心采集链路（Phase 1-4）

用户输入 RJ 编号，后台异步任务：inspect → download → import → metadata → 入库

| 模块 | 文件 | 状态 |
|------|------|------|
| Provider 注册中心 | src/lib/acquisition/registry.ts | 完成 |
| Provider 接口 | src/lib/acquisition/types.ts | 完成 |
| asmr.one Provider | src/lib/acquisition/providers/asmrone.ts | 完成 |
| Runner 编排器 | src/lib/acquisition/runner.ts | 完成 |
| AcquisitionJob 模型 | prisma/schema.prisma | 完成 |
| 统一 API | /api/acquisition/jobs | 完成 |
| 采集后台页 | /admin/acquisition | 完成 |

采集链路特性：

- 流式下载（不占内存）
- 3 次重试 + 超时
- 一次点击全自动（acquire → import → metadata）
- 下载目录白名单防越界
- groupByTop=true：一个 RJ 文件夹 = 一个作品
- 任务状态：pending → inspecting → downloading → importing → done/review/done_with_errors/failed
- 文件级进度条 + 实时轮询
- 错误详情持久化

### 2.2 导入系统

| 模块 | 文件 | 状态 |
|------|------|------|
| 共享导入服务 | src/lib/import/service.ts | 完成 |
| 导入 API | /api/import | 完成 |
| 重复检测 | CJK 滑窗 + workCode 匹配 | 完成 |
| 子文件夹分组 | groupPath/groupLabel/sortKey | 完成 |
| 字幕识别 | .vtt/.srt/.lrc/.txt/.pdf 自动落库 | 完成 |
| review 队列 | ImportJob.reviewPayload | 完成 |

### 2.3 播放器

| 功能 | 状态 |
|------|------|
| 全局底部播放器 | 完成 |
| 倍速播放 (0.75x-2x) | 完成 |
| 自动连续播放 | 完成 |
| 曲目按分组展示 | 完成 |

### 2.4 认证

登录：NextAuth v5 Credentials + bcryptjs。用户：admin / admin。Session：JWT，已固定 NEXTAUTH_SECRET。

### 2.5 页面清单

| 路由 | 功能 | 状态 |
|------|------|------|
| / | 首页（统计 + 续听） | 完成 |
| /login | 登录页 | 完成 |
| /works | 作品库 | 搜索框待修复 |
| /works/[id] | 作品详情 + 分组播放 + 字幕 | 完成 |
| /favorites | 收藏列表 | 完成 |
| /admin | 管理面板 | 完成 |
| /admin/acquisition | 采集任务 + 进度条 | 完成 |
| /admin/import | 手动导入 | 完成 |
| /admin/jobs | 任务状态 | 完成 |
| /admin/metadata | 元数据抓取 | 完成 |
| /admin/repositories | 仓库管理 | 完成 |
| /admin/duplicates | 重复审查 | 完成 |

### 2.6 元数据自动匹配

采集导入后自动从 asmr.one 补全：原标题、发售日期、社团、标签（自动创建+关联）、声优（自动创建+关联）、sourceSite、sourceUrl。

### 2.7 数据库（SQLite）

17 个模型：User, Work, Track, TrackFile, Circle, VoiceActor, Tag, WorkTag, WorkVoiceActor, WorkSource, StorageRepository, ListeningHistory, Favorite, ImportJob, MetadataJob, AcquisitionJob, TrackSubtitle。

### 2.8 启动方式

双击 启动ARSM.bat：自动 seed + 启动 dev server + 浏览器打开 localhost:3000。

---

## 三、已知问题

### P1

| # | 位置 | 问题 | 状态 |
|---|------|------|------|
| 1 | /works 搜索框 | input 无 onChange/onSubmit | 待修复 |
| 2 | page.tsx | durationSec 为 0 时除零 | 待修复 |
| 3 | metadata 页面 | DLsite 选项无对应 provider | 待修复 |

### P2 — 英语 UI 残留

| # | 页面 | 英语 | 应为 |
|---|------|------|------|
| 1 | /favorites | tracks | 首曲目 |
| 2 | /admin/import | Import failed | 导入失败 |
| 3 | /admin/metadata | Fetch failed | 获取失败 |
| 4 | /admin/metadata | Work Code | 作品编号 |
| 5 | /admin/metadata | Preview | 预览 |
| 6 | /admin/metadata | Title: | 标题 |

---

## 四、功能缺口（Phase 4 完成后剩余）

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P2 | 修复搜索 | /works 搜索框接 API |
| P2 | VA/社团点击筛选 | 点击声优名看该 VA 全部作品 |
| P2 | 评分系统 | 1-5 星 |
| P2 | 深色模式切换 | Tailwind dark: 已就绪 |
| P3 | 播放列表 | 队列管理 |
| P4 | AI 字幕翻译 | LLM API |
| P4 | 多源接入 | dlsite / hvdb |

---

## 五、架构文档

| 文件 | 内容 |
|------|------|
| docs/acquisition-architecture.md | 采集系统架构 + 数据流 |
| docs/acquisition-provider-interface.md | 如何接第二个 provider |
| docs/acquisition-admin-workflow.md | 管理面板交互流程 |
| docs/ASMRONE_FEATURE_BENCHMARK_ZH.md | asmr.one 功能对标 |
| docs/COMPETITOR_DEEP_DIVE_ZH.md | 竞品分析 + UI 模式 |
| docs/ARSM_AUDIT_REPORT_ZH.md | 全面审查报告 |
| docs/RELEASE_NOTES_v1.0_ZH.md | v1.0 发布说明 |
