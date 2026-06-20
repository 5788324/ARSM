# ARSM v1.0.0 发布说明

发布日期：2026-06-20

## 版本结论

`v1.0.0` 标志着 ARSM 完成了第一阶段可用系统建设。

当前版本已经不是单页 demo，而是一套可继续扩展的私人音频媒体库基线。

## 本版本包含的核心能力

### 媒体库基础能力

- 本地目录导入
- 作品 / 曲目浏览
- 网页播放
- 收藏
- 收听进度持久化

### 后台管理能力

- 仓库管理
- 手动导入
- 元数据补录
- 任务状态查看
- 重复作品审查与合并

### Acquisition 能力

- `asmr.one` provider
- acquisition 任务化
- provider registry
- 自动 inspect → download → import
- 任务视图与任务详情
- 错误信息记录

## 测试与质量

当前发布时：

- 测试总数：`43/43`
- acquisition 流程测试已补齐
- acquisition 架构文档已补齐

## 已知非阻塞项

- Turbopack tracing warning 仍存在
- TypeScript 版本低于 Next.js 推荐版本
- postprocess 仍为占位
- 当前只有 `asmr.one` 一个真实 provider

## 后续建议方向

1. 第二个 provider
2. 字幕 / 转写 / 翻译后处理
3. 搜索增强
4. 移动端 / 桌面端体验加强
