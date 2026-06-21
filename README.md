# ARSM

私人音频图书馆。支持从 `asmr.one` 采集作品、导入本地音声、网页播放、字幕跟播、个人评分与基础收听统计。

当前状态：**Phase 9 已验收通过，进入 Phase 10 规划。**

---

## 当前可用能力

- 自动采集：输入 RJ 编号，下载并自动导入
- 本地导入：扫描本地音声目录
- 全局播放器：队列、循环、倍速、续播
- 字幕：`.lrc/.vtt/.srt` 跟播，`.txt/.pdf` 阅读
- 作品库：搜索、排序、分页、高级筛选、URL 同步
- 关系页：社团 / 声优 / 标签
- 继续收听：最近播放、播放次数、收听作品数、总收听时长、最常播放
- 管理员元数据编辑与重抓
- 深色模式

---

## 当前限制

- DLsite 当前仅支持 `inspect-only`
- 统计页仍是基础版，不是完整个人中心
- 字幕翻译 / 双语 / AI 生成尚未实现
- 还没有 Android / 桌面壳

---

## 快速启动

### Windows

双击：

- `启动ARSM.bat`

默认打开：

- [http://localhost:3000](http://localhost:3000)

默认管理员账号：

- 用户名：`admin`
- 密码：`admin`

### 命令行

```bash
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

---

## 文档入口

- [用户指南](docs/user-guide-zh.md)
- [项目功能文档](docs/PROJECT_FEATURE_DOC_ZH.md)
- [项目交接文档](docs/PROJECT_HANDOFF_ZH.md)
- [工作日志](docs/WORKLOG_ZH.md)
- [下一阶段](ARSM_NEXT_PHASE.md)
- [工作清单](WORKLIST.md)
- [项目计划](PROJECT_PLAN.md)
- [Phase 10 任务单](docs/PHASE10_ONEPASS_TASKLIST_ZH.md)

---

## 下一步

下一阶段重点不是再补零散小 bug，而是做产品收口：

- 统计页产品化
- 采集页产品化
- 搜索体验深化
- 验收体系化
