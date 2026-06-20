# ARSM 项目交接文档

日期：2026-06-20 | 提交：`3430f81` | 状态：Phase 4 已完成

---

## 当前项目状态

ARSM 处于 **v1.0 候选状态**。核心采集链路完整，播放体验已升级。

### 已完成

- 采集系统：provider registry + runner + AcquisitionJob
- 导入系统：共享 import service + 重复检测 + review 队列
- 认证：admin/admin，JWT session 持久化
- 全局播放器：底部固定栏，倍速 0.75x-2x，自动连续播放
- 曲目分组：按 mp3/wav/SEあり 等自动归类
- 字幕识别：.vtt/.srt/.lrc/.txt/.pdf 自动落库展示
- 元数据自动匹配：import 后 fetch asmr.one 补字段/tags/VAs
- 采集进度：文件级进度条 + 可展开列表
- 测试：43/43 通过
- 构建：零错误

### 当前限制

- 仅 asmr.one 单一采集来源
- 无评分/评论系统
- 字幕仅识别展示，无翻译
- 无 Docker 部署

---

## 启动方式

```
双击 启动ARSM.bat
  → seed admin 账号
  → 启动 dev server
  → 打开 http://localhost:3000
  → 用户名: admin  密码: admin

双击 停止ARSM.bat 停止服务
```

---

## 文档索引

| 文档 | 用途 |
|------|------|
| `README.md` | 项目首页 |
| `docs/user-guide-zh.md` | 用户指南 |
| `docs/PROJECT_FEATURE_DOC_ZH.md` | 完整功能清单 + 会议议程 |
| `docs/ARSM_AUDIT_REPORT_ZH.md` | 审查报告 |
| `docs/ASMRONE_FEATURE_BENCHMARK_ZH.md` | asmr.one 功能对标 |
| `docs/COMPETITOR_DEEP_DIVE_ZH.md` | 竞品分析 |
| `docs/KIKOERU_TECH_REFERENCE_ZH.md` | 技术参考 |
| `docs/WORKLOG_ZH.md` | 工作日志 |
| `ARSM_NEXT_PHASE.md` | 下一阶段路线 |
| `WORKLIST.md` | 工作清单 |
| `PROJECT_PLAN.md` | 项目计划 |

---

## Phase 5 方向（建议）

- 多源刮削（dlsite / hvdb）
- 字幕翻译（LLM API）
- Docker 部署
- 评分系统
- 深色模式切换
- 播放列表管理
