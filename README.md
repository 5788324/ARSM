# ARSM — 私人音频图书馆

从 asmr.one 自动采集同人音声，本地私有化存储，Web 端管理播放。

---

## 核心能力

- 🔽 **自动采集** — 输入 RJ 编号，一键下载 + 导入
- 📂 **本地导入** — 扫描文件夹，自动识别音频作品
- 🎵 **Web 播放** — 浏览器直接播放，PWA 支持
- 🔍 **重复检测** — CJK 滑窗匹配，避免重复导入
- 📋 **元数据管理** — 从 asmr.one 获取社团/声优/标签

## 当前限制

- 播放器较简陋（全局播放器开发中）
- 字幕/台本系统尚未实现
- 仅支持 asmr.one 单一采集来源

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
| [功能对标](docs/ASMRONE_FEATURE_BENCHMARK_ZH.md) | vs asmr.one 对比 |
| [竞品分析](docs/COMPETITOR_DEEP_DIVE_ZH.md) | Kikoeru 系列参考 |
| [交接文档](docs/PROJECT_HANDOFF_ZH.md) | 给接手者的完整说明 |
| [工作日志](docs/WORKLOG_ZH.md) | 持续维护日志 |
