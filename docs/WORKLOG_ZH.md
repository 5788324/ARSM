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
- 采集进度可视化（文件级进度条 + 展开列表）
- 曲目子文件夹分组（groupPath/groupLabel）
- 全局播放器（底部栏，倍速，自动续播）
- 元数据自动匹配（import 后 fetch asmr.one 补字段）
- 字幕/台本识别（TrackSubtitle，.vtt/.srt/.lrc/.txt/.pdf）

### 审查与收口
- 多轮 P1/P2 修复：正则、播放器闭包、进度计数、字幕落库、元数据自动匹配
- 启动器（启动ARSM.bat / 停止ARSM.bat）
- v1.0 文档链补齐

## 2026-06-20（晚上）

### Phase 5：产品化增强完成
- 作品库搜索、排序、筛选、分页
- 搜索地址栏同步：刷新不丢状态，链接可分享
- 关系浏览页：/circles/[id]、/voice-actors/[id]、/tags/[id]
- 播放器增强：队列面板、追加队列、移除、清空、循环模式、本地记忆
- 字幕文本阅读：点击字幕文件名弹窗读取 .txt/.vtt/.srt/.lrc
- 深色模式：ThemeToggle + SSR 安全初始化
- 登录守卫补齐、清空队列即停播、队列按钮闭环

### Phase 5 审查结论
- 最后缺口“/works 搜索状态同步到 URL”由 `0a42931` 收口
- Phase 5 完成，进入 Phase 6

## 2026-06-21

### Phase 6：体验深化交付
- 字幕时间轴解析：`.lrc/.vtt/.srt` → cue 列表
- 跟播字幕：自动高亮、自动滚动、点击字幕跳转播放位置
- 作品详情页重构：封面头区、信息层级、可折叠分组、字幕入口、队列按钮
- 首页升级：最近添加、最近采集、最近播放、统计、快捷入口
- 元数据编辑：管理员编辑标题/原标题/发售日，支持重抓 asmr.one
- 个人评分：`UserRating` 独立表，按用户存储
- 收听续听：首页补齐 `ListeningHistory` 的最近播放入口

### Phase 6 审查与修复链
- `0ec21fd`：修复评分共享、管理员权限、编辑入口、字幕跟播、多字幕切换、首页续听
- `eee9742`：修复详情页评分数据、首页 recent work 数据、字幕 viewer 重渲染问题、works URL 首帧同步
- `53ecc19`：评分接口独立、`isAdmin` 授权、保存后刷新
- `ec28073`：非管理员保存管理员字段时给出明确错误提示
- `01aebb8`：评分保存与管理员元数据保存拆开，避免普通用户被管理员接口误伤
- `446e0d8`、`13474d2`：后续全项目审查修复已合入当前分支

### 当前版本状态
- 采集闭环：inspect → download → import → metadata
- 使用闭环：搜索 → 浏览 → 播放 → 字幕跟播/阅读 → 最近播放 → 个人评分
- 阶段状态：Phase 6 已完成，文档待同步后进入 Phase 7
