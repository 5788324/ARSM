# ARSM 工作日志

> 持续维护日志，2026-06-17 起。

---

## 2026-06-17

- 项目初始化：Next.js 16 + TypeScript + Prisma 5 + SQLite + Tailwind 4 + NextAuth v5
- 初版 Prisma Schema、认证系统、首页 / 登录 / 作品库 / 收藏 / 管理面板
- 首次推送 GitHub

## 2026-06-18

- 本地仓库与导入扫描能力
- 元数据 fetch / apply API
- 重复审查、任务监控、仓库管理、导入页
- 全站主体中文化

## 2026-06-19

- asmr.one provider 初版
- inspect + download 基础链路
- 流式下载、重试与超时策略
- 统一 API 响应格式

## 2026-06-20

### Phase 3

- AcquisitionProvider 接口、registry、runner
- AcquisitionJob 模型落地
- 共享 import service
- `/admin/acquisition` 迁移为任务视图

### Phase 4

- 采集进度条与文件列表
- 曲目目录分组
- 全局播放器
- 自动元数据匹配
- 字幕文件识别

### Phase 5

- 作品库搜索、排序、分页、筛选、URL 同步
- 社团 / 声优 / 标签关系页
- 队列面板、清空即停播、深色模式
- 字幕文本读取

## 2026-06-21

### Phase 6

- 时间轴字幕解析：`.lrc / .vtt / .srt`
- 跟播高亮、自动滚动、点击跳转
- 详情页重构：首页聚合、继续收听、管理员编辑、个人评分

### Phase 7

- 普通用户 / 管理员界面分离
- 字幕解析测试补齐
- 统计口径清理
- DLsite stub 预留

### Phase 8

- DLsite inspect-only provider
- PlayLog 模型与累计时长链路
- 播放统计路径收口
- 修复 Prisma schema 中 PlayLog 反向关系缺失问题

### Phase 9

- DLsite inspect 结果持久化到任务结果
- provider 能力标签显示
- 高级搜索补排除词、时长、社团、声优、标签
- `/continue` 新增最常播放
- 启动脚本补 `db push` 同步逻辑
- 真实验收过程中发现 `_count` 聚合在 Prisma 5.0.0 下不稳定，最终在 `c6604a1` 改为原始 SQL `COUNT(*)`
- 最终通过真实页面确认：
  - `/works` 高级筛选可用
  - `/continue` “最常播放”显示 `2 / 1`

### 文档收口

- 更新 `README.md`
- 更新 `docs/PROJECT_HANDOFF_ZH.md`
- 更新 `docs/PROJECT_FEATURE_DOC_ZH.md`
- 更新 `docs/WORKLOG_ZH.md`
- 新增 `docs/PHASE10_ONEPASS_TASKLIST_ZH.md`
- 更新 `ARSM_NEXT_PHASE.md`、`WORKLIST.md`、`PROJECT_PLAN.md`
