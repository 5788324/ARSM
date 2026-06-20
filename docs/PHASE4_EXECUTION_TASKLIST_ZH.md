# ARSM Phase 4 执行任务单

日期：2026-06-20
定位：这是一份给 DeepSeek 执行、给 Codex 审查的可执行任务清单。

---

## 目标

Phase 4 不追求一次做完所有“像 asmr.one”的功能。
本阶段只解决当前最影响可用性的 4 个核心问题：

1. 采集任务看不到细粒度下载进度
2. 作品详情页曲目平铺、重复、无法按子文件夹分类
3. 播放器过于简陋，没有全局底部播放器和连续播放
4. 元数据仍需手动 fetch/apply，不能自动匹配

字幕/台本属于本阶段预埋能力，完整体验放到后续 Phase 5。

---

## 执行顺序

### Sprint A：采集进度可视化

目标：后台采集任务页能看到总体进度、当前文件、最近文件列表、失败文件。

需要改动：
- `src/lib/acquisition/runner.ts`
- `src/lib/acquisition/providers/asmrone.ts`
- `src/app/admin/acquisition/page.tsx`

验收标准：
- 卡片上显示总进度条
- 显示 `已完成文件 / 总文件`
- 显示 `已下载大小 / 总大小`
- 显示当前下载文件路径
- 可展开查看最近 20-50 个文件状态
- 失败文件可见

### Sprint B：曲目子文件夹分组

目标：作品详情页按 `mp3 / wav / SEあり / SEなし / 特典 / 台本` 等分组渲染，不再简单平铺。

需要改动：
- `prisma/schema.prisma`
- `src/lib/import/service.ts`
- `src/app/works/[id]/page.tsx`

建议新增字段：
- `TrackFile.groupPath`
- `TrackFile.groupLabel`
- `TrackFile.sortKey`

验收标准：
- 导入时保留子目录分组信息
- 详情页按组显示，不再出现重复平铺错觉
- 默认展开常用组（如 MP3）
- 每组可显示曲目数和总时长

### Sprint C：全局播放器基础版

目标：替换“每行一个原生 audio”，提供底部全局播放器。

需要改动：
- `src/components/player/*`
- `src/app/layout.tsx`
- `src/app/works/[id]/page.tsx`

最低能力：
- 点击曲目后进入全局队列
- 底部显示当前曲目与封面
- 播放 / 暂停
- 上一首 / 下一首
- 进度条
- 音量
- 倍速（1x / 1.25x / 1.5x / 2x）

验收标准：
- 切页后播放器不中断
- 同作品可以连续播放
- 当前播放曲目高亮
- 继续播放状态可恢复

### Sprint D：元数据自动匹配

目标：采集导入成功后，按 RJ 编号自动 fetch 并 apply metadata。

需要改动：
- `src/lib/acquisition/runner.ts`
- `src/app/api/metadata/fetch/route.ts`
- `src/app/api/metadata/apply/route.ts`
- `src/lib/metadata/provider.ts`

验收标准：
- acquisition job 完成导入后自动发起 metadata fetch
- 对有 `RJ/VJ/BJ` 编号的作品自动 apply
- 默认策略为“补空字段 + 合并 tags/voiceActors”
- 失败时写入 job 错误，不阻塞作品导入

### Sprint E：字幕/台本最小支撑

目标：先识别和展示已有字幕/文本资源，不做完整 AI 字幕系统。

需要改动：
- `prisma/schema.prisma`
- `src/lib/import/service.ts`
- `src/app/works/[id]/page.tsx`

最低能力：
- 识别 `.vtt/.srt/.lrc/.txt/.pdf`
- 不再把这些都记为 skippedFiles
- 详情页能显示“字幕 / 台本”分组或附件区

---

## 本阶段明确不做

- Whisper 音频转录
- LLM 中文字幕生成
- 评分系统
- 评论系统
- 多 provider 扩展
- 移动端原生壳
- 分布式翻译 worker

这些都保留到后续阶段。

---

## DeepSeek 交付要求

每个 Sprint 提交时必须同时包含：

1. 代码
2. 测试
3. 文档更新

至少更新：
- `docs/WORKLOG_ZH.md`
- `docs/PROJECT_HANDOFF_ZH.md`
- `docs/user-guide-zh.md`

如果涉及架构变化，还要更新：
- `ARSM_NEXT_PHASE.md`
- `PROJECT_PLAN.md`
- `WORKLIST.md`

---

## Codex 审查重点

Codex 审查时重点看：

1. 是否只是把 UI 做出来了，但后端数据结构没跟上
2. 是否引入了临时字段，后续无法扩展
3. 是否保留了旧行为兼容性
4. 是否补了测试
5. 是否同步更新了 handoff / worklog / user-guide

---

## 当前优先级结论

必须先做：
- Sprint A：采集进度可视化
- Sprint B：曲目子文件夹分组

然后再做：
- Sprint C：全局播放器
- Sprint D：元数据自动匹配

最后再做：
- Sprint E：字幕/台本最小支撑
