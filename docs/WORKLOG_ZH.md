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

## 2026-06-20 (Morning-Afternoon)

### Phase 3: 系统化改造
- AcquisitionProvider 接口 + registry + runner
- AcquisitionJob Prisma 模型，Runner 迁移到 AcquisitionJob
- 共享 import service（runImport）
- 旧路由收口，/admin/acquisition 任务视图

### Phase 3B: 收口
- Runner 按 providerId 确定 provider
- 自动导入复用 runImport，groupByTop=true 修复导入拆散
- 兼容路由 inspect 不触发下载

### Phase 4: 播放体验 + 字幕
- Sprint A: 采集进度可视化（文件级进度条 + 展开列表）
- Sprint B: 曲目子文件夹分组（groupPath/groupLabel，14 种归一化）
- Sprint C: 全局播放器（React Context 底部栏，倍速，自动续播）
- Sprint D: 元数据自动匹配（import 后 fetch asmr.one 补字段 + tags + VAs）
- Sprint E: 字幕/台本识别（TrackSubtitle 模型，.vtt/.srt/.lrc/.txt/.pdf 自动分类落库）

### 文档与审查
- 多轮 P1/P2 修复：正则 / 播放器闭包 / 进度计数 / 字幕落库 / 元数据自动匹配
- 启动器（启动ARSM.bat / 停止ARSM.bat）
- 6 份新增文档 + 10 份更新
- 竞品分析（asmr.one / KikoFlu / kikoeru-express / neokikoeru）
- 用户指南，v1.0 发布说明

## 2026-06-20 (Evening)

### Phase 5: 产品化增强
- A: 作品库搜索 + 筛选（keyword/circle/VA/tag/subtitle/sort/page）
- B: 关系浏览页（/circles/[id], /voice-actors/[id], /tags/[id]）
- C: 播放器队列 + 模式（addToQueue, removeFromQueue, loopMode）
- D: 字幕文本阅读（/api/subtitles 读取 .txt/.vtt/.srt/.lrc）
- E: 深色模式（ThemeToggle + ThemeInit）+ Docker + 英语清理

### 当前状态
- 采集链路完整：inspect → download → import → metadata
- 搜索可用：多字段 + 筛选 + 分页
- 浏览可点：社团/声优/标签跳转关系页
- 播放器：队列 + 循环模式 + 记忆
- 字幕：识别 + 文本阅读
- 深色模式：一键切换
- 测试：43/43 通过
- 构建：零错误
