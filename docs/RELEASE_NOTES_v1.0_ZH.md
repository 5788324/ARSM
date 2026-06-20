# ARSM v1.0 发布说明

日期：2026-06-20 | 提交：ee55c58

---

## 概述

ARSM v1.0 是一个私人同人音声图书馆。从 asmr.one 自动采集作品，本地私有化存储，Web 端播放管理。

---

## 核心功能

### 采集

- 输入 RJ 编号，一键下载 + 导入，文件级进度追踪
- 流式下载（不占内存），3 次重试 + 超时
- asmr.one API 集成（guest 认证）
- 采集后自动补全元数据（社团/声优/标签）

### 导入

- 本地文件夹扫描，自动识别音频 + 字幕文件
- CJK 滑窗重复检测，review 队列
- 按子文件夹自动分组（mp3/wav/有 SE/无 SE/特典 等）

### 播放

- 全局底部播放器，切页不中断
- 倍速播放（0.75x / 1x / 1.25x / 1.5x / 2x）
- 自动连续播放（曲目播完自动下一首）
- 曲目按分组展示

### 元数据

- 采集后自动从 asmr.one 补全标题/发售日/社团/标签/声优
- 手动 fetch/apply 元数据

### 字幕

- 自动识别 .vtt/.srt/.lrc/.txt/.pdf 字幕/台本文件
- 作品详情页展示字幕列表

---

## 技术栈

Next.js 16 · TypeScript · Prisma 5 · SQLite · NextAuth v5 · Tailwind CSS 4

---

## 启动

双击 启动ARSM.bat，浏览器打开 http://localhost:3000。用户名 admin，密码 admin。

---

## 当前限制

- 仅支持 asmr.one 单一采集来源
- 字幕仅识别展示，无翻译功能
- 无评分/评论系统
- 无 Docker 部署

---

## 测试

43/43 测试通过。构建零错误。

---

## 文档

| 文档 | 说明 |
|------|------|
| docs/user-guide-zh.md | 用户指南 |
| docs/PROJECT_FEATURE_DOC_ZH.md | 完整功能清单 |
| docs/PROJECT_HANDOFF_ZH.md | 交接文档 |
| docs/WORKLOG_ZH.md | 工作日志 |
| ARSM_NEXT_PHASE.md | 下一阶段路线 |
