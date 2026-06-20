# ARSM 项目全面审查报告

日期：2026-06-20

审查范围：所有页面、API 路由、核心库代码、数据库 Schema、测试

---

## P1 — 功能性 Bug（阻塞使用）

### 1. `/works` 搜索框是死的
- **文件**: `src/app/works/page.tsx:24-28`
- **问题**: `<input type="search">` 没有 onChange/onSubmit 处理，输入任何内容都不会触发搜索
- **影响**: 用户以为可以搜索，实际完全不起作用
- **建议**: 要么接入搜索 API，要么本阶段先删除这个输入框

### 2. 首页 `durationSec` 除零风险
- **文件**: `src/app/page.tsx:78-79`
- **代码**: `Math.min((h.positionSec / h.work.durationSec) * 100, 100)`
- **问题**: 如果 `durationSec` 为 0 或 undefined，会得到 `Infinity` 或 `NaN`
- **影响**: 进度条渲染异常，页面可能白屏
- **建议**: 加保护 `h.work.durationSec ? Math.min(...) : 0`

### 3. Metadata 页面 `DLsite` provider 不存在
- **文件**: `src/app/admin/metadata/page.tsx:76`
- **问题**: 下拉选项里有 "DLsite"，但实际没有 DLsite metadata provider 实现
- **影响**: 选择 DLsite 后点获取肯定报错
- **建议**: 删掉 DLsite 选项，或只留 "asmr.one"

---

## P2 — 英语 UI 残留（12 处）

| # | 文件 | 行号 | 当前 | 应为 |
|---|------|------|------|------|
| 1 | `favorites/page.tsx` | 77 | `{...} tracks` | `{...} 首曲目` |
| 2 | `works/[id]/page.tsx` | 121 | `{...} tracks ·` | `{...} 首曲目 ·` |
| 3 | `works/[id]/page.tsx` | 190 | `fetched {date}` | `获取于 {date}` |
| 4 | `admin/import/page.tsx` | 38 | `'Import failed'` | `'导入失败'` |
| 5 | `admin/import/page.tsx` | 126 | `...and N more` | `...还有 N 个` |
| 6 | `admin/metadata/page.tsx` | 49 | `'Fetch failed'` | `'获取失败'` |
| 7 | `admin/metadata/page.tsx` | 100 | `'Work Code'` | `'作品编号'` |
| 8 | `admin/metadata/page.tsx` | 137 | `Preview` | `预览` |
| 9 | `admin/metadata/page.tsx` | 149 | `Title:` | `标题：` |
| 10 | `layout.tsx` | 44 | `lang="zh-CN"` | ✅ 已修 |

---

## P2 — 代码质量问题

### 4. auth.ts 缺少 NEXTAUTH_SECRET
- **文件**: `.env` + `src/lib/auth.ts`
- **问题**: 没有配置 NEXTAUTH_SECRET，NextAuth 每次启动随机生成，导致旧 cookie 失效
- **影响**: 服务器重启后用户必须重新登录，体验差
- **建议**: 在 `.env` 中固定 `NEXTAUTH_SECRET=一个随机字符串`

### 5. import/service.ts 目录扫描粒度
- **文件**: `src/lib/import/service.ts:49-53`
- **问题**: `scanDirectory` 默认按直接父目录分组，对多层嵌套目录会一个子目录变成一个作品
- **影响**: 手动导入多级目录时可能仍然拆散。acquisition 端已通过 `groupByTop=true` 修复
- **建议**: 手动导入路径默认也改为按第一级分组，或者让用户选择

---

## P3 — 优化建议

### 6. runner 的 import 结果字段不完整
- **文件**: `src/lib/acquisition/runner.ts:164-169`
- **问题**: `progressJson` 里 `import` 字段包含 `errors`，但 `errorJson` 只在有错误时才写入
- **影响**: API 返回的 `progress` 已经包含 import 错误，但 `errorJson` 更权威。两者可能不一致

### 7. 测试覆盖缺口
- 已有测试：43 个（provider/resolver/import service/runner）
- 缺失：API 路由行为测试、前端页面交互测试、端到端采集流程测试
- **建议**: 不阻塞，后续可补

---

## 审查结论

| 类别 | 数量 | 状态 |
|------|------|------|
| P1 功能性 Bug | 3 | 需修 |
| P2 英语 UI 残留 | 9 | 需修 |
| P2 代码质量 | 2 | 建议修 |
| P3 优化建议 | 2 | 可延后 |

**整体评价**: 项目核心功能链路已打通，采集→下载→导入管线完整，43 个测试全通过。本轮发现的问题主要是 UI 英语残留和一个功能性死搜索框，修复工作量小（预计 30 分钟内），不涉及架构改动。
