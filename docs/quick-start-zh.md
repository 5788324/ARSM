# ARSM 一页版快速上手

## 这是什么

ARSM 是一个给你自己用的私人 ASMR / 音频媒体库。

你现在最常用的功能只有两种：

1. 把你本地已有的音声导进去
2. 从 `asmr.one` 抓作品并自动导入

## 第一次启动

### 1. 安装依赖

```bash
pnpm install
copy .env.example .env
pnpm db:push
pnpm db:seed
pnpm dev
```

### 2. 打开网页

- [http://localhost:3000](http://localhost:3000)

### 3. 先登录

默认管理员账号请看你自己的 `.env` / seed 配置。

## 你最先该怎么用

### 方案 A：你已经有本地音声文件

1. 打开 `/admin/repositories`
2. 配置本地仓库目录
3. 打开 `/admin/import`
4. 扫描并导入目录
5. 去 `/admin/jobs` 看结果
6. 去 `/works` 浏览和播放

### 方案 B：你想从 asmr.one 抓作品

1. 打开 `/admin/acquisition`
2. 选择来源 `asmrone`
3. 输入 RJ 编号或作品 URL
4. 填下载目录
5. 保持“自动导入”开启
6. 点击开始采集
7. 在任务列表里等它跑完
8. 去 `/works` 看结果

## 常见后台页面是干嘛的

- `/admin/repositories`：管理本地仓库目录
- `/admin/import`：手动导入本地文件
- `/admin/acquisition`：创建采集任务
- `/admin/jobs`：看导入 / 元数据 / 错误状态
- `/admin/duplicates`：处理重复作品
- `/admin/metadata`：补作品元数据

## 采集任务状态怎么理解

- `等待中`：任务刚创建
- `探测中`：正在获取文件树
- `下载中`：正在下载作品文件
- `导入中`：正在导入到 ARSM
- `后处理`：未来给字幕/翻译预留
- `已完成`：主流程成功
- `部分失败`：成功了，但有部分文件或导入失败
- `待审查`：出现重复候选，需要你处理
- `失败`：任务整体失败

## 你现在已经能做什么

- 导入本地音声
- 浏览作品和曲目
- 网页播放
- 保存收听进度
- 收藏作品
- 补元数据
- 发现重复作品
- 从 asmr.one 自动采集并导入

## 如果出问题先看哪

1. `/admin/acquisition` 任务详情
2. `/admin/jobs`
3. `/admin/duplicates`

## 下一步看哪里

如果你想看更详细说明：

- [详细使用说明](./user-guide-zh.md)
- [1.0 发布说明](./release-v1.0.0.md)
