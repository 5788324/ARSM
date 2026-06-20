# ARSM — 私人音频图书馆

从 asmr.one 自动采集同人音声，本地私有化存储，Web 端管理播放。当前已完成 Phase 5。

---

## 核心能力

- 🔽 **自动采集** — 输入 RJ 编号，一键下载 + 导入，进度条实时追踪
- 📂 **本地导入** — 扫描文件夹，自动识别音频 + 字幕文件
- 🎵 **全局播放器** — 底部固定栏，支持队列、循环、倍速、续播
- 📋 **曲目分组** — 按目录层级与类型自动分组展示
- 🔍 **作品库搜索** — 搜索、排序、筛选、分页，状态同步到地址栏
- 🧭 **关系浏览** — 社团 / 声优 / 标签可点击跳转
- 📝 **字幕能力** — .vtt/.srt/.lrc/.txt/.pdf 识别，文本字幕可直接阅读
- 🌙 **深色模式** — 一键切换明暗主题
- 🐳 **部署支持** — 启动批处理 + Docker 基础支持

## 当前限制

- 仅支持 asmr.one 单一采集来源
- 字幕暂不支持翻译、时间轴联动、AI 生成
- 仍无评分、收听历史、统计等个人化能力

## 快速启动

```bat
双击 启动ARSM.bat
→ http://localhost:3000
→ 用户名: admin  密码: admin
```

## 技术栈

Next.js 16 · TypeScript · Prisma 5 · SQLite · NextAuth v5 · Tailwind CSS 4

## 文档

| 文档 | 说明 |
|------|------|
| [用户指南](docs/user-guide-zh.md) | 启动、采集、导入、播放、常见问题 |
| [项目功能文档](docs/PROJECT_FEATURE_DOC_ZH.md) | 完整功能清单 |
| [项目交接文档](docs/PROJECT_HANDOFF_ZH.md) | 当前状态与接手说明 |
| [工作日志](docs/WORKLOG_ZH.md) | 持续维护日志 |
| [下一阶段](ARSM_NEXT_PHASE.md) | Phase 6 路线 |
| [工作清单](WORKLIST.md) | 已完成 / 待开发事项 |
| [项目计划](PROJECT_PLAN.md) | 分阶段路线图 |
| [v1.0 发布说明](docs/RELEASE_NOTES_v1.0_ZH.md) | 版本发布说明 |
| [Phase 6 任务单](docs/PHASE6_ONEPASS_TASKLIST_ZH.md) | 给 DeepSeek 的一次性交付任务单 |
