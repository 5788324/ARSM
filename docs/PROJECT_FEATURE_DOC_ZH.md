# ARSM 项目功能文档

日期：2026-06-20 | 最新提交：`3430f81` | Phase 4 已完成

> 定位：评审材料。供 Codex 审查使用，非唯一交接文档。交接见 `docs/PROJECT_HANDOFF_ZH.md`。

---

## 一、项目概览

**ARSM** — 私人音频图书馆。自动从 asmr.one 采集同人音声作品，本地私有化存储，Web 端播放管理。

| 项目 | 信息 |
|------|------|
| 仓库 | `github.com/5788324/ARSM` |
| 工作区 | `G:\Hermes Agent\ARSM\ARSM` |
| 技术栈 | Next.js 16 + TypeScript + Prisma 5 + SQLite + NextAuth v5 + Tailwind 4 |
| 测试 | 43/43 通过 (7 个测试文件) |
| 构建 | ✅ 通过 |
| TypeCheck | ✅ 通过 |

---

## 二、已实现功能

### 2.1 核心采集链路（Phase 1-3）

```
用户输入 RJ 编号 → 后台异步任务 → inspect → download → import → 入库
```

| 模块 | 文件 | 状态 |
|------|------|------|
| Provider 注册中心 | `src/lib/acquisition/registry.ts` | ✅ |
| Provider 接口 | `src/lib/acquisition/types.ts` | ✅ |
| asmr.one Provider | `src/lib/acquisition/providers/asmrone.ts` | ✅ |
| Runner 编排器 | `src/lib/acquisition/runner.ts` | ✅ |
| AcquisitionJob 模型 | `prisma/schema.prisma` | ✅ |
| 统一 API | `/api/acquisition/jobs` | ✅ |
| 兼容 API | `/api/acquisition/asmrone` | ✅ |
| 采集后台页 | `/admin/acquisition` | ✅ |

#### 采集链路特性

- ✅ 流式下载（不占内存）
- ✅ 3 次重试 + 超时
- ✅ acquire → import 一次点击全自动
- ✅ 下载目录白名单防越界
- ✅ `groupByTop=true`：一个 RJ 文件夹 = 一个作品
- ✅ 任务状态：pending → inspecting → downloading → importing → done/review/done_with_errors/failed
- ✅ 进度实时轮询（3s）
- ✅ 错误详情持久化
- ✅ 向后兼容路由

### 2.2 导入系统

| 模块 | 文件 | 状态 |
|------|------|------|
| 共享导入服务 | `src/lib/import/service.ts` | ✅ |
| 导入 API | `/api/import` | ✅ |
| 重复检测 | CJK 滑窗 + workCode 匹配 | ✅ |
| review 队列 | `ImportJob.reviewPayload` | ✅ |
| 自动创建仓库 | `StorageRepository` 不存在时自动建 | ✅ |

### 2.3 认证

| 功能 | 实现 |
|------|------|
| 登录 | NextAuth v5 Credentials + bcryptjs |
| 用户 | admin/admin（seed 创建） |
| Session | JWT，已固定 NEXTAUTH_SECRET |

### 2.4 页面清单

| 路由 | 类型 | 功能 | 状态 |
|------|------|------|------|
| `/` | SSR | 首页（统计 + 续听） | ✅ |
| `/login` | SSR | 登录页 | ✅ |
| `/works` | SSR | 作品库（需登录） | ⚠️ 搜索框死 |
| `/works/[id]` | SSR | 作品详情 + 播放 | ⚠️ 少量英语 |
| `/favorites` | SSR | 收藏列表 | ⚠️ "tracks" |
| `/admin` | SSR | 管理面板 | ✅ |
| `/admin/acquisition` | CSR | 采集任务（新建+列表） | ✅ |
| `/admin/import` | CSR | 手动导入 | ⚠️ 少量英语 |
| `/admin/jobs` | CSR | 任务状态 | ✅ |
| `/admin/metadata` | CSR | 元数据抓取 | ⚠️ 多处英语 |
| `/admin/repositories` | CSR | 仓库管理 | ✅ |
| `/admin/duplicates` | CSR | 重复审查 | ✅ |

### 2.5 数据库（SQLite）

15 个模型：User, Work, Track, TrackFile, Circle, VoiceActor, Tag, WorkTag, WorkVoiceActor, WorkSource, StorageRepository, ListeningHistory, Favorite, ImportJob, MetadataJob, AcquisitionJob

### 2.6 启动方式

双击 `启动ARSM.bat`：自动 seed + 启动 dev server + 浏览器打开 localhost:3000

---

## 三、已知 Bug / 未完成项

### P1 — 功能性 Bug

| # | 位置 | 问题 | 影响 |
|---|------|------|------|
| 1 | `/works` 搜索框 | `<input>` 无 onChange/onSubmit | 死控件，用户以为能搜索 |
| 2 | `page.tsx:78` | `durationSec` 为 0 时除零 | 进度条 NaN，可能白屏 |
| 3 | metadata 页面 | DLsite 选项无对应 provider | 选择后必然报错 |

### P2 — 英语 UI 残留

| # | 页面 | 位置 | 英语 | 应为 |
|---|------|------|------|------|
| 1 | `/favorites` | L77 | `tracks` | `首曲目` |
| 2 | `/works/[id]` | L121 | `tracks ·` | `首曲目 ·` |
| 3 | `/works/[id]` | L190 | `fetched {date}` | `获取于 {date}` |
| 4 | `/admin/import` | L38 | `'Import failed'` | `'导入失败'` |
| 5 | `/admin/import` | L126 | `...and N more` | `...还有 N 个` |
| 6 | `/admin/metadata` | L49 | `'Fetch failed'` | `'获取失败'` |
| 7 | `/admin/metadata` | L100 | `'Work Code'` | `'作品编号'` |
| 8 | `/admin/metadata` | L137 | `Preview` | `预览` |
| 9 | `/admin/metadata` | L149 | `Title:` | `标题：` |

### P3 — 优化

| # | 位置 | 问题 |
|---|------|------|
| 1 | `.env` | NEXTAUTH_SECRET 已加但需确认持久 |
| 2 | `service.ts` | `scanDirectory` 默认按父目录分组，手动导入可能拆散 |

## 四、功能缺口（vs asmr.one 竞品对标），ARSM 缺的功能

| 优先级 | 功能 | 说明 |
|--------|------|------|
| **P1** | 全局播放器 | 底部固定栏，切页不中断，自动续播 |
| **P1** | 修复搜索 | /works 搜索框接 API |
| **P1** | 标签展示 | Tag/WorkTag 模型已有，前端渲染 |
| **P2** | VA/社团点击筛选 | 点击声优名 → 该 VA 全部作品 |
| **P2** | 作品列表分页 | 当前 `take: 50` 无翻页 |
| **P2** | 评分系统 | 1-5 星 |
| **P2** | "带字幕"筛选 | `hasSubtitle` 已有，加 filter |
| **P2** | 文件树导航 | 替代扁平曲目列表 |
| **P2** | 直接下载按钮 | `/api/tracks/:id/download` |
| **P2** | 深色模式切换 | Tailwind dark: 已就绪 |
| **P3** | 热门/最近 | 首页内容推荐 |
| **P3** | 播放列表 | 队列管理 |
| **P3** | 播放速度 | 0.5x/1x/2x |
| **P4** | AI 字幕 | Whisper + LLM |

---

## 五、架构文档清单

| 文件 | 内容 |
|------|------|
| `docs/acquisition-architecture.md` | 采集系统架构 + 数据流 |
| `docs/acquisition-provider-interface.md` | 如何接第二个 provider |
| `docs/acquisition-admin-workflow.md` | 管理面板交互流程 |
| `docs/ASMRONE_FEATURE_BENCHMARK_ZH.md` | asmr.one 功能对标 |
| `docs/COMPETITOR_DEEP_DIVE_ZH.md` | 竞品分析 + UI 模式 |
| `docs/ARSM_AUDIT_REPORT_ZH.md` | 全面审查报告 |

---

## 六、建议会议议程

### Round 1 — 现状对齐（15 分钟）

1. 确认"已实现"清单有无遗漏
2. 确认"已知 Bug"是否认可（P1 x 3 / P2 x 9 / P3 x 2）

### Round 2 — 路线决策（20 分钟）

3. P1 Bug 修复分配（谁修 / 什么时候）
4. **播放器方案选择**：
   - 方案 A：简单底部 `<audio>` bar（2 天）
   - 方案 B：React Context 全局播放器（1 周）
   - 方案 C：抄 neokikoeru 的 Vue 播放器移植（2 周）
5. P1 功能范围确认：全局播放器 + 修复搜索 + 标签展示

### Round 3 — 架构审查（15 分钟）

6. 审查 `runner.ts` + `import/service.ts` 有无遗漏边界
7. 确认 `AcquisitionJob` 是否需要补字段（postprocess 相关）
8. 确认 `NEXTAUTH_SECRET` 是否持久化到部署环境

### Round 4 — 分工与排期（10 分钟）

9. 下一阶段任务拆分 + 估时
10. 确定下次审查时间

---

## 七、相关文档

- 审查报告：`docs/ARSM_AUDIT_REPORT_ZH.md`
- 功能对标：`docs/ASMRONE_FEATURE_BENCHMARK_ZH.md`
- 竞品分析：`docs/COMPETITOR_DEEP_DIVE_ZH.md`
- 架构文档：`docs/acquisition-*.md`
