# ARSM

ARSM 是一个给个人使用的私人 ASMR / 音频媒体库系统。

当前 `v1.0.0` 已完成的核心能力：

- 本地音声目录导入
- 作品 / 曲目浏览与网页播放
- 收听进度与收藏
- 元数据补录
- 重复作品审查与合并
- `asmr.one` 采集任务化下载与自动导入
- acquisition provider 架构、任务视图、流程测试与文档

## 1.0 状态

当前版本可以视为：

> 面向私人使用的第一版可用系统。

它不是最终成品，但已经具备稳定使用和继续扩展的代码基线。

## 主要功能

### 前台

- 作品列表 `/works`
- 作品详情 `/works/[id]`
- 播放与继续收听
- 收藏 `/favorites`

### 后台

- 仓库管理 `/admin/repositories`
- 手动导入 `/admin/import`
- 采集任务 `/admin/acquisition`
- 元数据补录 `/admin/metadata`
- 任务状态 `/admin/jobs`
- 重复作品处理 `/admin/duplicates`

### 采集能力

- 输入 RJ 编号或 URL
- 自动识别 provider
- inspect 文件树
- 下载到本地目录
- 自动导入进 ARSM
- 任务列表与详情查看
- 下载 / 导入错误详情查看

## 快速开始

### 环境要求

- Node.js 20+
- pnpm
- ffmpeg / ffprobe

### 本地启动

```bash
pnpm install
copy .env.example .env
pnpm db:push
pnpm db:seed
pnpm dev
```

启动后访问：

- [http://localhost:3000](http://localhost:3000)

### Docker 启动

```bash
copy .env.example .env
docker compose up -d
```

## 常用命令

| 命令 | 用途 |
|---|---|
| `pnpm dev` | 启动开发环境 |
| `pnpm build` | 生产构建 |
| `pnpm test` | 运行测试 |
| `pnpm run typecheck` | TypeScript 检查 |
| `pnpm db:push` | 同步 Prisma schema |
| `pnpm db:seed` | 初始化管理员账号 |

## 文档入口

- [一页版快速上手](./docs/quick-start-zh.md)
- [详细使用说明](./docs/user-guide-zh.md)
- [1.0 发布说明](./docs/release-v1.0.0.md)
- [Acquisition 架构](./docs/acquisition-architecture.md)
- [Provider 接口说明](./docs/acquisition-provider-interface.md)
- [后台采集工作流](./docs/acquisition-admin-workflow.md)

## 测试与质量

截至 `v1.0.0`：

- 测试：`43/43` 通过
- 已完成 acquisition 流程测试
- 已补齐 acquisition 架构文档

## 后续方向

推荐后续优先级：

1. 第二个 provider
2. 字幕 / 转写 / 翻译后处理
3. 搜索增强
4. 安卓 / PWA / 桌面端体验加强

