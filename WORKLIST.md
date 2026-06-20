# ARSM 工作清单

日期：2026-06-20

---

## ✅ 已完成

- [x] 项目初始化（Next.js 16 + SQLite + All）
- [x] 认证系统（admin/admin）
- [x] 作品库 / 收藏 / 管理面板
- [x] 导入系统（扫描 + 重复检测 + review）
- [x] 元数据 fetch/apply
- [x] asmr.one Provider（API 采集）
- [x] 采集任务后台（一次点击全自动）
- [x] 共享 import service（API route + runner 共用）
- [x] 启动器（双击启动 + 一键停止）
- [x] 全面审查 + 竞品分析
- [x] 测试 43/43 通过

---

## 🔄 进行中

- [ ] 文档链补齐（SESSION_LOG / WORKLOG / HANDOFF / user-guide / README）

---

## 📋 下一批（P1）

- [ ] **采集进度可视化** — 文件级别进度条 [A1-A3]
  - 文件: `runner.ts`, `acquisition/page.tsx`
  - 负责人: Codex
- [ ] **曲目子文件夹分组** — mp3/wav/SEあり 分组渲染 [B1-B4]
  - 文件: `schema.prisma`, `import/service.ts`, `works/[id]/page.tsx`
  - 负责人: Codex
- [ ] **全局播放器** — 底部固定栏 + 播放队列 [C1-C3]
  - 文件: `components/player/*`, `layout.tsx`
  - 负责人: Codex
- [ ] **12 处英语 UI 残留修复** [P2]
  - 文件: favorites, works/[id], import, metadata 页面
  - 负责人: DeepSeek / 小修

---

## 📋 第二批（P2）

- [ ] 元数据自动匹配 [D1-D4]
- [ ] 字幕/台本识别与展示 [E1-E4]
- [ ] VA/社团 可点击筛选
- [ ] 作品列表分页
- [ ] 评分系统
- [ ] "带字幕"筛选
- [ ] 深色模式切换

---

## ⏸️ 暂缓（P3-P4）

- [ ] 播放列表管理
- [ ] 播放速度控制
- [ ] 热门作品推荐
- [ ] 评论系统
- [ ] AI 字幕生成（Whisper + LLM）
- [ ] DLsite 价格/销量
