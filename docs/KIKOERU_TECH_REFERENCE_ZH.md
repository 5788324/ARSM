# Kikoeru 生态系统技术参考

日期：2026-06-20

---

## 一、kikoeru-express Database Schema（关键表）

### t_work — 作品表

```sql
t_work:
  id           INTEGER PRIMARY KEY AUTOINCREMENT
  root_folder  VARCHAR NOT NULL
  dir          VARCHAR NOT NULL          -- 相对存储路径
  title        VARCHAR NOT NULL
  circle_id    INTEGER NOT NULL FK
  nsfw         BOOLEAN
  release      VARCHAR                   -- YYYY-MM-DD
  dl_count     INTEGER
  price        INTEGER
  review_count INTEGER
  rate_count   INTEGER
  rate_average_2dp FLOAT
  rate_count_detail  TEXT                -- JSON 评分分布
  rank              TEXT                -- JSON 历史排行
  lyric_status      VARCHAR NOT NULL    -- "" / "local" / "ai" / "local_ai"
  memo              JSON               -- 音频文件/时长/歌词映射
  created_at, updated_at
```

关键字段 ARSM 缺失：
- `rate_average_2dp` + `rate_count_detail` — 评分系统
- `lyric_status` — 字幕状态机
- `memo` — 元数据 JSON blob
- `rank` — 历史排行

### t_review — 用户评论/收藏表

```sql
t_review:
  user_name    VARCHAR NOT NULL FK(t_user)
  work_id      VARCHAR NOT NULL FK(t_work)
  rating       INTEGER                -- 1-5 星
  review_text  VARCHAR
  progress     VARCHAR                -- marked/listening/listened/replay/postponed
  created_at, updated_at
  PRIMARY KEY (user_name, work_id)
```

关键设计：review 同时承载**评分 + 评论 + 进度追踪**。

### t_translate_task — 分布式翻译任务

```sql
t_translate_task:
  id           INTEGER PRIMARY KEY AUTOINCREMENT
  work_id      INTEGER NOT NULL FK
  audio_path   VARCHAR NOT NULL
  status       INTEGER NOT NULL DEFAULT 0  -- 0:非法 1:待认领 2:翻译中 3:成功 4:失败
  worker_name  VARCHAR NOT NULL DEFAULT ""
  worker_status VARCHAR NOT NULL DEFAULT ""
  secret       VARCHAR NOT NULL DEFAULT ""  -- worker 认证密码
  created_at, updated_at
```

状态流:
```
0(非法) → 1(待认领, host 发布) → [worker 认领 + secret 匹配]
→ 2(翻译中, worker 更新进度) → 3(成功, .lrc 存入 config.lyricFolderDir)
                                → 4(失败)
```

### t_play_history — 播放历史（存完整队列状态）

```sql
t_play_history:
  user_name  VARCHAR NOT NULL
  work_id    INTEGER NOT NULL
  state      VARCHAR NOT NULL  -- JSON: 队列文件/播放序号/播放时间
```

---

## 二、KikoFlu Service 架构（44 个 Service）

### 字幕系统 (7 个)

| Service | 功能 |
|---------|------|
| `subtitle_availability_scanner` | 扫描作品是否有字幕文件 |
| `subtitle_database` | SQLite 字幕库 (全文索引) |
| `subtitle_library_rules` | 字幕匹配规则 (文件名/语言/格式) |
| `subtitle_library_service` | 字幕库 CRUD |
| `subtitle_library_tree` | 字幕文件树结构 |
| `subtitle_match_loader` | 从服务器加载匹配字幕 |
| `subtitle_matching` | 字幕-音频匹配算法 (基于文件名/元数据) |

### 播放器 (5 个)

| Service | 功能 |
|---------|------|
| `audio_player_service` | 核心播放器 (基于 just_audio) |
| `audio_playback_plan_builder` | 播放计划构建 (循环/队列/顺序) |
| `audio_track_queue_builder` | 曲目队列管理 |
| `audio_file_url_resolver` | 解析音频文件 URL |
| `audio_haptics_service` | 音频触感反馈 |

### 翻译 (4 个)

| Service | 后端 |
|---------|------|
| `translation_service` | 统一 facade |
| `llm_translator` | OpenAI/Claude |
| `microsoft_translator` | Azure Cognitive Services |
| `youdao_translator` | 有道翻译 API |

### 下载 (4 个)

| Service | 功能 |
|---------|------|
| `download_service` | 下载管理器 (并发/队列/暂停) |
| `download_path_service` | 下载路径管理 |
| `downloaded_file_state_scanner` | 已下载文件状态扫描 |
| `caching_stream_audio_source` | 流媒体缓存 |

### 其他关键 Service

| Service | 功能 |
|---------|------|
| `kikoeru_api_service` | 后端 API 客户端 (Dio + Bearer auth) |
| `local_work_metadata_service` | 本地元数据识别 |
| `offline_local_file_scanner` | 离线文件扫描 |
| `floating_lyric_service` | Android 悬浮歌词 (MethodChannel) |
| `file_name_translation_controller` | 文件名/文件夹名翻译 |
| `screen_awake_service` | 播放时保持屏幕常亮 |
| `log_service` | 应用内日志 (支持导出) |
| `storage_service` | 持久化存储 (SharedPreferences) |

---

## 三、kikoeru-express API 路由

| 路由 | 功能 |
|------|------|
| `auth.js` | 登录/注册 (JWT RFC 7519) |
| `config.js` | 用户配置 |
| `media.js` | 媒体流 |
| `metadata.js` | 元数据 CRUD |
| `play_history.js` | 播放历史 |
| `review.js` | 评论/评分/进度 (GET/POST) |
| `translate.js` | 翻译任务管理 |
| `version.js` | 版本检查 |

review.js 查询参数:
- `page`, `sort` (asc/desc)
- `order` (id/release/rating/dl_count/review_count/price/rate_average_2dp/nsfw)
- `filter` (marked/listening/listened/replay/postponed)

---

## 四、asmr.one 搜索架构

```
搜索入口: 顶部工具栏 combobox
搜索格式: keyword=RJ01593868 / tag=NTR / keyword=耳舐め
搜索结果显示: 标题 "Search by XXX" + 结果计数 + 标准作品列表
搜索持久化: 搜索词作为 chip (可删除)
```

---

## 五、ARSM 对标改进清单

### Schema 级改进

| 当前 ARSM | 建议改为 |
|-----------|---------|
| `Work.trackCount` | `Work.trackCount` + `rateAverage` + `rateCountDetail` + `lyricStatus` |
| `Track` 扁平列表 | `Track` + `children` 嵌套 (参考 KikoFlu) |
| `ListeningHistory` (单时间戳) | `ListeningHistory` + `Review.progress` (5 态) |
| 无翻译表 | `TranslateTask` (参考 kikoeru-express) |

### Service 级改进

| ARSM 当前 | 建议 |
|-----------|------|
| `import/service.ts` (239 行) | 拆分为 scan/import/subtitle/download service |
| 无字幕模块 | 参考 KikoFlu 7 个 subtitle service |
| 无翻译模块 | 参考 KikoFlu 4 个 translator + facade |
| 下载单顺序 | 参考 KikoFlu download_service (并发+队列+缓存) |
