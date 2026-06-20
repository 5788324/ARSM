# ARSM 下一阶段

日期：2026-06-20 | 当前提交：`bd396ec`

---

## 下一阶段目标

把 ARSM 从"能导入、能播放"升级到接近 asmr.one + Kikoeru 的可用产品形态。

### 优先级

| 优先级 | 阶段 | 内容 |
|--------|------|------|
| **P1** | A | 采集进度可视化 |
| **P1** | B | 曲目按子文件夹分组 |
| **P1** | C1-C3 | 全局播放器基础版 |
| P2 | D | 元数据自动匹配 |
| P2 | E1-E4 | 字幕/台本识别与展示 |
| P3 | C4-C5 | 播放器增强（布局、记忆） |
| P3 | E5 | 机器翻译（Whisper + LLM） |

---

## Phase A：采集进度可视化

**目标**: 采集页能看到每个文件的下载状态和进度条

**现状**: runner 已有 hooks（onFileStart/Progress/Done/Error），但未写回 DB。progressJson 只存聚合统计。

**要改的文件**:
- `src/lib/acquisition/runner.ts` — 接入 provider hooks，回写 progressJson
- `src/app/admin/acquisition/page.tsx` — 渲染进度条 + 文件列表

**量级**: 1-2 天

---

## Phase B：曲目子文件夹分组

**目标**: 作品详情页不再平铺曲目，按 `mp3 / wav / SEあり / 特典` 分组显示

**现状**: Track/TrackFile 无分组字段，import 不保留文件夹层级

**要改的文件**:
- `prisma/schema.prisma` — TrackFile 加 groupPath/groupLabel/sortKey
- `src/lib/import/service.ts` — 导入时提取分组路径
- `src/app/works/[id]/page.tsx` — 按组渲染

**量级**: 2-3 天

---

## Phase C：全局播放器

**目标**: 底部固定播放器，切页不中断，连续播放，播放队列

**现状**: 原生 `<audio controls>` 每个曲目独立

**要改的文件**:
- `src/components/player/*` (新建) — React Context 全局状态
- `src/app/works/[id]/page.tsx` — 去原生 audio，改为播放按钮
- `src/app/layout.tsx` — 挂载底部播放器

**量级**: 3-5 天

---

## Phase D：元数据自动匹配

**目标**: 采集导入后自动从 asmr.one 获取元数据并 apply

**要改的文件**:
- `src/lib/acquisition/runner.ts` — import 后触发 metadata fetch
- `src/lib/metadata/provider.ts` — AsmrOneMetadataProvider
- `src/lib/metadata/types.ts` — 自动 apply 策略

**量级**: 2-3 天

---

## Phase E：字幕/台本

**目标**: 识别已有字幕文件，播放器展示同步字幕

**要改的文件**:
- `prisma/schema.prisma` — TrackSubtitle 模型
- `src/lib/import/service.ts` — 非音频文件识别
- `src/app/works/[id]/page.tsx` — 字幕/台本展示
- `src/components/player/*` — `<track>` 支持

**量级**: 3-5 天

---

## 风险评估

| 阶段 | 风险 |
|------|------|
| A | 低 — 纯前端渲染 + runner 小改动 |
| B | 中 — 需改 schema + 影响已有导入逻辑 |
| C | 中 — React Context 全局状态 + 多页面协调 |
| D | 中 — 需要可靠 metadata provider |
| E | 高 — 字幕模型 + 文件识别 + 前端 `<track>` |
