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

## 2026-06-20

### Phase 3：采集系统系统化
- AcquisitionProvider 接口 + registry + runner
- AcquisitionJob Prisma 模型，Runner 迁移到 AcquisitionJob
- 共享 import service（runImport）
- 旧路由收口，/admin/acquisition 改为任务视图

### Phase 4：播放体验 + 字幕基础
- 采集进度可视化
- 曲目子文件夹分组
- 全局播放器
- 元数据自动匹配
- 字幕/台本识别

### Phase 5：产品化增强
- 作品库搜索、筛选、排序、分页、URL 同步
- 关系浏览页
- 队列、清空即停播、深色模式
- 字幕文本阅读
- 多轮审查与收口

## 2026-06-21

### Phase 6：体验深化
- 字幕时间轴解析：`.lrc/.vtt/.srt`
- 跟播字幕：自动高亮、自动滚动、点击跳转
- 作品详情页重构：封面头区、分组折叠、字幕入口、队列按钮
- 首页升级：最近添加、最近采集、最近播放、统计、快捷入口
- 元数据编辑：管理员编辑标题/原标题/发售日，支持重抓 asmr.one
- 个人评分：`UserRating` 独立表，按用户存储
- 收听续听：首页与继续收听页补齐 `ListeningHistory`

### Phase 6 审查修复链
- `0ec21fd`：评分共享、管理员权限、编辑入口、字幕跟播、多字幕切换、首页续听
- `eee9742`：详情页评分数据、首页数据、subtitle viewer 循环、works URL 首帧
- `53ecc19`：评分接口独立、`isAdmin` 授权、保存后刷新
- `ec28073`：非管理员保存管理员字段的错误提示
- `01aebb8`：评分保存与管理员元数据保存拆开
- `446e0d8`、`13474d2`：全项目审查修复已合入

### Phase 7：角色分离、测试与统计
- 普通用户 / 管理员界面分离：普通用户仅保留评分区，管理员保留完整编辑区
- 新增字幕解析测试：SRT / VTT / LRC / `findActiveCue`
- 继续收听页新增基础统计卡片
- 预留 `DLsiteProvider` stub，不注册、不影响现有 asmr.one 流程

### Phase 7 审查修复链
- `19c5058`：把误导性统计换成真实口径

### Phase 8：来源与统计深化
- `a3bd62c`：DLsite Provider、PlayLog 模型、smoke 测试
- `0a695cb`：DLsite RJ-only、inspect-only、PlayLog 接线、DLsite 测试
- `049f0d1`：播放次数与总收听时长统计口径调整
- `fca7ac1`：播放器 30 秒定时 / 暂停 / 清空等路径进度上报
- `f54f53e`：`deltaSec` 增量上报，修复累计翻倍
- `de310c7`：所有切歌入口统一 report + reset
- `2970b58`：单曲循环 onEnd report + reset
- `a69058c`：代码追踪方式复核 4 条统计路径，并补 `seek` 同步 `lastReportedSec`
- `2284e69`：修复 Prisma schema 中 `PlayLog` 缺失的反向关系，恢复项目可启动状态

### Phase 8 当前结论
- 代码实现：已完成
- 构建：通过
- 测试：63/63 通过
- 真实浏览器/人工交互验收：待完成
- 待验收路径见：`docs/PHASE8_VALIDATION_CHECKLIST_ZH.md`