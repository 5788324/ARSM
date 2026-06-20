# ARSM 详细使用说明

## 系统定位

ARSM 是一个给个人使用的私人 ASMR / 音频媒体库系统。

当前版本适合做这些事：

- 管理你自己的本地音声收藏
- 在网页中浏览与播放
- 导入本地目录
- 从 `asmr.one` 抓取作品并自动入库
- 处理重复作品
- 手动补元数据

## 前台页面

### `/works`

查看所有作品。

### `/works/[id]`

查看作品详情与曲目列表，并直接播放。

### `/favorites`

查看你的收藏作品。

## 后台页面

### `/admin/repositories`

作用：配置本地仓库目录。

你要先告诉系统：你的音声文件放在哪个目录下。

### `/admin/import`

作用：把本地目录扫描导入系统。

适合你已经手头有音声文件时使用。

### `/admin/acquisition`

作用：从 `asmr.one` 创建采集任务。

流程：

1. 输入 RJ 编号或 URL
2. 指定下载目录
3. 开始采集
4. 系统自动执行 inspect → download → import

### `/admin/jobs`

作用：看导入和元数据任务状态。

### `/admin/duplicates`

作用：处理系统识别出的重复作品。

### `/admin/metadata`

作用：手动补元数据。

## 采集任务怎么用

### 创建任务

在 `/admin/acquisition`：

1. 选择 provider
2. 输入 RJ 编号或 URL
3. 设置下载目录
4. 选择是否自动导入
5. 点击开始采集

### 查看任务

任务列表会显示：

- 来源
- 输入值
- 状态
- 当前步骤
- 创建时间

点开任务详情可看到：

- inspect 结果
- 下载统计
- 导入结果
- 错误详情

## 典型使用场景

### 场景 1：导入本地老库存

1. `/admin/repositories`
2. `/admin/import`
3. `/admin/jobs`
4. `/works`

### 场景 2：抓一个新作品

1. `/admin/acquisition`
2. 输入 RJ
3. 等任务完成
4. `/works` 查看

### 场景 3：发现重复作品

1. `/admin/jobs` 或 `/admin/duplicates`
2. 查看待审查候选
3. 决定是否合并

## 当前功能边界

当前版本已经有 acquisition 基础系统，但下面这些还属于后续增强：

- 第二个 provider
- 字幕抽取
- 音频转写
- 中文字幕翻译
- 全文搜索
- 更完善的手机端体验

## 推荐使用顺序

如果你现在开始自己用，建议这样：

1. 先把本地库导入一次
2. 试几个 `asmr.one` 采集任务
3. 熟悉 `/admin/jobs` 和 `/admin/duplicates`
4. 再考虑后续扩展功能
