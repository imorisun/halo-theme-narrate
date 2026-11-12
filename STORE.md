# Narrate · 叙 — Halo 应用市场提交资料

> 本文件用于上架提交与自查，不随主题 ZIP 分发。可直接复制表格中的文案到 Halo 应用市场表单。
>
> 当前状态：**资料与制品已准备；演示站已在 Halo 2.27.2 上完成主要页面验证，商店应用 ID 已配置。待补充预览截图，并完成安装/卸载与窄屏实机验收。**

## 1. 应用基本信息

| 表单字段      | 填写内容                                                                             | 说明                                              |
| ------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| 应用类型      | 主题                                                                                 | 前台博客主题，不含后端代码                        |
| 应用名称      | `Narrate · 叙`                                                                       | 与 `theme.yaml` 的 `spec.displayName` 一致        |
| 简介          | `简约、优雅、阅读优先的编辑杂志风博客主题，支持深色模式、首页精选、瞬间与插件页面。` | 43 字，概括定位与核心能力                         |
| Logo          | `icon.png`（512×512 PNG，圆角透明）                                                  | 另附 `icon-400.png` 与矢量源文件 `icon.svg`       |
| 分类          | 博客 / 个人网站                                                                      | 商店若有固定分类，以平台选项为准                  |
| 标签          | 极简、杂志排版、阅读优先、深色模式、响应式、中文、个人博客                           | 建议控制在 5–8 个                                 |
| 当前版本      | `1.0.0`                                                                              | 与 `theme.yaml` 的 `spec.version`、ZIP 文件名一致 |
| 商店应用 ID   | `app-ewy4rn2c`                                                                       | 已写入 `theme.yaml` 的 `metadata.annotations`     |
| Halo 兼容范围 | `>=2.22.0`                                                                           | 使用了 2.22 引入的 `array` 设置组件               |
| 许可证        | `GPL-3.0`                                                                            | 仓库根目录已包含完整 `LICENSE`                    |
| 开源仓库      | `https://github.com/imorisun/halo-theme-narrate`                                     | 公开可访问                                        |
| 主页          | `https://github.com/imorisun/halo-theme-narrate#readme`                              | 与 README 一致                                    |
| 问题反馈      | `https://github.com/imorisun/halo-theme-narrate/issues`                              | 可接收审核与用户反馈                              |
| 作者          | `晨阳` / `https://www.puresky.top/`                                                  | 与 `theme.yaml` 一致                              |
| 演示地址      | `https://www.puresky.top/`                                                           | 已确认运行本主题，Halo 2.27.2                     |
| 定价          | 免费                                                                                 | 当前自助上架仅支持免费应用                        |
| 制品          | `dist/halo-theme-narrate-1.0.0.zip`                                                  | 0.77 MB，根目录直接包含 `theme.yaml`              |

## 2. 详情页文案

详情页使用仓库根目录的 `README.md`，已按商店展示需要重写，包含：

1. 一句话定位与主题截图
2. 适用场景
3. 核心特性（编辑杂志风、文章阅读、页面与插件）
4. 安装步骤
5. 可选插件搭配表
6. 4 组 / 15 项主题设置说明
7. 使用注意事项
8. 常见问题
9. 兼容性
10. 更新日志
11. 开发与构建
12. 许可与致谢

README 同时适用于 GitHub 与 Halo 应用市场的 README 同步。若商店填写独立的「详情」字段，可直接粘贴 README 正文。

## 3. 分类与标签建议

- **主分类**：博客
- **辅助分类**：个人网站 / 写作
- **推荐标签**：极简、杂志排版、阅读优先、深色模式、响应式、中文、Typecho 移植

标签选择原则：优先描述可验证的视觉与功能特征，不使用「最佳」「官方」「第一」等无法证明的表述。

## 4. 版本说明（1.0.0）

```text
Narrate · 叙 1.0.0 首个正式版本。

- 完整移植 Typecho 主题 Narrate · 叙，并针对 Halo 2 重新实现模板、设置与插件页面。
- 提供 15 个模板：首页、文章、独立页面、关于、归档、分类总览/归档、标签总览/归档、作者、友链、朋友圈、瞬间列表/详情、错误页。
- 支持深色模式、首屏旋转词、分时段问候、编辑荐读、分类导览、文章目录、代码高亮、图片灯箱、阅读进度与阅读时长。
- 适配「瞬间」「链接管理」「朋友圈」「搜索组件」「评论组件」等插件的页面与入口；未安装插件时自动降级。
- 4 组主题设置：品牌与首屏、首页模块、文章与阅读、底部；提供在线中文字体开关。
- 要求 Halo >= 2.22.0。
```

## 5. 预览截图清单

商店列表封面展示比例约为 **800×436（约 1.835:1）**，详情页画廊建议统一为 **1600×900（16:9）**。截图必须来自真实运行界面，不要使用营销拼接图、浏览器外框或包含个人隐私的数据。演示站已具备真实文章、分类、瞬间与友链数据，可直接用于取图。

| #   | 页面与场景                         | 建议文件名                     | 尺寸     | 状态                       |
| --- | ---------------------------------- | ------------------------------ | -------- | -------------------------- |
| 0   | 首页封面（浅色，首屏 + 精选）      | `screenshot.png`               | 1126×597 | 已有；建议按 1600×872 重拍 |
| 1   | 首页浅色（含精选、荐读、分类导览） | `screenshot-01-home-light.png` | 1600×900 | 待补                       |
| 2   | 首页深色                           | `screenshot-02-home-dark.png`  | 1600×900 | 待补                       |
| 3   | 文章页（目录 + 代码块 + 版权）     | `screenshot-03-post.png`       | 1600×900 | 待补                       |
| 4   | 文章页深色或图片灯箱               | `screenshot-04-post-dark.png`  | 1600×900 | 待补                       |
| 5   | 瞬间列表 / 详情（含点赞与评论）    | `screenshot-05-moments.png`    | 1600×900 | 待补                       |
| 6   | 友链页（分组筛选与申请说明）       | `screenshot-06-links.png`      | 1600×900 | 待补                       |
| 7   | 关于页（头像、统计、正文）         | `screenshot-07-about.png`      | 1600×900 | 待补                       |
| 8   | 移动端首页（375×812 或 390×844）   | `screenshot-08-mobile.png`     | 原始尺寸 | 待补                       |

拍摄要求：

- 使用真实文章、分类、标签与图片，避免空白页或演示残留。
- 隐藏浏览器地址栏、书签栏、系统通知与个人信息；不要出现后台地址、Token 或访客隐私。
- 浅色与深色各至少一张；桌面与移动端各至少一张。
- 单张不超过 5 MB，优先 PNG；如需压缩可用 WebP（保持清晰度）。
- 截图内容必须与 README 描述一致，不展示尚未提供的功能。

## 6. 上架前自检

| 检查项                                   | 结果             | 说明                                                                                                          |
| ---------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `pnpm check`（格式化 / Lint / 类型检查） | 通过             | 无警告、无类型错误                                                                                            |
| `pnpm build`（构建 + 打包）              | 通过             | 生成 `dist/halo-theme-narrate-1.0.0.zip`                                                                      |
| ZIP 根目录结构                           | 通过             | 根目录直接包含 `theme.yaml`、`settings.yaml`、`templates/`、`README.md`、`LICENSE`、`screenshot.png`          |
| ZIP 不含源码 / 依赖 / 凭据               | 通过             | 未包含 `src/`、`node_modules/`、`.git/`、构建配置                                                             |
| 版本号一致性                             | 通过             | `theme.yaml`、ZIP 文件名均为 `1.0.0`                                                                          |
| 兼容范围格式                             | 通过             | `>=2.22.0`，无首尾空白                                                                                        |
| `theme.yaml` 必填字段                    | 通过             | `metadata.name`、`displayName`、`author`、`version`、`requires`、`license`、`homepage`、`repo`、`issues` 完整 |
| 设置项默认值                             | 通过             | 4 组 / 15 项均有默认值，布尔与数字含边界                                                                      |
| 模板完整性                               | 通过（静态检查） | 15 个模板覆盖首页、文章、页面、归档、分类、标签、作者、错误页及插件页面                                       |
| 静态资源引用                             | 通过             | 头像、highlight.js、字体均存在；CSS 无失效 `@import`                                                          |
| Thymeleaf 3.1 兼容                       | 通过（静态检查） | 未使用 `#request`、`#response`、`#session`、`#servletContext`                                                 |
| 外部资源披露                             | 通过             | 仅第三方字体服务 `fontsapi.zeoseven.com`，README 已说明且可在设置中关闭                                       |
| 安全自查                                 | 通过（静态检查） | 无硬编码密钥、无远程代码加载、无后端接口；外链均带 `rel="noopener noreferrer"`                                |
| 安装 / 启用 / 禁用 / 卸载                | **待实机验证**   | 需在 Halo 2.22.x 与 2.27.x 各执行一次                                                                         |
| 主要页面渲染                             | 通过（线上）     | Halo 2.27.2 演示站：首页、文章、归档、分类归档、标签归档、作者归档、瞬间、友链、关于、404 均返回 200          |
| 插件四态                                 | **部分通过**     | 已安装「瞬间」「链接管理」且页面正常；未安装「朋友圈」时 `/friends` 返回 404，属预期降级                      |
| 响应式与可访问性                         | **待实机验证**   | 桌面、平板、375px 窄屏；键盘导航、对比度、焦点可见                                                            |
| 浏览器 Console / Network                 | **待实机验证**   | 无未处理异常、无资源 404、无意外外部请求                                                                      |
| 预览截图                                 | **待补**         | 见第 5 节                                                                                                     |
| 演示地址                                 | 通过             | `https://www.puresky.top/`，Halo 2.27.2                                                                       |
| 商店应用 ID                              | 通过             | `app-ewy4rn2c`，已写入 `theme.yaml` 注解与 CD 工作流                                                          |
| 上游素材授权                             | **待确认**       | 内置 `avatar.jpg` 来自上游主题素材，需确认可分发；如不确定建议替换为中性占位图                                |

## 7. 审核说明（可粘贴到提交说明）

```text
主题名称：Narrate · 叙
版本：1.0.0
Halo 兼容范围：>=2.22.0
演示站点：https://www.puresky.top/（Halo 2.27.2）
许可证：GPL-3.0

来源说明：
本主题是 Typecho 主题《Narrate · 叙》（作者：晨阳，https://www.puresky.top/）的 Halo 2 移植版本，
不是对现有 Halo 主题的 Fork。移植过程中重写了 Thymeleaf 模板、Finder 调用、主题设置表单与插件页面，
并移除了原主题的 jQuery 依赖，改用原生 TypeScript。

外部服务：
主题默认从第三方字体服务 fontsapi.zeoseven.com 加载 LXGW 975 圆体，仅用于前台字体展示，
不收集访客数据。用户可在「主题设置 → 品牌与首屏」关闭，关闭后回退到系统字体。

数据与权限：
主题不包含后端代码、不读取或上传站点数据、不申请额外权限、不写入数据库结构。
主题设置保存在 Halo ConfigMap 中，升级不丢失，卸载不影响文章、页面、分类、标签等内容。

可选插件：
「瞬间」「链接管理」「朋友圈」「搜索组件」「评论组件」均为可选。未安装时对应页面或入口自动隐藏，
主题基础浏览功能不受影响。

已知限制：
- 主题界面文案为简体中文，未提供 i18n 资源。
- 主题不包含演示数据，安装后展示站点自身内容。
- 文章目录仅在正文包含 h2/h3 时显示。
```

## 8. 应用 ID 与持续发布配置

商店应用 ID `app-ewy4rn2c` 已写入 `theme.yaml`：

```yaml
metadata:
  annotations:
    "store.halo.run/app-id": "app-ewy4rn2c"
```

`.github/workflows/cd.yaml` 已切换至 `theme-cd.yaml@v5` 并启用应用市场发布：发布 GitHub Release 时会自动执行 `pnpm build`、上传 ZIP 到 Release，并同步到应用市场。

仍需完成：

1. 在 GitHub 仓库设置中添加 Topic：`halo-theme`。
2. 在 Halo 官网个人中心创建个人令牌，勾选「应用市场开发者 > 版本管理」，保存为 GitHub Secret `HALO_PAT`。
3. 确认 `theme.yaml` 的 `spec.logo` 指向的 `icon.png` 已推送到 `main` 分支。

## 9. 发布证据

```text
Commit: 56f1da9（本次改动待提交）
App ID: app-ewy4rn2c
Theme version: 1.0.0
Halo versions tested: 2.27.2（线上演示站）；2.22.x 待实机验证
Clean install: 待验证（演示站已运行本主题）
Upgrade from: 无（首个版本）
Commands run: pnpm exec vp check --fix；pnpm build
Routes checked: 线上验证 /、/archives、/archives/{post}、/categories、/categories/{slug}、/tags、/tags/{slug}、/authors/{id}、/moments、/links、/about、404；15 个模板静态检查
Optional plugins checked: 静态审查 PluginMoments / PluginLinks / PluginFriends / PluginSearchWidget / PluginCommentWidget
Known limitations: 简体中文界面；不含演示数据；可选插件未安装时对应页面不可用
Artifact path: dist/halo-theme-narrate-1.0.0.zip
Artifact SHA-256: 7BE3A565DA6430C5272C00B1491C86B5DAECD9E15F9B9D82C5C64B38B3B41BCF
```
