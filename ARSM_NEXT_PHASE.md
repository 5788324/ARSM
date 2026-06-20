# ARSM 下一阶段规划 — 竞品整合版

日期：2026-06-20 | 竞品：neokikoeru / kikoeru-express / KikoFlu / asmr.one

---

## 竞品核心功能对标

| 功能 | KikoFlu | kikoeru-express | asmr.one | **ARSM** |
|------|---------|-----------------|----------|----------|
| 全局播放器 | ✅ | — | ✅ | ❌ |
| 倍速播放 | ✅ | — | ✅ | ❌ |
| 连续播放 | ✅ | — | ✅ | ❌ |
| 播放队列 | ✅ | — | ✅ | ❌ |
| 字幕加载 | ✅ | — | — | ❌ |
| 字幕翻译 | ✅ | ✅ | — | ❌ |
| 字幕调轴 | ✅ | — | — | ❌ |
| 评分系统 | ✅ | ✅ | ✅ | ❌ |
| 多源刮削 | — | ✅(3个) | — | ⚠️(1个) |
| 高级搜索 | ✅ | ✅ | ✅ | ❌ |
| 倍速下载 | — | — | — | ❌ |
| 并发下载 | ✅ | — | — | ❌ |
| 防社死模式 | ✅ | — | — | ❌ |
| 深色主题 | ✅ | — | ✅ | ⚠️(Tailwind已就绪) |
| 国际化 | ✅(5语) | — | — | ❌ |
| 音频触感 | ✅ | — | — | ❌ |
| 移动端 | ✅(全平台) | — | — | ⚠️(PWA) |
| Docker | ✅(neokikoeru) | ✅ | — | ❌ |
| 推荐系统 | ✅ | — | ✅ | ❌ |
| 标签自动翻译 | ✅ | — | — | ❌ |

---

## 新增功能（基于竞品发现）

### F1. 字幕系统（对标 KikoFlu）

KikoFlu 的字幕能力远超预期，ARSM 当前完全缺失：

| KikoFlu 能力 | ARSM 当前 | 建议 |
|-------------|----------|------|
| 自动字幕加载 | 无 | P1 — 导入时识别 .vtt/.srt/.lrc 文件 |
| 字幕导入/编辑/调轴 | 无 | P2 — 管理后台编辑面板 |
| 播放时实时翻译 | 无 | P3 — 接入 LLM translation API |
| 字幕库(SQLite索引) | 无 | P3 — TrackSubtitle 模型 |
| 歌词/字幕全屏 | 无 | P3 — 前端全屏 overlay |
| 悬浮歌词(Android) | 无 | P4 — 仅移动端 |

**模型建议**（基于 kikoeru-express 的 translate route）:
```prisma
model TrackSubtitle {
  id           String   @id @default(cuid())
  trackId      String
  kind         String   // vtt, srt, lrc, txt, transcript, translation
  language     String?  // ja, zh-CN
  label        String?  // 原文 / 中文字幕 / 台本
  isDefault    Boolean  @default(false)
  filePath     String?
  content      String?  // parsed text content (for search)
  createdAt    DateTime @default(now())
}
```

### F2. 高级搜索（对标 KikoFlu + kikoeru-express）

KikoFlu 支持：多标签/排除标签/评分/发售日期多维筛选
kikoeru-express 有"高级聚合搜索，多关键字"提交记录

ARSM 当前：仅 `take: 50`，无搜索，无过滤

**建议**:
- P1 — 修复 `/works` 死搜索框，接 `/api/works/search`
- P2 — 标签筛选、VA/社团筛选
- P3 — 多维度组合筛选

### F3. 评分 + 推荐（对标 asmr.one + KikoFlu）

- P2 — `Work` 表加 `rating`/`ratingCount`，1-5 星组件
- P3 — 首页"热门作品"（按评分+收听次数排序）

### F4. 多源刮削（对标 kikoeru-express 的 3 个 scraper）

kikoeru-express 有：`asmrOne.js` + `dlsite.js` + `hvdb.js`

ARSM 当前仅 asmr.one 一个 provider。接口已就绪：

- P2 — `DlsiteMetadataProvider`
- P3 — 其他源（hvdb 等）

### F5. 播放器增强（对标 KikoFlu）

| 功能 | 优先级 |
|------|--------|
| 倍速播放 (0.5x/1x/1.5x/2x) | P1 |
| 循环模式 (单曲/列表/随机) | P2 |
| 睡眠定时器 | P3 |
| 音频触感反馈 (移动端) | P4 |

### F6. 用户体验（对标 KikoFlu）

| 功能 | 优先级 |
|------|--------|
| 防社死模式 | P2 |
| 深色模式切换按钮 | P2 |
| 横屏播放 | P3 |
| 自定义主题配色 | P4 |

### F7. 并发下载管理（对标 KikoFlu）

KikoFlu 支持：整个作品下载、选择性下载、并发下载管理、离线下载搜索与排序

ARSM 当前：顺序单文件下载

- P2 — 2-3 并发下载（`downloadWork` 加 concurrency 参数）
- P3 — 下载队列可视化管理

### F8. 部署（对标 neokikoeru）

neokikoeru 一行 Docker 启动。ARSM 当前需手动 Node 环境。

- P2 — `Dockerfile` + `docker-compose.yml`（已有基础）
- P3 — 一键部署脚本

---

## 整合后优先级

### P1 — 核心体验（第 1-2 轮）
- [ ] **全局播放器** — 底部固定栏 + 倍速 + 连续播放（对标 asmr.one + KikoFlu）
- [ ] **采集进度可视化** — 文件级进度条（Phase A）
- [ ] **曲目子文件夹分组** — mp3/wav/SEあり（Phase B）
- [ ] **修复搜索** — `/works` 死搜索框接 API
- [ ] **字幕文件识别** — 导入时识别 .vtt/.srt/.lrc，不再当 skipped

### P2 — 产品力（第 3-4 轮）
- [ ] **评分系统** — 1-5 星（对标 asmr.one + KikoFlu）
- [ ] **VA/社团可点击筛选**
- [ ] **分页**
- [ ] **深色模式切换**
- [ ] **并发下载** — 2-3 并发
- [ ] **元数据自动匹配** — import 后自动 fetch+apply（Phase D）
- [ ] **防社死模式** — 无封面模式 / 标题模糊
- [ ] **DlsiteMetadataProvider** — 第二个刮削源
- [ ] **"带字幕"筛选**

### P3 — 成熟化（第 5-6 轮）
- [ ] **字幕翻译** — LLM API 集成（对标 KikoFlu "播放时实时翻译"）
- [ ] **字幕编辑面板** — 管理后台调轴/编辑
- [ ] **高级搜索** — 多标签/排除标签/多维筛选
- [ ] **热门作品推荐**
- [ ] **播放列表管理**
- [ ] **睡眠定时器**
- [ ] **Docker 部署** — 完善 docker-compose

### P4 — 远期
- [ ] **AI 字幕生成** — Whisper + LLM
- [ ] **移动端 PWA 优化** — 音频触感反馈
- [ ] **国际化** — i18n 抽出
- [ ] **横屏模式**
- [ ] **自定义主题**
- [ ] **悬浮歌词**

---

## 本次新发现（第一次竞品分析未覆盖）

1. **KikoFlu 字幕系统极其完善** — 不只是播放字幕，还包括导入/编辑/调轴/翻译/全屏/悬浮/字幕库索引。这是 ARSM 当前最大的功能缺口。

2. **kikoeru-express 有 translate 路由** — 已实现 AI 翻译任务管理（`AILyricTaskStatus`），ARSM 可以直接借鉴其 API 设计。

3. **KikoFlu 支持 5 种语言国际化** — 说明同人音声用户群跨国，ARSM 前期中文化即可，后期可考虑 i18n。

4. **防社死模式** — 这是 ASMR 用户的真实痛点，ARSM 应该在隐私方面领先。

5. **并发下载管理** — KikoFlu 支持选择性下载 + 并发 + 离线管理，比 ARSM 的顺序下载体验好得多。

6. **kikoeru-express 有 3 个 scraper** — asmrOne + dlsite + hvdb，ARSM 的 provider 架构已就绪，只需写新 provider。

---

## 各阶段估时

| 阶段 | 内容 | 估时 |
|------|------|------|
| A | 采集进度可视化 | 1-2天 |
| B | 曲目分组 | 2-3天 |
| C | 全局播放器 + 倍速 | 3-5天 |
| F1-P1 | 字幕文件识别 | 1天 |
| F2-P1 | 修复搜索 | 0.5天 |
| D | 元数据自动匹配 | 2-3天 |
| F3 | 评分系统 | 1天 |
| F5 | 并发下载 | 1天 |
| F6 | 防社死 + 深色切换 | 1天 |
| F1-P2 | 字幕翻译 | 3天 |
| **合计** | | **15-21天** |
