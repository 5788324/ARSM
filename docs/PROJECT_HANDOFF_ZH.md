# ARSM 项目交接文档

日期：2026-06-20 | 提交：`bd396ec`

---

## 当前项目状态

ARSM 已完成核心采集链路（asmr.one → 本地 → 导入），处于 **MVP+ 阶段**。

### ✅ 已稳定

- 采集系统：provider registry + runner + AcquisitionJob
- 导入系统：共享 import service + 重复检测 + review 队列
- 认证：admin/admin，JWT session 持久化
- 数据库：SQLite，15 模型
- 测试：43/43 通过
- 构建：零错误

### ⚠️ 已知限制

- 播放器简陋（原生 `<audio>`，无全局播放器）
- 曲目扁平列表（无子文件夹分组）
- 元数据需手动 fetch/apply
- 字幕系统未实现
- 12 处英语 UI 残留

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

## 如何使用

1. 登录 → 管理 → 📥 采集任务
2. 输入 RJ 编号（如 `RJ01593868`）→ 开始采集
3. 等待 inspect → download → import 完成
4. 作品库查看已导入作品

---

## 文档索引

| 文档 | 用途 |
|------|------|
| `PROJECT_FEATURE_DOC_ZH.md` | 完整功能清单 + 会议议程 |
| `ARSM_AUDIT_REPORT_ZH.md` | 全面审查报告（P1/P2/P3） |
| `ASMRONE_FEATURE_BENCHMARK_ZH.md` | asmr.one 功能对标 |
| `COMPETITOR_DEEP_DIVE_ZH.md` | 竞品分析 + UI 模式 |
| `DEEPSEEK_SESSION_LOG_2026-06-20_ZH.md` | 对话记录摘要 |
| `WORKLOG_ZH.md` | 持续工作日志 |
| `acquisition-architecture.md` | 采集系统架构 |
| `acquisition-provider-interface.md` | 如何接第二个 provider |
| `acquisition-admin-workflow.md` | 管理面板交互流程 |
| `ARSM_NEXT_UI_PLAYER_METADATA_TASKLIST_ZH.md` | 下一阶段任务单（Codex） |

---

## 已知问题

见 `ARSM_AUDIT_REPORT_ZH.md`：
- P1 Bug x 3（死搜索框、除零、虚设 DLsite 选项）
- P2 英语残留 x 9
- P3 优化 x 2

---

## 下一阶段

见 `ARSM_NEXT_UI_PLAYER_METADATA_TASKLIST_ZH.md`：
- Phase A：采集进度可视化
- Phase B：曲目子文件夹分组
- Phase C：全局播放器
- Phase D：元数据自动匹配
- Phase E：字幕/台本系统
