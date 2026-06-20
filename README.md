# ARSM — 私人音频图书馆

从 asmr.one 自动采集同人音声，本地私有化存储，Web 端管理播放。v1.0

---

## 核心能力

- 🔽 **自动采集** — 输入 RJ 编号，一键下载 + 导入，进度条实时追踪
- 📂 **本地导入** — 扫描文件夹，自动识别音频 + 字幕文件
- 🎵 **全局播放器** — 底部固定栏，倍速播放（0.75x-2x），自动连续播放
- 📋 **曲目分组** — 按 mp3/wav/SEあり 等自动分组展示
- 🔍 **元数据自动匹配** — 采集后自动从 asmr.one 补全社团/声优/标签
- 📝 **字幕识别** — .vtt/.srt/.lrc/.txt/.pdf 自动落库展示

## 当前限制

- 仅支持 asmr.one 单一采集来源 | 字幕无翻译 | 无评分/评论

## 快速启动

```
双击 启动ARSM.bat
→ http://localhost:3000
→ 用户名: admin  密码: admin
```

## 技术栈

Next.js 16 · TypeScript · Prisma 5 · SQLite · NextAuth v5 · Tailwind CSS 4

## 文档

| 文档 | 说明 |
|------|------|
| [v1.0 发布说明](docs/RELEASE_NOTES_v1.0_ZH.md) | 版本发布 |
| [用户指南](docs/user-guide-zh.md) | 启动、采集、导入、常见问题 |
| [项目功能文档](docs/PROJECT_FEATURE_DOC_ZH.md) | 完整功能清单 + 会议议程 |
| [交接文档](docs/PROJECT_HANDOFF_ZH.md) | 给接手者的完整说明 |
| [下一阶段](ARSM_NEXT_PHASE.md) | Phase 5 路线 |
| [工作日志](docs/WORKLOG_ZH.md) | 持续维护日志 |
