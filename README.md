# ARSM — 私人音频图书馆

从 asmr.one 自动采集同人音声，本地私有化存储，Web 端管理播放。当前已完成 Phase 7。

---

## 核心能力

- 🔽 **自动采集** — 输入 RJ 编号，一键下载 + 导入，进度条实时追踪
- 📂 **本地导入** — 扫描文件夹，自动识别音频、封面、字幕文件
- 🎵 **全局播放器** — 队列、循环、倍速、续播
- 📝 **字幕能力** — `.lrc/.vtt/.srt` 跟播高亮、点击跳转，`.txt/.pdf` 文本阅读
- 📋 **曲目分组** — 按目录层级与类型自动分组展示
- 🔍 **作品库搜索** — 搜索、排序、筛选、分页，状态同步到地址栏
- 🧭 **关系浏览** — 社团 / 声优 / 标签可点击跳转
- 🏠 **首页聚合** — 最近添加、最近采集、最近播放、统计、快捷入口
- ✏ **元数据编辑** — 管理员可手动编辑标题、发售日并重抓 asmr.one
- ⭐ **个人评分** — 按用户存储的作品评分
- 👥 **多用户结构** — 保留多用户数据模型，普通用户与管理员界面已分离
- 🌙 **深色模式** — 一键切换明暗主题
- 🐳 **部署支持** — 启动批处理 + Docker 基础支持

## 当前限制

- 仅支持 asmr.one 单一真实来源，DLsite 仅为 stub
- 收听统计仍需继续深化
- 字幕暂不支持翻译、双语显示、AI 生成
- 仍未提供 Android / 桌面正式打包壳

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
| [用户指南](docs/user-guide-zh.md) | 启动、采集、导入、播放、字幕、评分、常见问题 |
| [项目功能文档](docs/PROJECT_FEATURE_DOC_ZH.md) | 当前功能总览 |
| [项目交接文档](docs/PROJECT_HANDOFF_ZH.md) | 当前状态与接手说明 |
| [工作日志](docs/WORKLOG_ZH.md) | 持续维护日志 |
| [下一阶段](ARSM_NEXT_PHASE.md) | Phase 8 路线 |
| [工作清单](WORKLIST.md) | 已完成 / 待开发事项 |
| [项目计划](PROJECT_PLAN.md) | 分阶段路线图 |
| [Phase 8 任务单](docs/PHASE8_ONEPASS_TASKLIST_ZH.md) | 给 DeepSeek 的一次性交付任务单 |
