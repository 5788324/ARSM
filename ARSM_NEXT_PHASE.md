# ARSM 下一阶段规划 — 第三次竞品深度分析整合版

日期：2026-06-20

竞品：neokikoeru / kikoeru-express (DB schema + 核心路由) / KikoFlu (44 个 service 文件)

---

## 新发现（前两次分析未覆盖）

### 1. kikoeru-express DB Schema — 翻译任务系统

```
t_translate_task:
  status: 0非法 → 1待认领 → 2翻译中 → 3成功 → 4失败
  worker_name + secret: 分布式 worker 认证机制
  输出: ${work_id}_${task_id}.lrc

t_work.lyric_status: "" / "local" / "ai" / "local_ai"
t_work.memo: JSON { audio_files, durations, lyric_mappings }
```

**结论**: kikoeru 的翻译是**分布式任务队列**，不是简单的 API 调用。ARSM 当前 postprocess 预留只是 stub，需参考这个架构。

### 2. kikoeru-express Review — 进度状态机

```
用户对作品的状态:
  marked → listening → listened → replay → postponed

GET /review?filter=marked&order=release&sort=desc
```

**结论**: 不只是"听过/没听过"，而是 5 态进度追踪。ARSM 的 ListeningHistory 只有时间戳，缺少这个维度。

### 3. KikoFlu Work 模型 — File Tree

```dart
class Work {
  List<AudioFile>? children;  // 嵌套文件树，不是平铺 tracks
  List<String>? images;       // 多张图片
  List<RatingDetail>? rateCountDetail; // 评分分布明细
  int? userRating;            // 当前用户评分
  String? progress;           // marked/listening/listened/replay/postponed
  String? otherLanguageEditionsInDb; // 其他语言版本
}
```

**结论**: KikoFlu 的音频是按**嵌套树**组织的（`children`），不是平铺。ARSM 的 Track 是扁平列表，曲目分组成倍落后。

### 4. KikoFlu 44 个 Service — 模块化架构

| 模块 | 服务数 | 关键 Service |
|------|--------|-------------|
| 字幕 | 7 | subtitle_database, subtitle_library, subtitle_matching, subtitle_match_loader |
| 播放器 | 5 | audio_player_service, audio_playback_plan_builder, audio_track_queue_builder |
| 翻译 | 4 | translation_service, llm_translator, ms_translator, youdao_translator |
| 下载 | 4 | download_service, download_path_service, caching_stream_audio_source |
| 音频触感 | 2 | audio_haptic_pattern, audio_haptics_service |

**结论**: ARSM 的 `import/service.ts` 一个文件相当于 KikoFlu 的 10+ 个 service。需模块化拆分。

### 5. KikoFlu 翻译架构 — 多后端

```dart
llm_translator.dart       // LLM (OpenAI/Claude)
microsoft_translator.dart  // Azure
youdao_translator.dart     // 有道
translation_service.dart   // 统一 facade
```

**结论**: 翻译应设计为可插拔后端，不是写死一个 API。

### 6. KikoFlu 悬浮歌词

```dart
floating_lyric_service.dart  // Android 悬浮窗
  - MethodChannel: com.kikoeru.flutter/floating_lyric
  - 触控穿透 (touch-through)
  - 可锁定/解锁
```

**结论**: ARSM PWA 无法实现悬浮窗（浏览器限制），需 Native 包装或 Electron/Tauri。

---

## 整合后完整功能矩阵

### 播放器

| 功能 | 来源 | 优先级 |
|------|------|--------|
| 全局底部播放器 | asmr.one + KikoFlu | P1 |
| 倍速 (0.5x-2x) | KikoFlu | P1 |
| 连续播放 | asmr.one | P1 |
| 循环模式 (单曲/列表/随机) | KikoFlu | P2 |
| 播放队列管理 | KikoFlu | P2 |
| 睡眠定时器 | KikoFlu | P3 |
| 音频触感反馈 | KikoFlu (Android) | P4 |

### 字幕

| 功能 | 来源 | 优先级 |
|------|------|--------|
| 导入时识别 .vtt/.srt/.lrc | KikoFlu | P1 |
| 字幕库 (SQLite 索引) | KikoFlu | P2 |
| 字幕编辑/调轴面板 | KikoFlu | P2 |
| LLM 翻译 (歌词/台词) | KikoFlu + kikoeru-express | P3 |
| 多翻译后端 (LLM/有道/微软) | KikoFlu | P3 |
| 分布式翻译任务队列 | kikoeru-express | P4 |
| 悬浮歌词 | KikoFlu (Android) | P4 |

### 浏览与发现

| 功能 | 来源 | 优先级 |
|------|------|--------|
| 高级搜索 (多标签/排除/多维) | KikoFlu + kikoeru-express | P2 |
| 评分系统 (1-5 + 分布明细) | KikoFlu | P2 |
| 5 态进度追踪 (marked→listened) | kikoeru-express | P2 |
| VA/社团可点击筛选 | asmr.one | P2 |
| 深色模式切换 | asmr.one + KikoFlu | P2 |
| 分页 + 排序 | asmr.one | P2 |
| 推荐系统 | KikoFlu | P3 |

### 数据模型

| 功能 | 来源 | 优先级 |
|------|------|--------|
| 嵌套文件树 (children) | KikoFlu Work 模型 | P1 |
| 多图 (images[]) | KikoFlu | P2 |
| 评分分布 (rateCountDetail) | KikoFlu + kikoeru-express | P2 |
| 进度状态 (progress) | kikoeru-express | P2 |
| hasSubtitle 展示 | asmr.one | P1 |
| TrackSubtitle 模型 | KikoFlu subtitle_database | P2 |
| 翻译任务表 | kikoeru-express | P4 |

### 采集

| 功能 | 来源 | 优先级 |
|------|------|--------|
| 进度可视化 (文件级) | asmr.one 下载页 | P1 |
| 并发下载 (2-3) | KikoFlu | P2 |
| 选择性下载 | KikoFlu | P3 |
| 多 scraper (dlsite/hvdb) | kikoeru-express | P3 |

### 部署与架构

| 功能 | 来源 | 优先级 |
|------|------|--------|
| Docker 部署 | neokikoeru | P2 |
| 模块化拆分 (类似 KikoFlu 44 services) | KikoFlu | P3 |
| 翻译 worker 分发 | kikoeru-express | P4 |

### UX

| 功能 | 来源 | 优先级 |
|------|------|--------|
| 防社死模式 | KikoFlu | P2 |
| 横屏播放 | KikoFlu | P3 |
| 国际化 (i18n) | KikoFlu (5语) | P4 |
| 自定义主题 | KikoFlu | P4 |

---

## 简化执行路线（给 Codex）

### Sprint 1 (Week 1-2): 播放器 + 分组 + 进度

1. 全局播放器（底部固定栏 + 倍速 + 连续播放）
2. 曲目按子文件夹分组（嵌套树渲染）
3. 采集进度可视化（文件级进度条）
4. hasSubtitle 标签展示

### Sprint 2 (Week 3-4): 搜索 + 评分 + 字幕识别

5. 修复搜索 → 高级搜索（多标签筛选）
6. 评分系统（1-5 星 + 分布）
7. 字幕文件识别（导入时不再跳过 .vtt/.srt）
8. 进度追踪（marked→listening→listened）

### Sprint 3 (Week 5-6): 翻译 + 并发 + 防社死

9. 字幕翻译（LLM API）
10. 并发下载管理
11. Docker 部署
12. 防社死模式 + 深色切换

---

## ARSM vs 竞品最终定位

| | ARSM 目标 | asmr.one | KikoFlu | kikoeru-express |
|---|-----------|----------|---------|-----------------|
| 核心定位 | **私有采集+播放** | 在线浏览 | 移动端播放器 | 后端服务 |
| 采集 | ✅ 自动 | ❌ | ❌ | ⚠️ 刮削元数据 |
| 存储 | ✅ 本地SQLite | ☁️ 云端 | 连接kikoeru后端 | ✅ 本地 |
| 播放 | 📋 开发中 | ✅ | ✅✅ 极好 | — |
| 字幕 | 📋 规划 | ⚠️ 展示 | ✅✅ 全系统 | ✅ 翻译队列 |
| 翻译 | 📋 规划 | ❌ | ✅✅ 多后端 | ✅ worker分发 |
| 移动端 | ⚠️ PWA | 📱 响应式 | ✅✅ 全平台原生 | — |

**ARSM 护城河**: 自动采集 + 私有存储 → 不需要依赖在线服务。即使 asmr.one 挂了，你的库还在。

**ARSM 最大短板**: 播放体验和字幕系统落后 KikoFlu 整整一代。优先补齐。
