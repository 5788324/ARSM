# ARSM Phase 9 一次性交付任务单（给 DeepSeek）

日期：2026-06-21
建议基线提交：`2284e69`
前置说明：Phase 8 代码已完成，但 `docs/PHASE8_VALIDATION_CHECKLIST_ZH.md` 中 4 条真实交互验收仍待后续人工或浏览器复验。Phase 9 开发不要回头重写播放器统计逻辑，除非验收时发现真实缺陷。

---

## 一、开发原则

1. 一次性交付，不要拆成很多碎轮次。
2. 保留多用户结构，不要退回单用户写死。
3. 不改技术栈，继续使用当前 ARSM：Next.js + TypeScript + Prisma + SQLite。
4. 只吸收 Gemini 内容里适合 ARSM 的能力，不重开 Python/Flet/VLC 新项目。
5. 所有新增能力必须同时有：后端逻辑、前端入口、可验证结果、文档同步。

---

## 二、Phase 9 目标范围

### A. 第二真实元数据来源 / DLsite 能力深化

目标：把当前 `DLsite inspect-only` 推进成真正对作品库有价值的能力。

至少完成以下之一：
- 完整接入 DLsite 元数据：标题、社团、标签、发售日、价格、封面、来源链接
- 或新增第二个真实元数据来源，并接入现有 metadata / acquisition 流程
- 或把 DLsite 的 inspect 结果做成可预览、可补全、可落库的完整闭环

要求：
- 不破坏 asmr.one 主链路
- 明确多来源下的 `workCode / sourceSite / sourceUrl / workSources` 策略
- 对 inspect-only provider 做清晰 UI 标记，不让用户误以为可下载

---

### B. 高级搜索能力

目标：把现有搜索升级成更适合 ASMR 资源的检索方式。

至少做到：
- 关键词 + 排除词
- 社团 / CV / 标签 联合筛选
- 是否有字幕 / 是否收藏 / 是否已评分 筛选
- 时长区间搜索

可选增强：
- 轻量高级语法，例如：
  - `护士 -中出`
  - `cv:秋野花 tag:舔耳`
  - `duration>60m`

要求：
- 前端有入口
- URL 状态可同步或至少可持久
- 不破坏现有简单搜索体验

---

### C. 个人统计面板深化

目标：把 `/continue` 从基础统计页推进成真正有用的个人面板。

至少做到：
- 最近完成
- 最常播放作品
- 最常播放曲目
- 最近播放时间线优化
- “继续收听”与“播放统计”职责分开

要求：
- 严格基于 `ListeningHistory + PlayLog` 真实口径
- 不引入伪统计
- 指标命名和实际口径一致

---

### D. 后台来源能力边界可视化

目标：降低后续使用和接手成本。

至少做到：
- 后台清楚显示 provider 是 `inspect-only` 还是 `download-capable`
- DLsite 当前能力边界要在 UI 中说明
- 采集页 / 元数据页 / 后台文档口径一致
- 清理误导性文案或状态标签

---

### E. 回归与验收补强

目标：把这次 Phase 8 浏览器验收受阻的问题，转成未来可复用的验收资产。

至少做到：
- 为 Phase 8 的 4 条路径补正式验收记录模板
- 为播放器累计时长链路补测试或半自动验证脚本
- 为高风险区增加回归覆盖：
  - 播放器统计
  - 评分
  - 权限分离
  - 字幕跟播
  - `/continue` 统计

要求：
- 自动化优先
- 允许保留人工验收清单
- 清楚区分“代码级通过”和“真实交互通过”

---

## 三、不要做的事

本阶段不要做：
- Python/Flet/VLC 技术栈重构
- 桌面绿色版主线重开
- Android 客户端
- AI 字幕翻译 / 自动转写
- 评论 / 社交功能
- 全站重新设计 UI 风格

这些都属于更后面的探索阶段。

---

## 四、验收标准

1. 第二真实元数据来源或 DLsite 能力，比 Phase 8 明显更完整。
2. 搜索能力至少新增 2-3 个真正有用的过滤/语法能力。
3. `/continue` 或个人统计面板至少新增 2-3 个可信指标。
4. Provider 能力边界在后台与文档中都清楚可见。
5. 回归测试数量继续增加，并明确覆盖范围。
6. 文档同步，构建通过，测试通过。

---

## 五、必须更新的文档

完成后必须同步更新：
- `docs/WORKLOG_ZH.md`
- `docs/PROJECT_HANDOFF_ZH.md`
- `ARSM_NEXT_PHASE.md`
- `WORKLIST.md`
- `PROJECT_PLAN.md`
- `README.md`
- `docs/PROJECT_FEATURE_DOC_ZH.md`
- `docs/user-guide-zh.md`

参考输入文档：
- `docs/GEMINI_TO_ARSM_REQUIREMENTS_ZH.md`
- `docs/PHASE8_VALIDATION_CHECKLIST_ZH.md`

---

## 六、交付输出格式

请按以下格式汇报：
1. 提交链
2. A/B/C/D/E 完成功能表
3. 数据模型 / provider / service / 搜索改动
4. 新增测试与验收记录
5. 风险与未做项

---

## 七、建议实现顺序

1. 先做来源深化（A）
2. 再做高级搜索（B）
3. 再做个人统计面板（C）
4. 再做后台提示与验收补强（D + E）
5. 最后统一文档收口