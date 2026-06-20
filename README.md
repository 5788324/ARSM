# ARSM — 私人音频图书馆

从 asmr.one 自动采集同人音声，本地私有化存储，Web 端管理播放。

---

## 核心能力

- 🔽 **自动采集** — 输入 RJ 编号，一键下载 + 导入，进度条实时追踪
- 📂 **本地导入** — 扫描文件夹，自动识别音频 + 字幕文件
- 🎵 **全局播放器** — 底部固定栏，倍速播放，切页不中断
- 📋 **曲目分组** — 按 mp3/wav/SEあり 等自动分组展示
- 🔍 **元数据管理** — 从 asmr.one 获取社团/声优/标签，自动匹配
- 🏷️ **标签展示** — 作品标签胶囊展示

## 当前限制

- 字幕/台本仅识别文件，尚未集成翻译
- 仅支持 asmr.one 单一采集来源
- 无评分/评论系统

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
| [用户指南](docs/user-guide-zh.md) | 启动、采集、导入、常见问题 |
| [项目功能文档](docs/PROJECT_FEATURE_DOC_ZH.md) | 完整功能清单 + 会议议程 |
| [审查报告](docs/ARSM_AUDIT_REPORT_ZH.md) | Bug 清单（P1/P2/P3） |
| [竞品分析](docs/COMPETITOR_DEEP_DIVE_ZH.md) | Kikoeru 系列参考 |
| [技术参考](docs/KIKOERU_TECH_REFERENCE_ZH.md) | kikoeru 源码分析 |
| [下一阶段](ARSM_NEXT_PHASE.md) | Phase 4+ 路线 |
| [交接文档](docs/PROJECT_HANDOFF_ZH.md) | 给接手者的完整说明 |
