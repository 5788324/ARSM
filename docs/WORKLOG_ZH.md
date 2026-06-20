# ARSM 工作日志

> 持续维护日志。2026-06-17 起。

---

## 2026-06-17

- 项目初始化：Next.js 16 + TypeScript + Prisma 5 + SQLite + Tailwind 4 + NextAuth v5
- 15 模型 Prisma Schema，认证系统
- 首页 / 登录 / 作品库 / 收藏 / 管理面板
- 初次推送 GitHub

## 2026-06-18

- RepositoryAdapter（local/OpenList/WebDAV）
- 文件导入扫描器（递归 + ffprobe + CJK 重复检测）
- 元数据 provider + fetch/apply API
- 重复审查 / 任务监控 / 仓库管理 / 导入页面
- 全站中文化（主体）

## 2026-06-19

- asmr.one Provider 初版（guest API → inspect + download）
- 流式下载（Readable.fromWeb → pipeline → createWriteStream）
- 3 次重试 + 120s 超时，normalizeId 加固
- 统一 API 响应格式，import 状态三态化

## 2026-06-20（白天）

### Phase 3：采集系统系统化
- AcquisitionProvider 接口 + registry + runner
- AcquisitionJob Prisma 模型，Runner 迁移到 AcquisitionJob
- 共享 import service（runImport）
- 旧路由收口，/admin/acquisition 改为任务视图

### Phase 4：播放体验 + 字幕
- Sprint A：采集进度可视化（文件级进度条 + 展开列表）
- Sprint B：曲目子文件夹分组（groupPath/groupLabel，14 种归一化）
- Sprint C：全局播放器（React Context 底部栏，倍速，自动续播）
- Sprint D：元数据自动匹配（import 后 fetch asmr.one 补字段 + tags + VAs）
- Sprint E：字幕/台本识别（TrackSubtitle 模型，.vtt/.srt/.lrc/.txt/.pdf 自动分类落库）

### 审查与收口
- 多轮 P1/P2 修复：正则、播放器闭包、进度计数、字幕落库、元数据自动匹配
- 启动器（启动ARSM.bat / 停止ARSM.bat）
- v1.0 文档链补齐，交接、路线、工作日志统一

## 2026-06-20（晚上）

### Phase 5：产品化增强完成
- 作品库搜索：keyword / sort / subtitle / page 多状态联动
- 搜索地址栏同步：刷新不丢状态，链接可分享
- 关系浏览页：/circles/[id]、/voice-actors/[id]、/tags/[id]
- 播放器增强：队列面板、追加队列、移除、清空、循环模式、本地记忆
- 字幕文本阅读：点击字幕文件名弹窗读取 .txt/.vtt/.srt/.lrc
- 深色模式：ThemeToggle + SSR 安全初始化
- Works 与关系页登录守卫补齐
- clearQueue 停止音频、subtitle 可读、addToQueue UI 闭环

### Phase 5 审查结论
- 代码审查闭环完成
- 最后缺口“/works 搜索状态同步到 URL”由 `0a42931` 收口
- Phase 5 现已可视为完成，可进入 Phase 6

### 当前版本状态
- 采集闭环：inspect → download → import → metadata
- 使用闭环：搜索 → 浏览 → 播放 → 字幕阅读 → 继续播放
- 质量状态：当前分支已完成 Phase 5 收口，待同步文档并进入下一阶段开发
