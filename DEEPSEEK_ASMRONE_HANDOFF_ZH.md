# DeepSeek 交接包：asmr.one 接入 ARSM

## 1. 当前结论

`asmr.one` 这条链路已经不需要再从浏览器下载按钮继续逆向。

核心原因：

- 已确认站点是前后端分离
- 已确认可直接使用 API
- 已确认 `tracks` 接口直接返回每个文件的真实下载地址

所以后续 DeepSeek 不应该再把主要精力放在：

- HTML 爬虫
- 浏览器按钮事件逆向
- 系统“选择保存目录”窗口自动化

这些都已经不是主路线。

---

## 2. 已实测跑通的最小链路

### 2.1 登录

接口：

- `POST https://api.asmr-300.com/api/auth/me`

请求体：

```json
{
  "name": "guest",
  "password": "guest"
}
```

返回：

- token

后续请求头：

```text
Authorization: Bearer <token>
Origin: https://asmr.one
Referer: https://asmr.one/
User-Agent: Mozilla/5.0
```

### 2.2 作品信息

接口：

- `GET https://api.asmr-300.com/api/work/{id}`

示例：

- `GET https://api.asmr-300.com/api/work/01538000`

### 2.3 文件树与真实下载地址

接口：

- `GET https://api.asmr-300.com/api/tracks/{id}?v=2`

示例：

- `GET https://api.asmr-300.com/api/tracks/01538000?v=2`

返回中每个文件节点都可能直接带：

- `mediaDownloadUrl`
- `mediaStreamUrl`
- `streamLowQualityUrl`

这就是后续 `download()` 的核心输入。

---

## 3. 已经验证成功的事实

以下内容已经由 Codex 实测验证，不是猜测：

1. `RJ01538000` 可以通过 API 成功检索与解析
2. `tracks` 返回完整文件树
3. 文件树包含 36 个文件
4. 文件类型覆盖：
   - mp3
   - wav
   - jpg
   - txt
5. `README.txt` 的 `mediaDownloadUrl` 已经成功直接下载到本地

因此可以确认：

- `mediaDownloadUrl` 是真实可访问的下载地址

---

## 4. 已产出的交接文件

以下文件已经写入 ARSM 仓库，可直接读取：

- `scripts/asmr_one_api_prototype.py`
- `asmr_one_api_prototype_output.json`
- `ASMRONE_PROVIDER_RESEARCH_ZH.md`
- `ASMRONE_PROBE_NOTES_ZH.md`
- `asmr_one_rj01538000_probe_result.json`
- `DEEPSEEK_IMPLEMENTATION_SPEC_ZH.md`

其中最重要的是：

- `scripts/asmr_one_api_prototype.py`
- `asmr_one_api_prototype_output.json`

这两个文件代表：

- 原型代码
- 原型真实输出样本

---

## 5. DeepSeek 接下来该怎么做

建议直接按下面顺序执行。

### 第一步：把原型脚本逻辑迁移进 ARSM 的 provider

目标：

- 不再用独立脚本
- 将逻辑迁移到 ARSM 服务端代码

需要实现的能力：

- `normalize(input)`
- `inspect(input)`

`inspect()` 至少要返回：

- sourceId
- workId
- title
- release
- hasSubtitle
- fileCount
- files[]

每个文件项至少要返回：

- path
- type
- size
- mediaDownloadUrl
- mediaStreamUrl

### 第二步：后台加采集探针页面

新增页面建议：

- `/admin/acquisition`

表单字段：

- 来源：`asmr.one`
- 输入：`RJ01538000` 或作品 URL
- 模式：`inspect only`

页面输出：

- 作品标题
- 文件数
- 文件类型分布
- 文件树预览
- 总大小

### 第三步：再做真正下载

不要一上来就并入 ARSM 的正式导入流程。

先做一个纯下载版：

- 输入 sourceId
- 读取 inspect 结果
- 按 `path` 创建目录
- 按 `mediaDownloadUrl` 下载文件
- 每个文件单独记录成功/失败

建议先支持：

- 顺序下载
- 小并发下载
- 失败重试

### 第四步：下载成功后再接 ARSM import

当单作品下载稳定后，再接：

- 下载目录 -> ARSM repository import

不要把“探测、下载、导入”三个问题一次性混在一起做。

---

## 6. 技术实现要求

### 必须做

- provider 抽象
- inspect / download 分离
- 每文件级别日志
- 失败可重试
- 返回明确错误原因

### 不要做

- 不要继续依赖浏览器下载弹窗
- 不要写 HTML 爬虫
- 不要把来源逻辑散落在页面路由里
- 不要假设所有来源都和 `asmr.one` 一样

---

## 7. 当前风险点

虽然核心链路已经跑通，但下面这些仍需注意：

1. 文件站点域名有多种
   - `raw.kiko-play-niptan.one`
   - `fast.kiko-play-niptan.one`
   - `large.kiko-play-niptan.one`

2. 大文件下载可能出现：
   - EOF
   - 提前断连
   - CDN 波动

3. 因此正式下载器必须支持：
   - 重试
   - 断点续传预研
   - 下载结果校验

---

## 8. 建议的第一版验收标准

DeepSeek 第一轮不要贪大，满足下面就算合格：

1. 后台输入 `RJ01538000`
2. 成功返回作品信息
3. 成功返回 36 个文件的完整树
4. 可下载 `README.txt`
5. 可下载任意一个 MP3 文件到指定目录

只要这 5 项稳定，就说明整个 provider 方向是对的。

---

## 9. 第二版验收标准

第二轮再要求：

1. 单作品完整下载
2. 目录结构保持不变
3. 下载结果可重试
4. 下载完成后可接入 ARSM 导入

---

## 10. 最终建议

当前阶段最优选择不是继续逆向浏览器，而是：

- 直接把 API 原型收编成 ARSM 的 `asmr.one provider`

这条路已经被证实是最短、最稳、最适合集成的方案。
