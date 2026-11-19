# Narrate 主题代码与体验评估报告

> 评估对象：`halo-theme-narrate` v2.1.1（工作区当前未提交改动）
> 评估范围：`src/`、`theme.yaml`、`settings.yaml`、构建与仓库配置
> 评估方式：静态代码审查 + 构建产物分析（`pnpm exec vp check` 通过：36 个文件格式正确，4 个文件无 lint/类型错误）

## 一、现状概览

| 维度     | 现状                                                                                       |
| -------- | ------------------------------------------------------------------------------------------ |
| 技术栈   | Halo 2.27+ / Thymeleaf / Vite（vite-plus）/ TypeScript / Swup                              |
| 模板     | 17 个页面模板 + 3 个 partial，`include` 内联布局                                           |
| 样式     | 单文件 `src/css/style.css`，5072 行，构建后约 75.7 KB（未压缩）                            |
| 脚本     | 单文件 `src/js/main.ts`，1076 行，构建后约 58.9 KB（含 Swup 及插件）                       |
| 主题包   | `dist/halo-theme-narrate-2.1.1.zip` 约 9.09 MB，其中字体 174 个 woff2 共 8.42 MB           |
| 代码质量 | `vp check` 全绿；设计令牌、`focus-visible`、空状态、`prefers-reduced-motion`（部分）已具备 |

整体判断：**架构合理、视觉完成度高**，主要问题集中在少数交互状态缺陷、可访问性细节、两个超大源文件的可维护性，以及工程自动化的缺口。以下清单按优先级排列，均贴合现有技术栈，不引入新框架。

---

## 二、P0：建议优先修复（正确性 / 可访问性）

### P0-1 灯箱关闭后滚动锁状态残留

- 位置：`src/js/main.ts` 第 404–407 行（`close()`）、442–444 行（`setLightboxScrollLock`）、468 行
- 问题：关闭按钮 / 点击遮罩 / Esc 走的是内部 `close()`，只移除了 `open` 与 `lightbox-open` 类，没有调用 `setLightboxScrollLock(false)`，也没有重置 `lightboxScrollLocked`。再次打开灯箱时，`setLightboxScrollLock(true)` 在 444 行提前返回，结果是：**背景可以滚动、`padding-right` 却一直保留**（页面右侧留白、滚动穿透）。
- 收益：修复明确的交互缺陷，避免二次打开灯箱时布局跳动与滚动穿透。
- 建议：让内部 `close()` 直接复用 `closeLightbox()`（其已正确解锁），删除重复的 `classList.remove("lightbox-open")`；或在 `close()` 中显式调用 `setLightboxScrollLock(false)`。改动不超过 5 行。

### P0-2 分类 / 标签 / 作者页出现嵌套 `<main>`，且缺少 `<h1>`

- 位置：`src/partials/layout.html` 第 173 行；`src/category.html` 第 31 行；`src/tag.html` 第 28 行；`src/author.html` 第 43 行
- 问题一：布局层已有 `<main id="swup">`，三个页面模板内部又写了 `<main class="cat-list">`，形成非法嵌套的 main landmark。
- 问题二：`category.html` 与 `tag.html` 的页面标题是 `<div class="cat-hero__title">`（第 11 行），整页没有 `h1`；`moment.html` 也没有任何 `h1`，只有头像、作者与正文。
- 收益：修复 HTML 语义与屏幕阅读器地标结构，同时补足分类/标签/瞬间详情页的 SEO 标题层级。
- 建议：三处内层 `<main>` 改为 `<div>`；把 `.cat-hero__title` 改为 `<h1>`（现有 class 不变，`<em>` 可保留在 `h1` 内）；`moment.html` 增加页面级 `h1`（可用视觉隐藏样式，或直接将瞬间摘要首句作为标题）。CSS 无需重写。

### P0-3 减少动效偏好覆盖不完整

- 位置：`src/css/style.css` 第 222–232 行；动画定义在 414（`pulse`）、453（`rotIn`）、565（`scrollHint`）、2045（页面入场）
- 问题：`prefers-reduced-motion` 只关闭了浮现动画与旋转词，首屏脉冲点、滚动提示、旋转词入场、Swup 页面入场仍在播放。对前庭功能敏感用户不友好。
- 收益：完整满足动效偏好；也减少低端设备上的持续动画开销。
- 建议：在该媒体查询中追加 `animation: none` 覆盖上述 4 处（选择器分别为 `.pulse`、`.rot span`、`.hero__scroll::after`、`.transition-main`），并保留 `transition: none`。这是纯 CSS 修改。

### P0-4 移动端菜单可访问性不足

- 位置：`src/js/main.ts` 第 101–113 行；`src/partials/layout.html` 第 79、153 行；`main.ts` 第 921 行起
- 问题：`#navToggle` 没有 `aria-controls="nav"`；菜单打开后不响应 Esc、点击外部、窗口放大到桌面宽度；`initNavActive` 只加 `.active`，没有 `aria-current="page"`。
- 收益：键盘与读屏用户可预期地开关菜单，减少移动端菜单残留。
- 建议：补 `aria-controls`；在 `initNavigation` 内增加 `keydown(Escape)`、`document` 点击外部、`matchMedia("(min-width: 761px)")` 变化时关闭；`initNavActive` 同步 `aria-current`。约 20 行，无需新依赖。

### P0-5 未安装搜索插件时，Ctrl/⌘+K 被吞掉

- 位置：`src/js/main.ts` 第 92–97 行
- 问题：快捷键监听始终 `preventDefault()`，即使 `window.SearchWidget` 不存在、页面也没有 `#searchBtn`。在 Firefox 中会抢占地址栏搜索快捷键。
- 收益：避免与浏览器 / 其他扩展的快捷键冲突。
- 建议：事件回调开头判断 `if (!window.SearchWidget) return;`，或仅在 `#searchBtn` 存在时注册监听。

---

## 三、P1：结构性优化（可维护性 / 性能 / 一致性）

### P1-1 拆分 1076 行的 `main.ts`

- 位置：`src/js/main.ts`（已有清晰的注释分区）
- 问题：主题切换、搜索、导航、滚动 UI、浮现、计数器、时钟、瞬间、灯箱、目录、友链、评论等全部集中在一个文件；灯箱状态由 5 个模块级可变量维护（373–377、434–435 行），难以单测和复用。
- 收益：降低修改风险；Vite 会打包成单文件，运行体积基本不变。
- 建议：按现有注释拆为 `theme.ts`、`lightbox.ts`、`toc.ts`、`moments.ts`、`navigation.ts`、`motion.ts`、`utils/dom.ts`；灯箱改为 `createLightbox()` 工厂，把 `lightboxIndex/items/locked` 收进闭包。分两步做，先拆灯箱与通用 DOM 工具，风险最低。

### P1-2 拆分并去重 5072 行 `style.css`

- 位置：`src/css/style.css`，重复块：1132/1140（`.moment-img`）、3009/4510（`.comments`）、4312/4982（`.nav.nav--open`）；无效声明：1058（flex 容器上的 `column-count`）
- 问题：单文件过长导致定位困难；相邻选择器重复声明、跨断点重复覆盖；`.moment-img` 被拆成两段属性块。另有 5 个疑似未使用的类（`reveal-left`、`cats`、`swup-enabled`、`narrate-progress`、`lvl-3`）经脚本扫描仅为候选，需人工确认。
- 收益：CSS 可读性与可维护性显著提升，便于后续主题皮肤化；合并重复后体积略降。
- 建议：按「tokens / base / layout / components / pages / responsive」拆文件，用 `@layer` 固定层级；先合并上述 3 组重复块、删除 1058 行无效声明。不需要引入 Tailwind 或 CSS-in-JS。

### P1-3 锚点偏移量三套数值不一致

- 位置：`src/css/style.css` 第 51 行（`--header-h: 64px`）、2062 行（`var(--header-h, 72px)`）、2231–2242 行（`90px`）；`src/js/main.ts` 第 613 行（`- 80`）
- 问题：同一「吸顶头部避让」在 CSS 中用 90px、JS 中用 80px、回退值又是 72px，实际头部 64px。目录点击与 `scroll-margin` 落点会有约 10px 偏差，后续调整头部高度时容易漏改。
- 收益：锚点落点一致，消除魔法数字。
- 建议：新增 `--anchor-offset: 88px`（或 `calc(var(--header-h) + 24px)`），CSS 的 `scroll-margin-top` 统一引用；JS 通过 `getComputedStyle(document.documentElement).getPropertyValue("--anchor-offset")` 读取，避免双份常量。

### P1-4 页面头部与图标 SVG 重复度高

- 位置：`page-hero` 结构在 10 个模板中重复（`archives/categories/category/friends/links/moments/page/page_about/photos/tags/tag`）；`<svg>` 内联图标在布局与页面中共约 20 处
- 问题：调整首屏文案、类名或图标描边时需逐文件修改，容易出现风格漂移。
- 收益：模板体积下降，视觉一致性提升。
- 建议：优先做 **SVG sprite**（在 `layout.html` 输出隐藏的 `<symbol id="i-arrow">…`，模板改用 `<svg><use href="#i-arrow"/></svg>`），改动机械、零构建风险；`page-hero` 若 `include` 不支持传参，可保留重复，但建议至少统一为「glyph / kicker / title / sub」四段结构并加注释，避免继续分叉。

### P1-5 首屏图片策略可以更精确

- 位置：`src/js/main.ts` 第 475 行（所有正文图片补 `loading="lazy"`）；`src/author.html` 第 20 行（作者头像 lazy）；`src/photo.html` 第 41–49 行；`src/moment.html` 第 67 行起
- 问题一：正文第一张图也被设为懒加载，若位于首屏会推迟 LCP；作者页头像属于首屏内容却 `loading="lazy"`（已有 `fetchpriority="high"` 的图库详情页做法正确）。
- 问题二：灯箱作用域只覆盖 `.post-content` / `.moment-images` / `.moment-image`，图库详情 `.photo-figure` 与瞬间详情 `.moment-detail__media` 的图片点击无法放大，与首页瞬间的交互不一致。
- 收益：更快的首屏渲染；图片交互在全站一致。
- 建议：正文图片循环中对第一张（或位于首屏的前 1–2 张）不设 lazy，并可加 `fetchpriority="high"`；作者头像改为 eager；灯箱作用域追加 `.photo-figure` 与 `.moment-detail__media`。

### P1-6 Finder 调用重复与 N+1

- 位置：`src/partials/layout.html` 第 208 行（`categoryFinder.listAll()`）；`src/index.html` 第 51–52 行（分类、标签全量）与 376–378 行（每个导览分类再查一次文章）；`src/partials/sidebar.html` 第 32、84、88 行（`tagFinder.listAll()` 两次）；页脚 `linkFinder.random(8)` 与侧栏 `linkFinder.random(6)` 各一次；`src/archives.html` 第 20 行额外 `postFinder.list(1,1).total`
- 问题：单次页面渲染可能触发十余次 Finder 查询，分类导览存在按分类循环查询（N+1）。Halo 对部分 Finder 有缓存，但仍会放大冷启动与多分类场景的渲染耗时。
- 收益：降低服务端渲染开销，首页与列表页更稳定。
- 建议：在 `layout.html` 的 `<html th:with>` 中统一定义 `allCategories` / `allTags`，供页脚与页面复用；首页分类导览的 `listByCategory` 保留（数据形态需要），但建议限制导览分类数量上限（如 6–8）并在主题设置中说明；页脚与侧栏友链随机数不要重复请求，可按需只保留一处。先用 Halo 日志确认实际查询次数再实施，避免过度优化。

### P1-7 模板空值防护缺口

- 位置：`src/friends.html` 第 38–43 行（`friend.spec.pubDate` 直接 `#temporals.format`）；`src/moment.html` 第 23、47 行（`moment.owner.name` 未判空，而头像 `th:if` 已判空）
- 问题：朋友圈插件的发布时间、瞬间作者在极端数据下可能为空，Thymeleaf 抛错会导致整页 500。
- 收益：第三方插件数据异常时页面仍可降级展示。
- 建议：`pubDate` 为空时输出占位（如 `—`）；作者链接包一层 `th:if="${moment.owner != null}"` 或使用 `moment.owner?.name`，避免与下方 `th:if` 逻辑不一致。

### P1-8 侧栏「热门文章」实际是最新文章

- 位置：`src/partials/sidebar.html` 第 1–6 行
- 问题：`postFinder.list(1, 5)` 按发布时间返回，注释也承认 Halo 暂不支持按访问量排序，但标题仍显示「热门文章」，对读者有误导。
- 收益：文案与数据一致，避免运营误解。
- 建议：标题改为「最新文章」（同时更新空状态文案）；若后续 Halo 提供访问量排序 Finder，再切换数据源。

### P1-9 相对时间丢失绝对时间

- 位置：`src/js/main.ts` 第 342–347 行
- 问题：`<time datetime="…">` 的可见文本被替换为「3天前」后，原始日期完全不可见，用户无法查看准确发布时间。
- 收益：保留相对时间的轻量感，同时提供精确信息。
- 建议：替换文本前把原文本写入 `element.title`（或 `<time>` 的 `title` 属性），悬停即可查看；成本一行。

### P1-10 灯箱缺少焦点管理

- 位置：`src/js/main.ts` 第 379–423 行
- 问题：`role="dialog"` + `aria-modal="true"`，但打开时不移动焦点、不设置 `tabindex`、关闭后不还原焦点，键盘用户仍可 Tab 到背景内容；单张图片时左右按钮仍显示。
- 收益：符合 WAI-ARIA 对话框模式，键盘体验完整。
- 建议：容器加 `tabindex="-1"`，打开时 `focus()` 并记录 `document.activeElement`，关闭时还原；`items.length <= 1` 时隐藏上一张/下一张按钮。

---

## 四、P2：工程化与体验打磨

### P2-1 依赖与运行环境缺少确定性约束

- 位置：`package.json` 第 21–24、31–34 行
- 问题：`vite` 与 `vite-plus` 使用 `latest` 标签；`@types/node` 停留在 18.11.9，而 CD 使用 Node 24；没有 `engines` 字段。
- 收益：构建可复现，减少「本地正常、CI 异常」。
- 建议：把两个 `latest` 固定到当前锁文件中的具体版本（`pnpm list vite-plus` 可查）；`@types/node` 升到 22/24；补 `"engines": { "node": ">=20" }`，可选加 `"private": true` 防误发布。

### P2-2 缺少 PR CI，`check` 脚本默认改写文件

- 位置：`package.json` 第 7 行；`.github/workflows/` 仅有 `cd.yaml`
- 问题：PR 与主分支没有自动执行 lint / 类型检查 / 构建；`check` 带 `--fix`，不适合直接放进 CI（会静默改写工作区）。
- 收益：提前拦截模板语法、类型与打包问题。
- 建议：新增轻量 `ci.yaml`：`pnpm install --frozen-lockfile` → `pnpm exec vp check`（不带 `--fix`）→ `pnpm build-only`。保留本地 `check` 的自动修复行为即可。

### P2-3 检查范围未排除构建产物

- 位置：`vite.config.ts` 第 6、16 行
- 问题：`ignorePatterns` 只有 `.agents`、`.trae`，未排除 `templates/`（生成物）、`dist/`、`public/assets/fonts/`；`staged` 的 `"*"` 会让任意二进制（如 174 个字体文件）也触发检查。
- 收益：检查更快，避免格式化生成物造成无意义 diff。
- 建议：补齐忽略目录；`staged` 改为 `"*.{ts,js,mjs,css,html,json,md,yaml,yml}"`；`sortTailwindcss` 在未使用 Tailwind 时可移除，减少一次无意义扫描。

### P2-4 字体与包体积

- 位置：`public/assets/fonts/`（174 个 woff2，8.42 MB）、`src/css/font.css`
- 问题：主题包 9.09 MB，字体占 8.42 MB；`font.css` 顶部注释仍写「在线中文字体 / 启用在线中文字体」，与现状（自托管、设置名为「启用内置中文字体」）不符；LXGW 仅提供 400W，而标题使用 600/700，浏览器会合成粗体，字重观感需实机确认。
- 收益：明确包体积预期；避免维护者被过期注释误导。
- 建议：保留自托管方案（符合「不请求第三方」的设计），但更新注释并在 README 说明包体积主要来自字体、可通过设置关闭；若认为合成粗体偏糊，可将展示型标题改用系统无衬线字体，或引入 700W 子集（体积会明显增加，不建议默认做）。

### P2-5 首屏高度使用 `100vh`

- 位置：`src/css/style.css` 第 351 行
- 问题：移动端浏览器地址栏收放会导致 `100vh` 与可视区域不一致，首屏出现跳动或底部被裁切。
- 收益：移动端首屏稳定。
- 建议：改为 `min-height: calc(100svh - var(--header-h))`，保留 `100vh` 作为旧浏览器回退。

### P2-6 `will-change` 常驻

- 位置：`src/css/style.css` 第 208 行（所有 `.reveal`）、251 行（头部）
- 问题：所有待浮现元素在整页生命周期内都提升合成层，长列表页会占用额外显存；头部 `will-change: backdrop-filter` 长期常驻收益有限。
- 收益：降低低端设备内存与合成开销。
- 建议：`.reveal` 仅在未进入视口时声明，`.in` 后改回 `will-change: auto`；头部可移除该声明（`backdrop-filter` 本身已建立合成层），用真机滚动测试确认无回归。

### P2-7 装饰性大字未对读屏隐藏

- 位置：14 个模板中的 `.hero__glyph` / `.page-hero__glyph` / `.post-hero__glyph`（如 `index.html` 第 7 行、`page.html` 第 8 行）
- 问题：装饰字通常等于标题首字，读屏会在标题前多读一个孤立字符。
- 收益：减少读屏噪音。
- 建议：统一加 `aria-hidden="true"`；纯视觉元素（脉冲点、装饰线）同样处理。`read-progress` 进度条也建议加 `aria-hidden="true"`。

### P2-8 主题切换按钮状态不可感知

- 位置：`src/partials/layout.html` 第 118–167 行；`src/js/main.ts` 第 70–71 行
- 问题：明暗图标通过内联 `style.display` 切换，按钮没有 `aria-pressed` 或状态文案；不跟随系统主题的后续变化。
- 收益：读屏可感知当前模式；减少 JS 直接操作样式。
- 建议：图标显隐改为 CSS（`[data-theme="dark"] .i-sun { display: none }`），按钮补 `aria-label` 动态文案（「切换到深色/浅色模式」）；在用户未手动选择时监听 `matchMedia("(prefers-color-scheme: dark)")` 的 change 事件。

### P2-9 细节体验增强（可选，按需取舍）

- 瞬间卡片正文固定 120px 高，仅滚动时显示滚动条，建议加底部渐隐遮罩提示可滚动（纯 CSS `mask-image`）。
- 长文页移动端隐藏目录，可考虑一个悬浮「目录」按钮（会增加交互复杂度，非必须）。
- 可补充 `@media print`：隐藏导航、页脚、返回顶部与灯箱，正文改黑字白底。
- `.spotlight-main__excerpt` 为半透明白字叠在图片上，建议实机用对比度工具检查最低对比度，必要时加深局部渐变。

### P2-10 仓库卫生

- 位置：根目录 `.agents/`、`.trae/`、`.claude/`、`.screenshots/`、`.trae-html-share-packages/`、`skills-lock.json`，共 57 个已跟踪文件
- 问题：AI 工具与截图产物进入版本库，增大仓库体积并干扰检索；`.gitignore` 未覆盖。
- 收益：仓库更干净，克隆更快。
- 建议：确认无发布依赖后加入 `.gitignore` 并从索引移除（`git rm -r --cached`）；`templates/`、`dist/` 已被正确忽略，保持现状。

---

## 五、建议实施顺序

1. **第一批（低风险、高收益）**：P0-1 灯箱锁、P0-2 嵌套 main / h1、P0-3 动效偏好、P0-5 快捷键、P2-7 装饰字隐藏、P1-8 文案修正、P1-9 时间 title。
2. **第二批（结构整理）**：P1-1 拆分 JS、P1-2 拆分/去重 CSS、P1-3 偏移量统一；每步构建后按「首页 / 文章详情 / 分类页」三个路由回归。
3. **第三批（工程化）**：P2-1 版本固定、P2-2 CI、P2-3 检查范围、P2-10 仓库清理。
4. **第四批（体验增强）**：P1-4 图标 sprite、P1-5 图片策略、P1-6 Finder 合并、P1-10 灯箱焦点、P2-5/6/8。

## 六、验证建议

- 每批改动后执行 `pnpm check` 与 `pnpm build-only`，确认模板与类型无回归。
- 在 Halo 2.27+ 实例上至少检查：首页（含瞬间区块）、文章详情（含目录、灯箱、评论）、分类/标签页（h1 与分页）、关于页与 404。
- 交互回归重点：移动端菜单开关与 Esc、灯箱连开两次后的滚动锁、系统「减少动态效果」开启时的首屏、Ctrl/⌘+K（安装/未安装搜索插件两种情况）。
