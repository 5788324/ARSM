# ARSM 项目交接文档

日期：2026-06-20
状态：Phase 4 准备开始

---

## 当前项目状态

ARSM 已完成核心采集链路（asmr.one → 本地 → 导入），当前处于 **MVP+ 到产品化过渡阶段**。

### 已稳定

- 采集系统：provider registry + runner + AcquisitionJob
- 导入系统：共享 import service + 重复检测 + review 队列
- 认证：admin/admin，JWT session 持久化
- 数据库：SQLite，15 模型
- 启动方式：`启动ARSM.bat` / `停止ARSM.bat`
- 数据库重建：`scripts/rebuild-library.ps1`
- 测试：43/43 通过
- 构建：通过

### 当前主要限制

- 采集任务缺少文件级进度显示
- 曲目仍是扁平列表，无子文件夹分组
- 播放器仍是原生 `<audio>`，没有全局底部播放器
- 元数据仍需手动 fetch/apply
- 字幕 / 台本系统未实现
- 仍有少量英语 UI 残留

---

## 启动与维护

### 启动

- 双击 `启动ARSM.bat`
- 浏览器打开 `http://localhost:3000`
- 默认账号：`admin / admin`

### 停止

- 双击 `停止ARSM.bat`

### 数据库重建

适用场景：
- 导入结构错误
- 旧作品记录污染
- 需要按当前顶级目录重扫

脚本：
- `scripts/rebuild-library.ps1`

数据库备份目录：
- `prisma/backups/`

---

## 文档入口

| 文档 | 用途 |
|------|------|
| `docs/PROJECT_FEATURE_DOC_ZH.md` | 功能清单与评审材料 |
| `docs/ARSM_AUDIT_REPORT_ZH.md` | 审查报告 |
| `docs/ASMRONE_FEATURE_BENCHMARK_ZH.md` | 对标 asmr.one |
| `docs/COMPETITOR_DEEP_DIVE_ZH.md` | 竞品分析 |
| `docs/DEEPSEEK_SESSION_LOG_2026-06-20_ZH.md` | 对话摘要 |
| `docs/WORKLOG_ZH.md` | 持续工作日志 |
| `docs/PHASE4_EXECUTION_TASKLIST_ZH.md` | Phase 4 执行任务单 |
| `ARSM_NEXT_PHASE.md` | 阶段路线与战略说明 |

---

## 当前权威顺序

当前继续开发时，优先参考顺序：

1. `docs/PROJECT_HANDOFF_ZH.md`
2. `docs/PHASE4_EXECUTION_TASKLIST_ZH.md`
3. `ARSM_NEXT_PHASE.md`
4. `WORKLIST.md`
5. `PROJECT_PLAN.md`

---

## 下一步

直接进入 Phase 4：
- Sprint A：采集进度可视化
- Sprint B：曲目子文件夹分组
- Sprint C：全局播放器基础版
- Sprint D：元数据自动匹配
- Sprint E：字幕 / 台本最小支撑
