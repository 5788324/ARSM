# ARSM 项目交接文档

日期：2026-06-21 | 提交：2284e69 | 状态：Phase 8 代码已完成，待真实交互验收

---

## 当前状态

Phase 1-8 的主要功能代码已经落地。当前 ARSM 已具备多用户结构下可长期使用的私人音频图书馆主链路：采集、导入、元数据补全、搜索、关系浏览、播放、字幕跟播、继续收听、个人评分、基础统计、管理员编辑、深色模式、启动器与 Docker。

### 已交付

- 采集：asmr.one Provider + runner + AcquisitionJob + 文件级进度可视化
- 导入：共享 import service + 重复检测 + 曲目分组 + 字幕识别
- 搜索：多字段搜索 + 排序 + 筛选 + 分页 + 地址栏状态同步
- 浏览：社团 / 声优 / 标签关系页
- 播放：全局播放器 + 队列 + 循环模式 + 倍速 + 续播
- 字幕：`.lrc/.vtt/.srt` 时间轴解析、跟播高亮、点击跳转、纯文本字幕阅读
- 首页：最近添加、最近采集、最近播放、统计、快捷入口
- 继续收听：收听记录页 + 基础统计口径修正
- 元数据：自动匹配 + 管理员手动编辑 + 手动重抓 asmr.one
- 用户数据：个人评分、收听历史、继续收听
- 角色分离：普通用户不再看到管理员字段与动作
- Phase 8：DLsite RJ-only inspect、PlayLog 累计时长链路、播放统计收口
- 测试：当前测试基线 63/63

### 当前限制

- DLsite 目前仅支持 inspect / 元数据级能力，不支持真实下载
- Phase 8 的播放统计虽然代码链路已闭合，但仍缺 4 条真实交互验收
- 字幕目前支持跟播与阅读，但不支持翻译、双语对照、AI 生成
- 尚无 Android / 桌面正式打包壳

---

## Phase 8 待验收

本轮最重要的未收口项不是代码，而是 4 条真实交互路径验证：

1. 播放 35 秒后暂停
2. 播放 35 秒后切下一首
3. 单曲循环完整跑一轮
4. 清空队列前先播放一段

详细步骤与预期见：
- `docs/PHASE8_VALIDATION_CHECKLIST_ZH.md`

---

## 当前建议优先级

### P1：先完成 Phase 8 真实交互验收
- 按验证清单跑完 4 条路径
- 确认 `/continue` 的总收听时长与真实播放一致
- 验收通过后再正式关闭 Phase 8

### P2：进入下一阶段规划
- 第二真实下载来源或第二元数据来源深化
- 统计页 / 个人页继续深化
- 浏览器级回归验收机制补强

### P3：远期能力
- 字幕翻译、双语显示、AI 字幕生成
- PWA / Android / 桌面壳方案评估

---

## 启动方式

```bat
双击 启动ARSM.bat
打开 http://localhost:3000
默认账号：admin / admin
```

## 文档索引

| 文档 | 用途 |
|------|------|
| README.md | 项目首页 |
| docs/user-guide-zh.md | 用户指南 |
| docs/PROJECT_FEATURE_DOC_ZH.md | 功能文档 |
| docs/WORKLOG_ZH.md | 工作日志 |
| ARSM_NEXT_PHASE.md | 下一阶段路线 |
| WORKLIST.md | 工作清单 |
| PROJECT_PLAN.md | 项目计划 |
| docs/PHASE8_ONEPASS_TASKLIST_ZH.md | Phase 8 开发任务单 |
| docs/PHASE8_VALIDATION_CHECKLIST_ZH.md | Phase 8 真实交互验收清单 |