# Narrate · 叙 — Halo 2 主题移植说明

本文档记录将 Typecho 主题 **Narrate · 叙**（源目录 `C:\Users\19002\Documents\Trae\Narrate`）移植为 Halo 2 主题 `halo-theme-narrate` 的完整过程、配置项改造、验证结果与注意事项。

- 主题版本：`1.0.0`
- 依赖 Halo：`>= 2.20.0`
- 构建方式：TypeScript + Vite（`@halo-dev/vite-plugin-halo-theme`）+ `theme-package`
- 源码目录：`src/`；构建产物：`templates/`、`dist/halo-theme-narrate-1.0.0.zip`

---

## 1. 目录结构

```
.
├── src/                     # 源码（唯一需要维护的目录）
│   ├── index.html           # 首页
│   ├── post.html            # 文章详情
│   ├── page.html            # 独立页面
│   ├── page_about.html      # 「关于」自定义页面模板
│   ├── archives.html        # 归档
│   ├── category.html        # 分类归档
│   ├── tag.html             # 标签归档
│   ├── author.html          # 作者归档
│   ├── categories.html      # 分类总览
│   ├── tags.html            # 标签总览
│   ├── links.html           # 友情链接（plugin-links 路由 /links）
│   ├── friends.html         # 朋友圈（plugin-friends 路由 /friends）
│   ├── error.html           # 错误页
│   ├── partials/            # 构建期片段（layout / sidebar）
│   ├── css/                 # style.css、font.css、本地字体
│   └── js/main.ts           # 全部前端交互（原生 TS，无 jQuery）
├── public/                  # 原样复制到 templates/（头像、highlight.js 本地资源）
├── templates/               # 构建产物，勿手改
├── theme.yaml
├── settings.yaml
└── screenshot.png
```

### 模板映射

| Typecho 源模板                      | Halo 模板                                    | 说明                                                      |
| ----------------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| `index.php`                         | `index.html`                                 | 首屏、精选、瞬间、分类导览                                |
| `post.php`                          | `post.html`                                  | 正文、目录、版权、上下篇、评论                            |
| `page.php`                          | `page.html`                                  | 独立页面 + 留言板模式                                     |
| `about.php`                         | `page_about.html`                            | 通过 `theme.yaml` 的 `customTemplates` 注册为「关于」模板 |
| `archive.php`                       | `category.html` / `tag.html` / `author.html` | 三类归档统一视觉                                          |
| `archives.php`                      | `archives.html`                              | 按年月归档                                                |
| `links.php`                         | `links.html`                                 | 由 `plugin-links` 提供 `/links` 路由与数据                |
| `friends.php`                       | `friends.html`                               | 由 `plugin-friends` 提供 `/friends` 路由与数据            |
| `public/include.php` + `footer.php` | `partials/layout.html`                       | 页头、页脚、主题初始化、`<halo:footer />`                 |
| `public/sidebar.php`                | `partials/sidebar.html`                      | 侧栏组件                                                  |
| `comments.php`                      | `<halo:comment>`                             | 交由 Halo 评论组件渲染                                    |

---

## 2. 资源迁移与清理

### 已迁移

| 资源                                  | 目标位置                                                                  | 说明                                       |
| ------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| `screenshot.png`                      | 项目根目录                                                                | 主题预览图                                 |
| `assets/img/avatar.jpg`               | `public/assets/images/avatar.jpg`                                         | 默认头像 / 关于页回退头像                  |
| `assets/css/font/JetBrainsMono.woff2` | `src/css/font/JetBrainsMono.woff2`                                        | 构建后输出到 `templates/assets/`，本地加载 |
| highlight.js                          | `public/assets/vendor/highlight.min.js` + `highlight-github-dark.min.css` | 原 CDN 改为本地资源，走主题静态资源路径    |
| 样式、SVG 图标、交互逻辑              | `src/css/style.css`、`src/js/main.ts`                                     | 全量迁移并适配                             |

### 已清理（未使用 / 冗余 / 不可用）

| 项目                                                                        | 处理方式                                                  |
| --------------------------------------------------------------------------- | --------------------------------------------------------- |
| `assets/js/jquery.min.js`、`view-image.min.js`                              | 删除；交互全部用原生 TS 重写                              |
| `assets/font/TsangerJinKai-Regular.ttf`（约 18 MB，未被引用）               | 删除                                                      |
| `assets/img/icpb.webp`（未被引用）                                          | 删除                                                      |
| `assets/img/favicon.ico`（与 avatar.jpg 内容重复）                          | 删除；favicon 由 Halo 系统设置统一管理                    |
| `Hangeuljaemin6.0 TTF` 字体引用（源主题未提供字体文件）                     | 统一替换为 `var(--font-sans)`，并补齐 `--font-serif` 变量 |
| 源 `font.css` 中无 `src` 的失效 `@font-face`                                | 重写：中文使用远程字体服务，等宽使用本地 JetBrains Mono   |
| 重复的 `.site-header` CSS 块                                                | 删除重复定义                                              |
| `.trae` 技能示例中未使用的 `src/js/*.ts`、`src/css/main.css`、默认 partials | 已删除，仅保留当前主题实际使用文件                        |

> 最终主题包约 0.26 MB，包含 13 个页面模板与本地字体/高亮资源。

---

## 3. 配置项改造

`settings.yaml` 共 **6 组 / 51 项**，全部映射到 `theme.config.<group>.<name>`：

### brand — 品牌与首屏

`site_slogan`、`brand_en`、`footer_tagline`、`hero_glyph`、`hero_kicker`、`hero_statement`（支持 `{rot}` 占位）、`hero_rot_words`

### home — 首页模块

`enable_moments`（开关，需安装「瞬间」插件）、`moment_limit`、`category_exclude_slugs`（回车分隔）、`greetings`（回车分隔）、`featured_flag`、`picks_title`、`picks_en`、`picks_sort`（荐读排序，默认留空 = 阅读量降序）、`picks_limit`（荐读数量，默认 4）、`moments_title`、`moments_en`、`moments_sub`、`cat_more_text`、`cat_default_desc`、`posts_anchor_text`、`archives_text`

> 所有多值文本配置统一使用**回车换行**分隔（时段问候语、首屏旋转词、分类导览排除、友链申请须知），每行一条即可；旧版逗号 / 顿号 / 竖线分隔的问候语与旋转词仍可兼容读取。`hero_statement` 中的 `{rot}` 标记旋转词位置（不足两词时保持静态）。
> 「编辑荐读」榜单由 `picks_sort` 控制：留空或未配置时按**阅读量降序**，也可切换为「最新发布」或「置顶优先」；`picks_limit` 控制展示条数。由于 Halo Finder 无法按 `stats.visit` 做服务端排序，主题先取 30 篇候选池，再由前端脚本按设置重排、剔除首屏焦点文章并截断；序号由 CSS 计数器生成，重排后自动连续。

### post — 文章页

`show_toc`、`enable_highlight`、`show_views`、`license_name`、`license_url`

### links — 链接与页脚

`footer_links_limit`、`beian_icp`、`police_icp`、`footer_copyright`

### page — 页面文案

`about_avatar`、`about_role`、`about_intro`、`about_contact`、`guestbook_intro`、`links_page_title`、`links_page_sub`、`links_apply_title`、`links_apply_rules`（按行拆分）、`friends_page_sub`

### style — 外观

`default_mode`（`system` / `light` / `dark`）、`accent_color`、`accent_color_dark`、`background_color`、`background_color_dark`、`content_width`（页面最大宽度，默认 1180）、`radius`、`font_sans`、`default_cover`

> 原 `content_width` 默认值为 720 且被误标为「正文最大宽度」，实际映射到页面容器宽度 `--maxw`；已改为默认 1180、标签「页面最大宽度」，正文阅读宽度固定 720px。

---

## 4. 硬编码扫描与处理

### 已配置化（通用文案 / 可配置内容）

- 首屏主张句、旋转词、眉题、背景巨字、品牌英文、页脚标语
- 首页问候语、精选角标、各区块标题与副标题、分类默认描述、按钮文案
- 文章目录开关、代码高亮开关、阅读量显示、版权协议名称/链接
- 页脚备案、版权、页脚友链数量
- 关于页头像/角色/简介/联系方式、留言板引导、友链页与朋友圈页文案
- 主题色（明/暗）、背景色（明/暗）、页面宽度、圆角、正文字体、默认封面
- 瞬间开关与展示数量、分类导览排除列表

### 保留为固定内容（已加注释标记）

- 结构性标签：`篇 / 类 / 标签 / 阅读 / 此刻 / 最新 / 目录 / 评论 / 上一篇 / 下一篇` 等
- 页面眉题：`ARCHIVE · 归档`、`CATEGORIES · 分类`、`BLOGROLL · 友情链接` 等
- 版权句式、错误页兜底说明、空状态文案
- 未配置 Halo 菜单时的默认导航（首页/归档/分类/标签）
- 未配置作者头像时的内置头像回退、未配置关于页头像时的回退

### 固定标识（不可配置，已加注释）

- `theme.yaml` 的 `metadata.name: halo-theme-narrate`（主题唯一标识，同时决定 `/themes/halo-theme-narrate/` 资源前缀）
- `settingName: narrate-setting`、`configMapName: narrate-configMap`
- `localStorage` 键 `narrate-theme`
- 评论扩展点固定写法 `<halo:comment group="content.halo.run" kind="Post|SinglePage">`

---

## 5. 前端交互（去 jQuery 重写）

`src/js/main.ts` 使用原生 TypeScript 实现：

主题切换（含首屏防闪烁内联脚本）、搜索（`PluginSearchWidget.open()`）、移动端导航、阅读进度、滚动浮现、数字滚动、时钟问候（`data-greetings`）、首屏旋转词（按回车分隔、逐条轮播）、瞬间横向滚动、友链分组筛选、相对时间、阅读时长（350 字/分钟）、正文图片懒加载 + `figure.post__image` 包装 + 原生灯箱、文章目录（TOC，无标题文章自动隐藏目录并居中正文）、友链卡片（host 补全/头像回退/在线点）、归档统计、代码高亮（本地 highlight.js）、验证码点击刷新。

---

## 6. 功能验证

### 已执行

| 项目                                                 | 结果                                                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `pnpm install`                                       | 通过                                                                                                |
| `pnpm build`（`tsc` + `vp build` + `theme-package`） | 通过，无 TS 错误                                                                                    |
| 构建产物                                             | 13 个页面模板 + `main-*.css` / `main-*.js` / 字体 / 头像 / vendor 资源齐全                          |
| 主题包                                               | `dist/halo-theme-narrate-1.0.0.zip`，约 0.26 MB                                                     |
| YAML 结构                                            | `theme.yaml`、`settings.yaml` 解析通过；6 组 51 项                                                  |
| 模板静态检查                                         | 无残留 `<include>`；`<halo:footer />`、`<halo:comment>` 均保留；`theme.config` 引用与设置项一一对应 |
| 资源路径                                             | 模板内资源由构建改为主题静态资源路径；highlight 仅在开启时代码页加载                                |

> 当前环境 Docker 守护进程未运行，没有可用的 Halo 实例，因此未执行浏览器端真机渲染验证。建议按下方清单在 Halo 2.20+ 环境完成一次人工验收。

### 人工验收清单

1. 上传 ZIP 或挂载到 `/themes/halo-theme-narrate`，在 Console 启用主题；
2. 首页：首屏旋转词、时钟问候、精选、编辑荐读（三种排序与数量截断）、瞬间、分类导览、分页；
3. 文章页：目录、代码高亮、图片灯箱、阅读量/时长、上下篇、评论；
4. 归档 / 分类 / 标签 / 作者 / 分类总览 / 标签总览页分页与空状态；
5. 「关于」页面选择自定义模板后，头像、统计、信息项正常；
6. 安装 `plugin-links` 后访问 `/links`；安装 `plugin-friends` 后访问 `/friends`；安装 `PluginSearchWidget` 后搜索按钮可用；
7. 明暗模式切换、刷新后保持；移动端导航与布局；
8. 后台主题设置修改颜色、宽度、文案后即时生效；
9. 浏览器控制台无报错，404 页面正常。

---

## 7. 已知差异与注意事项

1. **热门文章**：Halo Finder 不支持按访问量排序，侧栏「热门文章」改为展示最新文章（模板内已注释）。
2. **最新评论侧栏**：Halo 没有全局评论 Finder，已移除，改为「站点统计」。
3. **瞬间数据**：首页瞬间改为直接读取「瞬间」插件提供的 `momentFinder.list(1, n)`，不再依赖分类；主题设置中的开关 `enable_moments` 控制显隐，插件未安装时自动隐藏。详情链接使用插件路由 `/moments/{name}`，无需额外配置。注意「瞬间」插件自身要求 Halo `>= 2.26.0`。
4. **朋友圈**：RSS 聚交由 `plugin-friends` 插件实现，主题只负责渲染 `/friends`。
5. **友链**：仅读取 `plugin-links` 的 `linkFinder`；未安装插件时页脚友链列与侧栏「友情链接」组件整体不渲染（不再提供主题内置的回退清单）。
6. **友链申请**：表单提交至 `/links/apply/submit`，验证码来自 `/links/apply/captcha`，字段为 `displayName / url / logo / email / description / captcha`，与 `plugin-links` 的申请接口约定一致；如插件版本调整字段，需同步修改 `src/links.html`。
7. **搜索**：仅在检测到 `PluginSearchWidget` 插件时显示搜索入口。
8. **中文正文字体**：`src/css/font.css` 通过 `fontsapi.zeoseven.com` 加载 LXGW 975 Yuan SC，离线环境会回退到系统字体；可在主题设置 `style.font_sans` 中替换。
9. **截图打包**：`theme-package` 默认只打包 `templates/`、`*.yaml`、README、LICENSE，根目录 `screenshot.png` 不会进入 ZIP；如需在 Console 显示预览，可执行 `npx theme-package --all` 或手动向 ZIP 根目录补充截图。
10. **构建产物**：Halo 只读取 `templates/`，修改 `src/` 后必须重新 `pnpm build`。

---

## 8. 后续维护建议

1. 只修改 `src/`，构建后提交 `templates/` 与 `dist/` 由 CI 生成更佳；
2. 升级 Halo 后关注 Finder API 变更（尤其是 `postFinder.list` 新签名、菜单树 `children`）；
3. 新增文案优先放入 `settings.yaml` 对应分组，避免模板硬编码；
4. 插件适配以 `pluginFinder.available()` 做能力检测，未安装插件不应影响主题渲染；
5. 定期运行 `pnpm build` + 浏览器验收清单，重点检查评论组件、插件路由与暗色模式；
6. 如需多语言，可在 `templates/` 增加 `i18n/*.properties` 并替换固定文案。
