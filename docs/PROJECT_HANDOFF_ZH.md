# ARSM 项目交接文档

日期：2026-06-20 | 提交：99e04d2 | 状态：Phase 5 第一轮已完成

---

## 当前状态

Phase 1-5 第一轮已完成。核心采集链路完整，产品化增强已落地。

### 已交付

- 采集：asmr.one Provider + runner + AcquisitionJob + 进度可视化
- 导入：共享 import service + 重复检测 + 分组 + 字幕识别
- 播放：全局播放器 + 队列 + 循环模式 + 倍速
- 搜索：多字段 + 筛选 + 分页
- 浏览：社团/声优/标签可点击 + 关系页
- 字幕：识别 + 文本阅读
- 主题：深色模式切换
- 元数据：自动匹配（采集后 fetch asmr.one）
- 测试：43/43 通过

### 当前限制

- 仅 asmr.one 单一采集来源
- 字幕无翻译
- 无评分/评论

---

## 启动

```
双击 启动ARSM.bat → http://localhost:3000 → admin / admin
```

## 文档索引

| 文档 | 用途 |
|------|------|
| README.md | 项目首页 |
| docs/user-guide-zh.md | 用户指南 |
| docs/PROJECT_FEATURE_DOC_ZH.md | 完整功能清单 |
| docs/RELEASE_NOTES_v1.0_ZH.md | v1.0 发布说明 |
| docs/WORKLOG_ZH.md | 工作日志 |
| ARSM_NEXT_PHASE.md | 下一阶段路线 |
| WORKLIST.md | 工作清单 |
| PROJECT_PLAN.md | 项目计划 |
