import SwupA11yPlugin from "@swup/a11y-plugin";
import SwupHeadPlugin from "@swup/head-plugin";
import SwupPreloadPlugin from "@swup/preload-plugin";
import SwupProgressPlugin from "@swup/progress-plugin";
import Swup from "swup";

import "../css/style.css";

type HaloSearchWidget = { open(): void };
declare global {
  interface Window {
    SearchWidget?: HaloSearchWidget;
    hljs?: { highlightElement(el: Element): void };
  }
}

const qs = <T extends Element>(selector: string, root: ParentNode = document): T | null =>
  root.querySelector<T>(selector);
const qsa = <T extends Element>(selector: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll<T>(selector));

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- 页面级生命周期（Swup 切换前后） ---------------- */
let pageCleanups: Array<() => void> = [];

/** 注册当前页面需要释放的监听 / 定时器，切换页面时统一清理，避免重复累积 */
function registerPageCleanup(cleanup: () => void) {
  pageCleanups.push(cleanup);
}

function runPageCleanups() {
  pageCleanups.forEach((cleanup) => {
    try {
      cleanup();
    } catch {
      /* 单个清理失败不影响后续页面初始化 */
    }
  });
  pageCleanups = [];
}

/** 重新执行内容区域内的脚本（评论组件、代码高亮等第三方脚本） */
function replayContentScripts(root: ParentNode) {
  qsa<HTMLScriptElement>("script", root).forEach((script) => {
    if (script.hasAttribute("data-swup-ignore-script")) return;
    // 通过重新创建 script 节点触发执行，保留原有属性与内联代码
    const clone = document.createElement("script");
    Array.from(script.attributes).forEach((attribute) => {
      clone.setAttribute(attribute.name, attribute.value);
    });
    clone.textContent = script.textContent;
    script.replaceWith(clone);
  });
}

/* ---------------- 主题切换 ---------------- */
function initThemeToggle() {
  const root = document.documentElement;
  const button = qs<HTMLButtonElement>("#themeBtn");
  const sun = qs<SVGElement>(".i-sun", button ?? document);
  const moon = qs<SVGElement>(".i-moon", button ?? document);

  const sync = () => {
    const dark = root.getAttribute("data-theme") === "dark";
    // Halo 插件组件（评论 / 搜索等）通过该属性读取当前配色
    root.setAttribute("data-color-scheme", dark ? "dark" : "light");
    if (sun) sun.style.display = dark ? "none" : "block";
    if (moon) moon.style.display = dark ? "block" : "none";
  };
  sync();

  button?.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("narrate-theme", next);
    } catch {
      /* 隐私模式下忽略 */
    }
    sync();
  });
}

/* ---------------- 搜索（plugin-search-widget） ---------------- */
function initSearch() {
  const open = () => window.SearchWidget?.open();
  qs<HTMLButtonElement>("#searchBtn")?.addEventListener("click", open);

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      open();
    }
  });
}

/* ---------------- 移动端菜单 ---------------- */
function initNavigation() {
  const toggle = qs<HTMLButtonElement>("#navToggle");
  const nav = qs<HTMLElement>("#nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("nav--open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest("a")) nav.classList.remove("nav--open");
  });
}

/* ---------------- 返回顶部 / 阅读进度 ---------------- */
function initScrollUi() {
  const progress = qs<HTMLElement>("#readProgress");
  const toTop = qs<HTMLButtonElement>("#toTop");

  const onScroll = () => {
    const scrolled = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${height > 0 ? (scrolled / height) * 100 : 0}%`;
    if (toTop) toTop.classList.toggle("show", scrolled > 400);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
}

/* ---------------- 滚动浮现 ---------------- */
function initReveal() {
  const elements = qsa<HTMLElement>(".reveal, .reveal-left");
  if (!elements.length) return;

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    elements.forEach((element) => element.classList.add("in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );
  elements.forEach((element) => observer.observe(element));
  registerPageCleanup(() => observer.disconnect());
}

/* ---------------- 数字增长动画 ---------------- */
function initCounters() {
  const counters = qsa<HTMLElement>("[data-count]");
  if (!counters.length) return;

  const run = (element: HTMLElement) => {
    const target = Number.parseInt(element.dataset.count ?? "0", 10) || 0;
    if (prefersReducedMotion) {
      element.textContent = String(target);
      return;
    }
    const duration = 1400;
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach((element) => {
      element.textContent = element.dataset.count ?? "0";
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.6 },
  );
  counters.forEach((element) => observer.observe(element));
  registerPageCleanup(() => observer.disconnect());
}

/* ---------------- 首页「此刻」与问候 ---------------- */
const DEFAULT_GREETINGS = [
  "早安，新的一天。",
  "午安，记得好好吃饭。",
  "下午好，慢慢来。",
  "夜色温柔，适合写字。",
  "夜深了，写点什么吧。",
];

/** 按访客本地时间返回问候语序号：上午 / 午间 / 下午 / 夜晚 / 深夜 */
function greetingIndexOf(hour: number): number {
  if (hour < 5 || hour >= 23) return 4;
  if (hour < 11) return 0;
  if (hour < 13) return 1;
  if (hour < 18) return 2;
  return 3;
}

function initClock() {
  const time = qs<HTMLElement>("#nowTime");
  const greet = qs<HTMLElement>("#nowGreet");
  if (!time && !greet) return;

  // 主题设置中以回车分隔，空行忽略；未配置时使用内置文案
  const configured = (greet?.dataset.greetings ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const greetings = configured.length ? configured : DEFAULT_GREETINGS;

  const pad = (value: number) => (value < 10 ? `0${value}` : `${value}`);
  const tick = () => {
    const now = new Date();
    if (time) {
      time.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }
    if (greet) {
      const index = Math.min(greetingIndexOf(now.getHours()), greetings.length - 1);
      greet.textContent = greetings[index];
    }
  };
  tick();
  const timer = window.setInterval(tick, 1000);
  registerPageCleanup(() => window.clearInterval(timer));
}

/* ---------------- 首页旋转词 ---------------- */
function initRotatingWord() {
  const element = qs<HTMLElement>("#rotWord");
  if (!element) return;

  // 主题设置按回车分隔，同时兼容旧版逗号 / 顿号分隔的配置
  const words = (element.dataset.words ?? "")
    .split(/[\r\n,，、]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (words.length < 2) return;

  // 服务端已归一化首词，这里兜底，避免旧配置下首屏停在一整串文本
  element.textContent = words[0];

  let index = 0;
  let animation: Animation | null = null;

  const timer = window.setInterval(() => {
    index = (index + 1) % words.length;
    element.textContent = words[index];
    if (prefersReducedMotion) return;

    // 用 Web Animations 重放，避免重置 animation 样式在部分浏览器不触发
    animation?.cancel();
    animation = element.animate(
      [
        { opacity: 0, transform: "translateY(0.45em)", filter: "blur(4px)" },
        { opacity: 1, transform: "none", filter: "none" },
      ],
      { duration: 600, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
    );
  }, 3200);

  registerPageCleanup(() => {
    window.clearInterval(timer);
    animation?.cancel();
  });
}

/* ---------------- 瞬间横向翻页 ---------------- */
function initMoments() {
  const track = qs<HTMLElement>(".moments__track");
  if (!track) return;

  // 卡片内滚动条仅在滚动时显示，停止滚动后隐藏
  const timers = new WeakMap<HTMLElement, number>();
  qsa<HTMLElement>(".moment__body", track).forEach((body) => {
    body.addEventListener(
      "scroll",
      () => {
        body.classList.add("is-scrolling");
        const timer = timers.get(body);
        if (timer) window.clearTimeout(timer);
        timers.set(
          body,
          window.setTimeout(() => {
            body.classList.remove("is-scrolling");
            timers.delete(body);
          }, 800),
        );
      },
      { passive: true },
    );
  });

  const step = () => Math.min(track.clientWidth * 0.8, 640);
  qs<HTMLButtonElement>("#momPrev")?.addEventListener("click", () => {
    track.scrollBy({ left: -step(), behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
  qs<HTMLButtonElement>("#momNext")?.addEventListener("click", () => {
    track.scrollBy({ left: step(), behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
}

/* ---------------- 相对时间 ---------------- */
function relativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "";
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`;
  if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)}天前`;

  const date = new Date(timestamp);
  const today = new Date();
  const pad = (value: number) => (value < 10 ? `0${value}` : `${value}`);
  return date.getFullYear() === today.getFullYear()
    ? `${date.getMonth() + 1}月${date.getDate()}日`
    : `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function initRelativeTimes() {
  qsa<HTMLTimeElement>("time[data-relative]").forEach((element) => {
    const datetime = element.getAttribute("datetime") ?? "";
    const text = relativeTime(datetime);
    if (text) element.textContent = text;
  });
}

/* ---------------- 阅读时长 ---------------- */
function initReadTime() {
  const content = qs<HTMLElement>(".post-content");
  if (!content) return;
  const targets = qsa<HTMLElement>("[data-read-time]");
  if (!targets.length) return;

  const length = (content.textContent ?? "").replace(/\s+/g, "").length;
  const minutes = Math.max(1, Math.ceil(length / 350));
  targets.forEach((target) => {
    target.textContent = (target.dataset.readTimeTemplate ?? "约 {n} 分钟").replace(
      "{n}",
      String(minutes),
    );
  });
}

/* ---------------- 正文图片：懒加载 / figure / 灯箱 ---------------- */
interface LightboxItem {
  src: string;
  alt: string;
}

let lightbox: HTMLElement | null = null;
let lightboxImage: HTMLImageElement | null = null;
let lightboxCount: HTMLElement | null = null;
let lightboxItems: LightboxItem[] = [];
let lightboxIndex = 0;

function ensureLightbox(): HTMLElement {
  if (lightbox) return lightbox;

  const element = document.createElement("div");
  element.className = "narrate-lightbox";
  element.setAttribute("role", "dialog");
  element.setAttribute("aria-modal", "true");
  element.innerHTML = `
    <button class="narrate-lightbox__btn narrate-lightbox__close" aria-label="关闭">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
    <button class="narrate-lightbox__btn narrate-lightbox__prev" aria-label="上一张">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m14 6-6 6 6 6"/></svg>
    </button>
    <img alt="">
    <button class="narrate-lightbox__btn narrate-lightbox__next" aria-label="下一张">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m10 6 6 6-6 6"/></svg>
    </button>
    <div class="narrate-lightbox__count"></div>`;

  document.body.appendChild(element);
  lightbox = element;
  lightboxImage = qs<HTMLImageElement>("img", element);
  lightboxCount = qs<HTMLElement>(".narrate-lightbox__count", element);

  const close = () => {
    element.classList.remove("open");
    document.body.classList.remove("lightbox-open");
  };
  qs(".narrate-lightbox__close", element)?.addEventListener("click", close);
  element.addEventListener("click", (event) => {
    if (event.target === element) close();
  });
  qs(".narrate-lightbox__prev", element)?.addEventListener("click", () => moveLightbox(-1));
  qs(".narrate-lightbox__next", element)?.addEventListener("click", () => moveLightbox(1));

  document.addEventListener("keydown", (event) => {
    if (!element.classList.contains("open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") moveLightbox(-1);
    if (event.key === "ArrowRight") moveLightbox(1);
  });

  return element;
}

function moveLightbox(step: number) {
  if (!lightboxItems.length || !lightboxImage) return;
  lightboxIndex = (lightboxIndex + step + lightboxItems.length) % lightboxItems.length;
  const item = lightboxItems[lightboxIndex];
  lightboxImage.src = item.src;
  lightboxImage.alt = item.alt;
  if (lightboxCount) lightboxCount.textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;
}

function openLightbox(items: LightboxItem[], index: number) {
  const element = ensureLightbox();
  lightboxItems = items;
  lightboxIndex = index;
  const item = items[index];
  if (lightboxImage) {
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
  }
  if (lightboxCount) lightboxCount.textContent = `${index + 1} / ${items.length}`;
  element.classList.add("open");
  document.body.classList.add("lightbox-open");
}

function initContentImages() {
  const content = qs<HTMLElement>(".post-content");
  if (content) {
    qsa<HTMLImageElement>("img", content).forEach((image) => {
      if (!image.hasAttribute("loading")) image.setAttribute("loading", "lazy");
      if (!image.hasAttribute("decoding")) image.setAttribute("decoding", "async");

      const parent = image.parentElement;
      const isSoloImage =
        parent?.tagName === "P" &&
        (parent.textContent ?? "").trim() === "" &&
        parent.children.length === 1;

      if (isSoloImage && parent) {
        const figure = document.createElement("figure");
        figure.className = "post__image";
        parent.replaceWith(figure);
        figure.appendChild(image);

        const alt = image.getAttribute("alt") ?? "";
        const title = image.getAttribute("title") ?? "";
        const caption = alt || title;
        if (caption) {
          const figcaption = document.createElement("figcaption");
          figcaption.className = "image-caption";
          figcaption.textContent = caption;
          figure.appendChild(figcaption);
        }
      }

      image.classList.add("lazy");
      if (image.complete) {
        image.classList.add("loaded");
      } else {
        image.addEventListener("load", () => image.classList.add("loaded"), { once: true });
        image.addEventListener("error", () => image.classList.add("loaded"), { once: true });
      }
    });
  }
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove("open");
  document.body.classList.remove("lightbox-open");
}

/** 灯箱使用事件委托，只需在全局初始化一次 */
function initImageLightbox() {
  // 使用捕获阶段，确保先于 Swup 的链接拦截执行并阻止其对图片链接的跳转
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName !== "IMG") return;
      if (target.closest(".narrate-lightbox")) return;
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        (event as MouseEvent).button !== 0
      )
        return;

      // 正文配图、组图（Halo 编辑器渲染的 figure/img）以及瞬间图片都支持放大，
      // 灯箱内可切换同一区域内（正文 / 瞬间图集）的全部图片
      const scope =
        target.closest<HTMLElement>(".moment-images") ??
        target.closest<HTMLElement>(".post-content") ??
        target.closest<HTMLElement>(".moment-image");
      if (!scope) return;

      const items = qsa<HTMLImageElement>("img", scope)
        .filter((image) => !image.closest(".narrate-lightbox"))
        .filter((image) => !image.classList.contains("emoji"))
        .map((image) => ({ src: image.currentSrc || image.src, alt: image.alt }))
        .filter((item) => item.src);

      const current = (target as HTMLImageElement).currentSrc || (target as HTMLImageElement).src;
      if (!current) return;

      if (!items.length) items.push({ src: current, alt: (target as HTMLImageElement).alt });
      const index = Math.max(
        0,
        items.findIndex((item) => item.src === current),
      );
      event.preventDefault();
      // 阻止 Swup 对包裹图片的链接执行跳转
      event.stopImmediatePropagation();
      openLightbox(items, index);
    },
    true,
  );
}

/* ---------------- 文章目录 ---------------- */
function initToc() {
  const content = qs<HTMLElement>(".post-content");
  const list = qs<HTMLUListElement>("#tocList");
  const widget = qs<HTMLElement>("#tocWidget");
  if (!content || !list || !widget) return;

  const headings = qsa<HTMLHeadingElement>("h2, h3", content);
  if (!headings.length) {
    widget.hidden = true;
    // 没有实际目录时让正文收窄居中
    widget.closest(".post")?.classList.add("post--no-toc");
    return;
  }

  let serial = 0;
  const links: HTMLAnchorElement[] = [];
  headings.forEach((heading) => {
    if (!heading.id) {
      serial += 1;
      heading.id = `h-${serial}`;
    }
    const item = document.createElement("li");
    item.className = heading.tagName === "H3" ? "lvl-3" : "lvl-2";
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent ?? "";
    // 目录使用自定义滚动偏移，禁止 Swup 再次接管锚点跳转
    link.setAttribute("data-no-swup", "");
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const top = heading.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
      history.replaceState(null, "", `#${heading.id}`);
    });
    item.appendChild(link);
    list.appendChild(item);
    links.push(link);
  });

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.classList.remove("active"));
        list.querySelector(`a[href="#${entry.target.id}"]`)?.classList.add("active");
      });
    },
    { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
  );
  headings.forEach((heading) => observer.observe(heading));
  registerPageCleanup(() => observer.disconnect());
}

/* ---------------- 友链卡片 ---------------- */
function initLinkCards() {
  qsa<HTMLAnchorElement>(".link-grid .link-card").forEach((card) => {
    let host = "";
    try {
      host = new URL(card.href).hostname;
    } catch {
      host = "";
    }
    const hostElement = qs<HTMLElement>(".js-host", card);
    if (hostElement && host) hostElement.textContent = host;

    const avatars = qsa<HTMLElement>(".link-card__avatar", card);
    const image = avatars[0];
    const letter = avatars[1];
    const name = card.dataset.name ?? "";
    if (letter && name) letter.textContent = name.charAt(0);

    if (image instanceof HTMLImageElement) {
      if (!image.getAttribute("src") || image.style.display === "none") {
        image.hidden = true;
        if (letter) letter.style.display = "grid";
      } else {
        image.addEventListener(
          "error",
          () => {
            image.hidden = true;
            if (letter) letter.style.display = "grid";
          },
          { once: true },
        );
      }
    }

    const status = qs<HTMLElement>(".link-card__host i", card);
    status?.classList.add("online");
    if (status) status.title = "可访问";
  });

  const stats = qs<HTMLElement>(".link-stats");
  const grid = qs<HTMLElement>(".link-grid");
  if (stats && grid) {
    const count = qsa("a.link-card", grid).length;
    const number = qs<HTMLElement>("b", stats);
    if (number) number.textContent = String(count);
  }
}

/* ---------------- 友链分组筛选 ---------------- */
function initLinkFilter() {
  const menu = qs<HTMLElement>(".links_sort_menu");
  const grid = qs<HTMLElement>(".link-grid");
  if (!menu || !grid) return;

  const buttons = qsa<HTMLButtonElement>("button[data-filter]", menu);
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter ?? "all";
      buttons.forEach((item) => item.classList.toggle("active", item === button));
      qsa<HTMLElement>("a.link-card", grid).forEach((card) => {
        card.style.display = filter === "all" || card.dataset.group === filter ? "" : "none";
      });
    });
  });
}

/* ---------------- 归档页统计 ---------------- */
function initArchiveCounts() {
  qsa<HTMLElement>("[data-archive-year]").forEach((section) => {
    const count = qs<HTMLElement>("[data-archive-year-count]", section);
    if (count) count.textContent = String(qsa(".archive-item", section).length);
  });
}

/* ---------------- 代码高亮 ---------------- */
function initHighlight() {
  const blocks = qsa<HTMLElement>(".post-content pre code");
  if (!blocks.length) return;

  const run = () => {
    blocks.forEach((block) => window.hljs?.highlightElement(block));
  };

  if (window.hljs) {
    run();
    return;
  }

  // 代码高亮脚本随页面内容一起被 Swup 重新执行，需等待其加载完成后再渲染
  const script = qs<HTMLScriptElement>('script[src*="highlight.min.js"]');
  script?.addEventListener("load", run, { once: true });
}

/* ---------------- 友链申请验证码刷新 ---------------- */
function initLinkCaptcha() {
  const captcha = qs<HTMLImageElement>("#link-application-captcha");
  if (!captcha) return;
  captcha.style.cursor = "pointer";
  captcha.title = "点击刷新验证码";
  captcha.addEventListener("click", () => {
    const base = captcha.src.split("?")[0];
    captcha.src = `${base}?t=${Date.now()}`;
  });
}

/* ---------------- 瞬间卡片摘要 ---------------- */
// 插件渲染的 #标签 链接既可能是相对的 `?tag=xxx`，也可能是绝对的 `/moments?tag=xxx`
const MOMENT_TAG_LINK_PATTERN = /^(?:\.\/)?\?tag=|\/moments\?tag=/;

function initMomentSummary(root: ParentNode = document) {
  // 列表页的标签统一由卡片底部的标签区展示，移除正文摘要里的标签链接，
  // 避免标签被摘要高度截断后压在卡片底部分隔线上
  qsa<HTMLElement>(".mcard__text", root).forEach((body) => {
    qsa<HTMLAnchorElement>("a[href]", body).forEach((link) => {
      if (!MOMENT_TAG_LINK_PATTERN.test(link.getAttribute("href") ?? "")) return;
      const block = link.parentElement;
      link.remove();
      if (block && block !== body && !(block.textContent ?? "").trim()) block.remove();
    });
  });
}

/* ---------------- 瞬间标签链接归一化 ---------------- */
function initMomentTagLinks(root: ParentNode = document) {
  // 插件渲染的 #标签 链接可能是相对地址 `?tag=xxx`：
  // 在 /moments 下可用，但在首页会解析成 `/?tag=`、详情页会解析成 `/moments/{name}?tag=`，
  // 这里统一改写为瞬间列表页的标签筛选地址。
  const momentsUrl = document.documentElement.dataset.momentsUrl || "/moments";
  qsa<HTMLAnchorElement>(
    ".moment__text a[href], .mcard__text a[href], .moment-detail__body a[href]",
    root,
  ).forEach((link) => {
    const href = link.getAttribute("href") ?? "";
    if (!MOMENT_TAG_LINK_PATTERN.test(href)) return;
    let tag: string | null = null;
    try {
      tag = new URL(href, window.location.href).searchParams.get("tag");
    } catch {
      return;
    }
    if (!tag) return;
    link.href = `${momentsUrl}?tag=${encodeURIComponent(tag)}`;
  });
}

/* ---------------- 轻提示 ---------------- */
let toastTimer: number | undefined;

function ensureToast(): HTMLElement {
  const existing = qs<HTMLElement>(".narrate-toast");
  if (existing) return existing;

  const toast = document.createElement("div");
  toast.className = "narrate-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.appendChild(toast);
  return toast;
}

function showToast(message: string) {
  const toast = ensureToast();
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

/* ---------------- 瞬间点赞 ---------------- */
const MOMENT_UPVOTE_STORAGE = "halo.upvoted.moment.names";

function readMomentUpvoted(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(MOMENT_UPVOTE_STORAGE) || "[]");
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeMomentUpvoted(names: string[]) {
  try {
    localStorage.setItem(MOMENT_UPVOTE_STORAGE, JSON.stringify(names));
  } catch {
    // 隐私模式下写入失败时仅保留本次会话内的视觉状态
  }
}

function initMomentUpvote(root: ParentNode = document) {
  qsa<HTMLButtonElement>("[data-moment-upvote]", root).forEach((button) => {
    if (button.dataset.bound === "true") return;
    const name = button.dataset.momentUpvote;
    if (!name) return;
    button.dataset.bound = "true";

    const count = qs<HTMLElement>("[data-moment-upvote-count]", button);
    const sync = () => {
      const upvoted = readMomentUpvoted().includes(name);
      button.classList.toggle("is-upvoted", upvoted);
      button.setAttribute("aria-pressed", String(upvoted));
      button.setAttribute("title", upvoted ? "已点赞" : "点赞");
    };
    sync();

    button.addEventListener("click", async () => {
      if (button.dataset.loading === "true") return;

      if (readMomentUpvoted().includes(name)) {
        showToast("已经点过赞啦");
        return;
      }

      button.dataset.loading = "true";
      try {
        // plural 必须与 Moment 的 GVK 一致（moment.halo.run / moments），否则接口返回 404
        const response = await fetch("/apis/api.halo.run/v1alpha1/trackers/upvote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ group: "moment.halo.run", plural: "moments", name }),
        });
        // 409 表示服务端已记录过该访客的点赞
        if (response.status === 409) {
          writeMomentUpvoted([...readMomentUpvoted(), name]);
          sync();
          showToast("已经点过赞啦");
          return;
        }
        if (!response.ok) throw new Error(String(response.status));
        writeMomentUpvoted([...readMomentUpvoted(), name]);
        if (count) count.textContent = String(Number(count.textContent || "0") + 1);
        sync();
      } catch {
        showToast("点赞失败，请稍后重试");
      } finally {
        button.dataset.loading = "false";
      }
    });
  });
}

/* ---------------- 瞬间卡片内嵌评论 ---------------- */
const COMMENT_WIDGET_SCRIPT = "/plugins/PluginCommentWidget/assets/static/comment-widget.js";
const COMMENT_GROUP = "moment.halo.run";
const COMMENT_KIND = "Moment";

interface CommentWidgetModule {
  init(selector: string, props: { group: string; kind: string; name: string }): void;
}

let commentWidgetModule: Promise<CommentWidgetModule> | null = null;

function loadCommentWidget(): Promise<CommentWidgetModule> {
  if (!commentWidgetModule) {
    // 评论插件会在 <head> 注入带版本号的 modulepreload，优先复用它，避免升级后命中旧缓存
    const preload = qs<HTMLLinkElement>(
      'link[rel="modulepreload"][href*="/plugins/PluginCommentWidget/"]',
    );
    const url = preload?.href ?? COMMENT_WIDGET_SCRIPT;
    commentWidgetModule = import(/* @vite-ignore */ url)
      .then((module) => module as unknown as CommentWidgetModule)
      .catch((error: unknown) => {
        commentWidgetModule = null;
        throw error;
      });
  }
  return commentWidgetModule;
}

async function mountMomentComment(container: HTMLElement, name: string) {
  // 与插件 DefaultCommentWidget 的渲染结果保持一致：先给出挂载点，再交给评论组件接管
  const domId = `comment-${COMMENT_GROUP}-${COMMENT_KIND}-${name}`.replace(
    /[^\-_a-zA-Z0-9\s]/g,
    "-",
  );
  const host = document.createElement("div");
  host.id = domId;
  container.replaceChildren(host);
  try {
    const widget = await loadCommentWidget();
    widget.init(`#${domId}`, { group: COMMENT_GROUP, kind: COMMENT_KIND, name });
  } catch {
    container.textContent = "评论组件加载失败，请稍后重试。";
  }
}

function initMomentComments(root: ParentNode = document) {
  const dialog = qs<HTMLDialogElement>("#momentCommentDialog");
  const body = dialog ? qs<HTMLElement>("[data-moment-comment-body]", dialog) : null;
  if (!dialog || !body) return;

  if (dialog.dataset.bound !== "true") {
    dialog.dataset.bound = "true";
    qs<HTMLElement>("[data-moment-comment-close]", dialog)?.addEventListener("click", () =>
      dialog.close(),
    );
    // 点击弹层外的遮罩区域关闭
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    // 关闭后卸载评论组件，下次打开时按新的瞬间重新挂载
    dialog.addEventListener("close", () => body.replaceChildren());
  }

  qsa<HTMLButtonElement>("[data-moment-comment]", root).forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    const name = button.dataset.momentComment;
    if (!name) return;

    button.addEventListener("click", () => {
      dialog.showModal();
      void mountMomentComment(body, name);
    });
  });
}

/* ---------------- 导航选中态 ---------------- */
function normalizePath(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

function initNavActive() {
  const pathname = normalizePath(window.location.pathname);
  qsa<HTMLAnchorElement>("#nav a[href]").forEach((link) => {
    if (link.target === "_blank" || link.target === "_parent") return;
    let target = "";
    try {
      target = normalizePath(new URL(link.href, window.location.href).pathname);
    } catch {
      return;
    }
    const active =
      target === "/" ? pathname === "/" : pathname === target || pathname.startsWith(`${target}/`);
    link.classList.toggle("active", active);
  });
}

/* ---------------- 页面级初始化 ---------------- */
function initPage(replayScripts = false) {
  if (replayScripts) {
    const container = qs<HTMLElement>("#swup") ?? document.body;
    replayContentScripts(container);
  }

  initClock();
  initRotatingWord();
  initMoments();
  initRelativeTimes();
  initReadTime();
  initContentImages();
  initToc();
  initLinkCards();
  initLinkFilter();
  initArchiveCounts();
  initHighlight();
  initLinkCaptcha();
  initMomentUpvote();
  initMomentSummary();
  initMomentTagLinks();
  initMomentComments();
}

/** 入场动画结束后再触发滚动浮现，避免与页面过渡叠加 */
function initPageMotion() {
  initReveal();
  initCounters();
  initNavActive();
  // 刷新滚动进度条与回到顶部按钮状态
  window.dispatchEvent(new Event("scroll"));
}

/* ---------------- Swup 页面过渡 ---------------- */
/** 绕过全局平滑滚动，立即定位（兼容不支持 instant 的浏览器） */
function scrollInstant(target: "top" | Element) {
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  if (target === "top") {
    window.scrollTo(0, 0);
  } else {
    target.scrollIntoView({ block: "start", behavior: "auto" });
  }
  root.style.scrollBehavior = previous;
}

function initSwup() {
  const swup = new Swup({
    containers: ["#swup"],
    animationSelector: ".transition-main",
    cache: true,
    native: false,
    plugins: [
      // 同步新页面 head 中的标题、样式与脚本资源，等待样式加载完成再切换
      new SwupHeadPlugin({
        persistAssets: true,
        awaitAssets: true,
        timeout: 3000,
      }),
      // 预加载悬停链接，减少等待时间
      new SwupPreloadPlugin({
        preloadHoveredLinks: true,
        preloadVisibleLinks: false,
        preloadInitialPage: false,
        throttle: 3,
      }),
      new SwupA11yPlugin({
        respectReducedMotion: true,
        headingSelector: ["main h1", "h1"],
        announcements: {
          "zh-CN": { visit: "已打开：{title}", url: "已打开新页面：{url}" },
          "*": { visit: "已打开：{title}", url: "已打开新页面：{url}" },
        },
      }),
      // 顶部细进度条，弱化等待感
      new SwupProgressPlugin({
        className: "narrate-progress",
        delay: 200,
        transition: 260,
        minValue: 0.08,
        initialValue: 0.2,
      }),
    ],
  });

  // 页面切换使用即时滚动，同页锚点保留平滑滚动
  swup.hooks.replace("scroll:top", () => {
    scrollInstant("top");
    return true;
  });

  swup.hooks.replace("scroll:anchor", (visit, { hash }) => {
    const target = swup.getAnchorElement(hash);
    if (!(target instanceof Element)) return false;
    const samePage = visit.from.url === visit.to.url;
    if (samePage && !prefersReducedMotion) {
      target.scrollIntoView({ block: "start", behavior: "smooth" });
    } else {
      scrollInstant(target);
    }
    return true;
  });

  swup.hooks.on("visit:start", (visit) => {
    closeLightbox();
    // 分页跳转后回到列表区域，而不是页面顶部
    if (visit.trigger.el?.closest(".page-navigator")) {
      visit.scroll.target = "pager-region";
    }
  });

  // 内容替换完成后先清理旧页面状态，再初始化新页面
  swup.hooks.on("content:replace", () => {
    runPageCleanups();
    initPage(true);
  });

  swup.hooks.on("visit:end", () => {
    initPageMotion();
  });
}

/* ---------------- 启动 ---------------- */
function boot() {
  initThemeToggle();
  initSearch();
  initNavigation();
  initScrollUi();
  initImageLightbox();
  initPage();
  initPageMotion();
  initSwup();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
