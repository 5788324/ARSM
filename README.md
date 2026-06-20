# ARSM - 私人音频图书馆

从 asmr.one 自动采集同人音声，本地私有化存储，Web 端管理播放。

---

## 核心能力

- 自动采集：输入 RJ 编号，一键下载 + 导入
- 本地导入：扫描文件夹，自动识别音频作品
- Web 播放：浏览器直接播放
- 重复检测：CJK 滑窗匹配，避免重复导入
- 元数据管理：从 asmr.one 获取社团 / 声优 / 标签

## 当前阶段

当前已完成采集链路 MVP，正在进入 Phase 4 产品化阶段。

Phase 4 重点：
- 采集进度可视化
- 曲目子文件夹分组
- 全局播放器
- 元数据自动匹配
- 字幕 / 台本最小支撑

## 快速启动

```txt
双击 启动ARSM.bat
访问 http://localhost:3000
登录：admin / admin
双击 停止ARSM.bat 停止服务
```

## 文档入口

| 文档 | 说明 |
|------|------|
| [用户指南](docs/user-guide-zh.md) | 启动、采集、导入、常见问题 |
| [交接文档](docs/PROJECT_HANDOFF_ZH.md) | 当前权威交接入口 |
| [Phase 4 执行任务单](docs/PHASE4_EXECUTION_TASKLIST_ZH.md) | 给 DeepSeek 执行、给 Codex 审查 |
| [项目功能文档](docs/PROJECT_FEATURE_DOC_ZH.md) | 完整功能清单 + 评审材料 |
| [审查报告](docs/ARSM_AUDIT_REPORT_ZH.md) | Bug 与风险清单 |
| [功能对标](docs/ASMRONE_FEATURE_BENCHMARK_ZH.md) | vs asmr.one |
| [竞品分析](docs/COMPETITOR_DEEP_DIVE_ZH.md) | Kikoeru 系列参考 |
| [工作日志](docs/WORKLOG_ZH.md) | 持续维护日志 |

## 技术栈

Next.js 16 · TypeScript · Prisma 5 · SQLite · NextAuth v5 · Tailwind CSS 4
