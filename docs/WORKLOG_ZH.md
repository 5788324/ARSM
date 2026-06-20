# ARSM 工作日志

> 持续维护日志。2026-06-17 起。

---

## 2026-06-17

- 项目初始化：Next.js 16 + TypeScript + Prisma 5 + SQLite + Tailwind 4 + NextAuth v5
- 15 模型 Prisma Schema
- 认证系统（Credentials + bcryptjs）
- 首页 / 登录 / 作品库 / 收藏 / 管理面板
- 初次推送 GitHub

---

## 2026-06-18

- RepositoryAdapter（local/OpenList/WebDAV）
- 文件导入扫描器（递归 + ffprobe + CJK 重复检测）
- 元数据 provider + fetch/apply API
- 重复审查 / 任务监控 / 仓库管理 / 导入页面
- 全站中文化（主体）
- vitest 18/18 测试通过

---

## 2026-06-19

- asmr.one Provider 初版（guest API → inspect + download）
- 流式下载（Readable.fromWeb → pipeline → createWriteStream）
- 3 次重试 + 120s 超时
- normalizeId 加固
- 统一 API 响应格式
- import 状态三态化

---

## 2026-06-20

### Phase 3: 系统化改造
- AcquisitionProvider 接口 + registry + runner
- AcquisitionJob Prisma 模型
- Runner 迁移到 AcquisitionJob
- 共享 import service（runImport）
- 旧路由收口
- /admin/acquisition 任务视图

### Phase 3B: 收口
- Runner 按 providerId 确定 provider
- 自动导入复用 runImport
- groupByTop=true 修复导入拆散
- 兼容路由 inspect 不触发下载

### Phase 4: 播放体验 + 字幕
- Sprint A: 采集进度可视化（文件级进度条 + 展开列表）
- Sprint B: 曲目子文件夹分组（groupPath/groupLabel，14 种归一化）
- Sprint C: 全局播放器（React Context 底部栏，倍速，自动续播）
- Sprint D: 元数据自动匹配（import 后 fetch asmr.one 补字段 + tags + VAs）
- Sprint E: 字幕/台本识别（TrackSubtitle 模型，.vtt/.srt/.lrc/.txt/.pdf 自动分类落库）

### 审查与修复
- 多轮 P1/P2 修复：正则 / 播放器闭包 / 进度计数 / 字幕落库 / 元数据自动匹配
- 启动器（启动ARSM.bat / 停止ARSM.bat）
- NEXTAUTH_SECRET 持久化

### 文档
- 6 份新增文档 + 10 份更新
- 竞品分析（asmr.one / KikoFlu / kikoeru-express / neokikoeru）
- 技术参考（kikoeru-express DB schema + KikoFlu 44 service）
- 用户指南（非开发者可读）

### 当前状态
- 采集链路完整：inspect → download → import → metadata auto-match
- 全局播放器：底部固定栏 + 倍速 + 连续播放
- 曲目分组：按子文件夹自动归类
- 字幕识别：.vtt/.srt/.lrc/.txt/.pdf 自动落库展示
- 测试：43/43 通过
- 构建：零错误
