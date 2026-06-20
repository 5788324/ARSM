# ARSM 项目归档与交接总表

日期：2026-06-20
版本：v1.0.0
仓库：`https://github.com/5788324/ARSM`
发布页：[ARSM v1.0.0](https://github.com/5788324/ARSM/releases/tag/v1.0.0)

## 1. 项目一句话定义

ARSM 是一个给个人使用的私人 ASMR / 音频媒体库系统，支持本地导入、网页播放、元数据补录、重复审查，以及从 `asmr.one` 任务化采集并自动导入。

## 2. 当前完成状态

当前 `v1.0.0` 已完成：

- 本地音声目录导入
- 作品 / 曲目浏览与播放
- 收听进度与收藏
- 元数据补录
- 重复作品审查与合并
- `asmr.one` provider
- acquisition 任务化
- provider registry
- import 共享 service
- admin 采集任务视图
- acquisition 流程测试
- acquisition 架构文档

## 3. 关键入口页面

### 前台

- `/`
- `/works`
- `/works/[id]`
- `/favorites`
- `/login`

### 后台

- `/admin`
- `/admin/repositories`
- `/admin/import`
- `/admin/acquisition`
- `/admin/jobs`
- `/admin/duplicates`
- `/admin/metadata`

## 4. acquisition 当前工作方式

统一入口：

- `POST /api/acquisition/jobs`
- `GET /api/acquisition/jobs`
- `GET /api/acquisition/providers`

当前流程：

1. 创建 acquisition job
2. provider `inspect`
3. provider `download`
4. `runImport()` 自动导入
5. 写回 `AcquisitionJob`

兼容路由仍保留：

- `/api/acquisition/asmrone`

但它只是兼容旧调用，新逻辑应走统一 jobs API。

## 5. 关键代码位置

### acquisition

- `src/lib/acquisition/types.ts`
- `src/lib/acquisition/registry.ts`
- `src/lib/acquisition/runner.ts`
- `src/lib/acquisition/providers/asmrone.ts`
- `src/app/api/acquisition/jobs/route.ts`
- `src/app/api/acquisition/providers/route.ts`
- `src/app/api/acquisition/asmrone/route.ts`
- `src/app/admin/acquisition/page.tsx`

### import

- `src/lib/import/service.ts`
- `src/app/api/import/route.ts`

### 数据模型

- `prisma/schema.prisma`

## 6. 关键文档入口

### 面向使用

- `README.md`
- `docs/quick-start-zh.md`
- `docs/user-guide-zh.md`
- `docs/release-v1.0.0.md`

### 面向开发/接手

- `docs/acquisition-architecture.md`
- `docs/acquisition-provider-interface.md`
- `docs/acquisition-admin-workflow.md`

### 审查与路线资料

- `ARSM_NEXT_PHASE.md`
- `PROJECT_PLAN.md`
- `WORKLIST.md`
- `REVIEW_FIXLIST.md`

## 7. 当前质量状态

发布时已确认：

- `typecheck` 通过
- `test` 通过
- `build` 通过
- GitHub Release 已发布

测试基线：

- `43/43` 通过

## 8. 常用命令

```bash
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
pnpm test
pnpm run typecheck
pnpm build
```

## 9. 如果以后让别的 AI 接手，先看这些

推荐阅读顺序：

1. `README.md`
2. `docs/quick-start-zh.md`
3. `docs/user-guide-zh.md`
4. `docs/acquisition-architecture.md`
5. `docs/acquisition-provider-interface.md`
6. `docs/acquisition-admin-workflow.md`
7. `prisma/schema.prisma`
8. `src/lib/acquisition/runner.ts`
9. `src/lib/import/service.ts`

## 10. 后续最值得继续做的方向

按优先级建议：

1. 第二个 provider
2. 字幕 / 转写 / 翻译后处理
3. 搜索增强
4. 移动端 / PWA 强化
5. 桌面壳

## 11. 当前已知非阻塞技术债

- Turbopack tracing warning 仍在
- TypeScript 版本低于 Next.js 推荐值
- postprocess 仍为占位
- 当前只有一个真实 provider

## 12. 最终归档结论

当前 ARSM 可以作为一个正式的 `v1.0.0` 项目归档。

它已经不是验证原型，而是一套可用、可维护、可继续扩展的私人媒体库系统基线。
