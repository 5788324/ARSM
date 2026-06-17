# ARSM 后续实施规格（给 DeepSeek）

## 1. 文档目的

这份文档不是产品介绍，而是给继续开发的人直接执行用的。

目标：

- 明确 ARSM 当前已经完成到什么程度
- 明确下一阶段不要乱改什么
- 明确每个阶段应该新增哪些模块、页面、任务、测试
- 明确每一阶段的完成标准

默认项目仓库：

- `G:\Hermes Agent\ARSM\ARSM`

---

## 2. 当前项目判断

当前可以视为：

- 第一阶段 MVP Beta 基本完成
- 已经能本地登录、导入、播放、管理、去重审查
- 可以继续做，但后续重点应该从“能跑”切换为“稳定、可维护、可扩展”

不要误判成“已经完全产品化”。

当前最重要的原则：

- 保持 ARSM 是私人音频库
- 不做公开镜像站
- 不做失控的全站爬虫
- 存储抽象要继续保持干净，方便本地盘 / OpenList / 以后其他仓库并存

---

## 3. 开发总顺序

建议严格按下面顺序推进：

1. 存储层加固
2. 元数据流程加固
3. 导入审查流程正式化
4. 播放体验增强
5. 定向采集模块
6. 字幕与翻译流水线
7. PWA / 桌面 / 安卓形态

原因：

- 前 3 项决定系统是不是能长期用
- 后 4 项是体验与能力扩展

---

## 4. 阶段 A：存储层加固

### 4.1 目标

把“仓库”真正做成能力抽象层，而不是只支持本地文件夹的半成品接口。

### 4.2 必做任务

- 给每个仓库驱动定义统一 capability：
  - `list`
  - `exists`
  - `stat`
  - `readStream`
  - `resolveCover`
- 给仓库层增加统一错误类型：
  - `AUTH_FAILED`
  - `PATH_INVALID`
  - `FILE_NOT_FOUND`
  - `TIMEOUT`
  - `UNSUPPORTED`
- 给 OpenList / WebDAV 场景补一套真实路径测试
- 所有仓库路径都做 normalize，避免：
  - 多余 `/`
  - Windows `\` 与 `/` 混用
  - 根路径重复拼接

### 4.3 推荐代码结构

- `src/lib/repositories/types.ts`
- `src/lib/repositories/capabilities.ts`
- `src/lib/repositories/errors.ts`
- `src/lib/repositories/adapters/local.ts`
- `src/lib/repositories/adapters/openlist.ts`

### 4.4 后台需要补的能力

- 仓库测试按钮
- 仓库健康状态显示
- 仓库错误详情展示

### 4.5 测试要求

- 本地仓库冒烟测试
- 路径 normalize 单元测试
- OpenList 适配层 mock 测试
- 播放接口对远程仓库的集成测试

### 4.6 完成标准

- 使用真实 OpenList 源也能稳定浏览和播放
- 仓库出错时后台能明确显示错误原因
- README 写清楚哪些仓库“生产可用”，哪些只是实验支持

---

## 5. 阶段 B：元数据流程加固

### 5.1 目标

把“拉元数据”从弱正则解析升级到可维护的 provider 架构。

### 5.2 必做任务

- 为不同来源拆出 provider：
  - `dlsite`
  - `asmr.one`
  - 以后可扩展其他来源
- 每个 provider 输出统一结果：
  - `title`
  - `originalTitle`
  - `workCode`
  - `circle`
  - `releaseDate`
  - `tags`
  - `voices`
  - `trackHints`
  - `coverUrl`
  - `confidence`

### 5.3 必须新增的 UI

- 元数据预览差异视图
- 字段级应用开关
- 仅覆盖空字段 / 强制覆盖 的模式切换

### 5.4 推荐代码结构

- `src/lib/metadata/provider.ts`
- `src/lib/metadata/providers/dlsite.ts`
- `src/lib/metadata/providers/asmrOne.ts`
- `src/lib/metadata/merge.ts`
- `src/lib/metadata/types.ts`

### 5.5 测试要求

- 每个 provider 至少 2 个 fixture
- 字段 merge 规则测试
- 空值覆盖与非空保护测试

### 5.6 完成标准

- 管理员能安全预览并应用元数据
- 错误解析不会静默污染已有数据
- 文档里有字段支持矩阵

---

## 6. 阶段 C：导入审查流程正式化

### 6.1 目标

把现在偏“附属页面”的审查功能，升级成完整工作流。

### 6.2 必做任务

- 将 review candidate 独立成正式模型与状态流转
- 支持动作：
  - 合并到已有作品
  - 保留为新作品
  - 忽略
  - 标记已处理
- 记录审查历史

### 6.3 推荐数据结构

- `ImportReview`
- `ImportReviewCandidate`
- `ImportReviewDecision`

建议状态：

- `pending`
- `matched`
- `merged`
- `kept_new`
- `ignored`
- `failed`

### 6.4 页面建议

- `/admin/reviews`
- 支持筛选：
  - 未处理
  - 已合并
  - 已忽略
  - 来源仓库
  - 导入时间

### 6.5 必做测试

- refresh 后审查数据不丢失
- 合并后关联轨道正确
- 错误分组时可以拆分修正

### 6.6 完成标准

- 大批量导入后可以分批处理
- 管理员不需要碰数据库即可解决重复与歧义

---

## 7. 阶段 D：播放体验增强

### 7.1 目标

把“能播放”做成“日常好用”。

### 7.2 必做任务

- 持久化 mini-player
- 上一首 / 下一首
- 队列 / 播放列表
- 更稳的进度恢复
- 移动端底部播放器交互优化

### 7.3 推荐增强

- 倍速
- 波形
- 桌面快捷键
- 连播后自动进入下一轨

### 7.4 完成标准

- 页面跳转不断播
- 手机端不是“勉强能点”，而是清晰可用

---

## 8. 阶段 E：定向采集模块

### 8.1 目标

支持用户手动输入一个作品编号或作品链接，执行受控采集。

### 8.2 当前明确需求

未来希望做到：

- 输入 `RJ01538000`
- 系统识别来源站点或由用户指定来源站点
- 采集该作品的元数据与媒体入口
- 下载到目标仓库
- 自动触发导入

### 8.3 强约束

- 只支持单作品、显式触发
- 不做整站爬取
- 不做后台无限队列
- 所有站点都要通过 provider 隔离

### 8.4 建议模块结构

- `src/lib/acquisition/types.ts`
- `src/lib/acquisition/provider.ts`
- `src/lib/acquisition/providers/asmrOne.ts`
- `src/lib/acquisition/jobs.ts`
- `src/lib/acquisition/download.ts`

### 8.5 后台页面建议

- `/admin/acquisition`

表单字段：

- 来源站点
- 作品编号或链接
- 目标仓库
- 目标路径
- 是否仅 dry-run

### 8.6 任务状态建议

- `queued`
- `resolving`
- `inspecting`
- `downloading`
- `importing`
- `done`
- `failed`

### 8.7 完成标准

- 管理员能手动提交单个作品采集任务
- 失败时看到具体失败环节
- 下载成功后能进入 ARSM 导入流程

---

## 9. 阶段 F：字幕与翻译流水线

### 9.1 目标

解决“很多作品没有中文字幕或只有日文字幕”这个实际使用问题。

### 9.2 必做顺序

1. 字幕文件发现与导入
2. 字幕结构化存储
3. 字幕预览
4. 翻译任务队列
5. 翻译结果回写

### 9.3 支持类型优先级

第一批先做：

- `vtt`
- `srt`
- `txt`

第二批再做：

- `pdf`
- 图片型文本材料

### 9.4 必做数据结构

- `SubtitleAsset`
- `SubtitleSegment`
- `TranslationJob`
- `TranslationResult`

### 9.5 完成标准

- 可导入原始字幕
- 可启动日译中任务
- 可查看原文与译文
- 时间轴字幕翻译后仍保持时间轴

---

## 10. 阶段 G：PWA / 桌面 / 安卓

### 10.1 推荐顺序

1. 先把 Web 做稳
2. 做 PWA
3. 再做桌面壳
4. 最后再考虑安卓原生

### 10.2 原因

- PWA 成本最低
- 桌面壳本质上只是包装现有 Web
- 安卓原生会带来后台音频、通知、权限、存储等额外复杂度

### 10.3 技术建议

- PWA：优先
- 桌面：Tauri 优先
- 安卓：如果只是包壳，可先 WebView；如果要更深能力，再评估 React Native / Flutter

---

## 11. DeepSeek 工作方式要求

后续每一轮开发都要附带：

- 改动摘要
- 新增页面截图
- 测试结果
- 已知限制
- 下一步建议

不要只说“完成了”，必须带证据。

---

## 12. DeepSeek 第一批实际开工任务

如果现在立刻继续，建议先做下面这一批：

1. OpenList 仓库适配能力矩阵
2. 仓库健康检查 UI
3. 元数据 provider 抽象
4. `asmr.one` 采集模块只做 dry-run inspector
5. 字幕模型设计，不急着先接 LLM

这是当前最稳的推进顺序。
