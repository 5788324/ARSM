# asmr.one 采集模块研究与实现说明

## 1. 文档目的

这份文档专门写给继续实现 `asmr.one` 定向采集的人。

目标不是“现在就做成全自动下载器”，而是把已知线索、模块边界、实现顺序、失败点全部写清楚。

---

## 2. 当前明确需求

用户的真实诉求是：

- 输入一个作品编号，例如 `RJ01538000`
- 系统能定位到这个作品
- 能读取作品基础信息
- 如果站点当前会话允许下载，就抓到实际可下载媒体
- 下载后写入目标仓库，再导入 ARSM

这里只是一个下载源。

后面可能还有其他来源站点，所以绝对不要把逻辑写死在业务代码里。

---

## 3. 设计原则

- 只做单作品、显式触发
- 不做整站搜索爬虫
- 不做整站批量镜像
- provider 必须独立，后续可并列增加其他站点
- 先做 dry-run inspector，再做真实下载

---

## 4. 当前已确认的前端线索

通过站点前端脚本分析，已经确认页面不是把下载链接直接写死在 HTML 里的。

目前已确认的接口痕迹：

- 作品信息：
  - `/api/work/{id}`
- 曲目或媒体结构：
  - `/api/tracks/{id}?v=2`
- 封面：
  - `/api/cover/{id}.jpg`
- 媒体播放：
  - `/api/media/stream/{mediaId}?token={token}`
- 媒体下载：
  - `/api/media/download/{mediaId}?token={token}`

这说明：

- 下载按钮大概率不是静态直链
- 页面先拿到 work / tracks 数据
- 再根据媒体项与 token 生成 stream 或 download URL

### 新增确认：下载是“两段式”流程，不是单直链

根据最新浏览器截图，点击作品页“下载”后，并不是立刻开始浏览器普通下载，而是：

1. 先弹出站内的“创建下载任务”窗口
2. 用户可选择文件类型与具体文件树
3. 再点一次“下载”
4. 浏览器再弹出“选择此网站可以保存更多的位置 / 选择文件夹”窗口

这说明当前站点很可能不是：

- 返回一个现成的 zip 直链

而更可能是：

- 前端先枚举作品内的文件清单
- 然后使用浏览器的目录选择能力，把文件逐个保存到目标文件夹
- 底层可能使用 Chromium 的 File System Access API，例如 `showDirectoryPicker`
- 媒体文件本身仍然可能通过带 token 的接口逐个 `fetch`

因此，后续实现重点不应执着于“抓一个最终 href”，而应转为还原：

- 文件树数据从哪里来
- 每个文件对应的下载接口是什么
- token 如何注入到每个文件请求里
- 前端是如何批量保存多个文件的

---

## 5. 当前未确认的关键点

下面这些还没有完全抓到，需要 DeepSeek 继续做：

- `token` 到底从哪里来
- 下载按钮是“整作下载”还是“逐轨下载”
- 下载时是不是会走额外接口
- 是否必须依赖已登录浏览器会话
- 站点是否用了前端状态或签名流程
- 文件树清单接口是什么
- 目录选择后，浏览器端到底是逐文件保存还是服务端打包

这几项没有确认前，不要直接写死下载逻辑。

---

## 6. 推荐实现顺序

### 第 1 步：只做 work 解析

输入：

- `RJ01538000`
- 或 `https://www.asmr.one/work/RJ01538000`

输出：

- 规范化 workId
- 规范化作品 URL

建议接口：

- `normalizeAsmrOneInput(input): { workId, workUrl }`

---

### 第 2 步：做 dry-run inspector

dry-run 只做解析，不下载。

输出内容至少包括：

- 作品标题
- 封面地址
- 曲目列表
- 文件树结构
- 每个媒体项的 id
- 每个媒体项的可用性状态
- 是否探测到 token
- 是否可构造 download / stream URL

建议返回结构：

```ts
type AcquisitionInspectionResult = {
  provider: "asmrOne";
  workId: string;
  workUrl: string;
  title?: string;
  coverUrl?: string;
  fileTree?: Array<{
    path: string;
    type: "file" | "directory";
    size?: number | null;
    ext?: string | null;
    mediaId?: string | null;
  }>;
  tracks: Array<{
    id?: string;
    title?: string;
    duration?: number | null;
    mediaId?: string;
    streamUrl?: string | null;
    downloadUrl?: string | null;
    available: boolean;
    reason?: string | null;
  }>;
  tokenDetected: boolean;
  downloadable: boolean;
  errors: string[];
};
```

---

### 第 3 步：确认会话依赖

需要判断采集方式到底是哪一种：

方案 A：

- 服务器端 HTTP 请求即可完成

方案 B：

- 必须借助管理员浏览器登录态

如果是方案 B，就不要强行伪装成普通后端采集器，而应该明确做成：

- “管理员浏览器辅助采集”
- 或“粘贴浏览器导出的短期凭证”

---

### 第 4 步：做单作品下载器

只有 dry-run 稳定后才能做。

下载器职责：

- 读取 inspection 结果
- 逐个文件项下载
- 按作品目录写入目标仓库暂存目录
- 写完后触发导入

建议接口：

- `downloadAsmrOneWork(inspection, target)`

---

## 7. provider 抽象建议

建议不要把 `asmr.one` 逻辑直接写进路由。

应定义统一接口：

```ts
interface AcquisitionProvider {
  name: string;
  canHandle(input: string): boolean;
  normalize(input: string): Promise<{ id: string; url: string }>;
  inspect(input: string, ctx: AcquisitionContext): Promise<AcquisitionInspectionResult>;
  download?(result: AcquisitionInspectionResult, ctx: AcquisitionContext): Promise<DownloadResult>;
}
```

这样后面扩展别的站点时不会重写一遍管理逻辑。

---

## 8. 后台页面建议

建议新增：

- `/admin/acquisition`

页面应支持：

- 输入 RJ 编号或 URL
- 选择 provider
- 选择目标仓库
- dry-run 检查
- 查看 inspection 结果
- 如果 inspection 成功，再显示“开始下载”

inspection 结果里应额外展示：

- 作品总大小（如果能拿到）
- 文件类型分布，如 `mp3 / wav / jpg / txt`
- 文件树预览
- 是否需要浏览器登录态
- 是否已识别到逐文件下载能力

不要一上来只给一个“下载”按钮。

---

## 9. 数据库与任务建议

建议为采集任务单独建表：

- `AcquisitionJob`
- `AcquisitionJobLog`

状态建议：

- `queued`
- `resolving`
- `inspecting`
- `awaiting_auth`
- `downloading`
- `importing`
- `done`
- `failed`

日志建议记录：

- 输入参数
- 规范化结果
- 每一步请求结果摘要
- token 是否获取成功
- 每个媒体文件下载结果

---

## 10. 失败处理要求

失败时必须告诉用户具体失败在哪一步。

例如：

- 作品页不存在
- 未登录或会话失效
- 能读到作品信息，但拿不到 tracks
- 能读到 tracks，但拿不到文件树
- 能拿到 tracks，但没有 token
- 有 token，但媒体下载返回 403
- 文件下载中断
- 下载成功但导入失败

不要统一报“下载失败”。

---

## 11. 对当前浏览器研究结果的解释

本轮已经确认：

- 页面上有“下载”按钮
- 这个按钮不是直接写在静态 HTML 里的链接
- 点第一次“下载”会先弹出站内文件树选择窗口
- 点第二次“下载”后，浏览器弹出目录选择窗口，而不是普通单文件另存为
- 站点前端脚本里存在 `/api/media/download/{id}?token=...` 的 URL 构造逻辑

目前不能把“按钮一按就能直接拿到固定 zip 直链”当成事实。

更可能的真实情况是：

- 页面先拿到作品与曲目结构
- 页面再生成文件树选择视图
- 再由登录态或前端状态计算出 token
- 再逐个使用 token 构造真实文件下载请求
- 再通过浏览器目录写入能力把文件保存到用户选择的文件夹

所以 DeepSeek 应该优先做：

1. work 解析
2. tracks 解析
3. 文件树来源确认
4. token 来源确认
5. dry-run inspector
6. 单作品下载

---

## 12. 第一批实际开发任务

请按下面顺序做，不要跳步：

1. 定义 `AcquisitionProvider` 类型
2. 新建 `asmrOne` provider 空实现
3. 实现 `normalizeAsmrOneInput`
4. 实现 `inspect()`，先只返回 workId / URL / 基础解析结果
5. 增加 `/admin/acquisition` 页面，只做 dry-run
6. 保存 inspection 结果到任务日志
7. 补测试 fixture

第一批不要急着写真实下载。

---

## 13. 验收标准

第一阶段验收：

- 输入 `RJ01538000`
- 系统能生成规范化 URL
- 能记录 inspection 任务
- 能展示解析到的作品结构或明确失败点

第二阶段验收：

- 如果当前会话允许访问媒体
- 能生成可用 stream / download URL
- 能下载单个作品到目标仓库
- 能触发 ARSM 导入

---

## 14. 最后结论

`asmr.one` 这块可以做，但正确顺序一定是：

- 先做 provider 抽象
- 再做 dry-run inspector
- 最后才做真实下载

只要顺序对，后面扩展第 2、第 3 个来源站点时会轻松很多。
