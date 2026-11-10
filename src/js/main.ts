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

/* ---------------- 主题切换 ---------------- */
function initThemeToggle() {
  const root = document.documentElement;
  const button = qs<HTMLButtonElement>("#themeBtn");
  const sun = qs<SVGElement>(".i-sun", button ?? document);
  const moon = qs<SVGElement>(".i-moon", button ?? document);

  const sync = () => {
    const dark = root.getAttribute("data-theme") === "dark";
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
}

/* ---------------- 首页「此刻」与问候 ---------------- */
function initClock() {
  const time = qs<HTMLElement>("#nowTime");
  const greet = qs<HTMLElement>("#nowGreet");
  if (!time && !greet) return;

  const container = qs<HTMLElement>(".statusbar__inner");
  // 兼容回车换行分隔（含 CRLF 与旧版竖线配置）
  const greetings = (container?.dataset.greetings ?? "")
    .split(/[\r\n|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const fallbacks = [
    "早安，新的一天。",
    "午安，记得好好吃饭。",
    "下午好，慢慢来。",
    "夜色温柔，适合写字。",
    "夜深了，写点什么吧。",
  ];
  // 配置不足 5 条时仍按已有条目展示，缺失的时段回退到最后一条
  const words = greetings.length ? greetings : fallbacks;

  const pad = (value: number) => (value < 10 ? `0${value}` : `${value}`);
  const tick = () => {
    const now = new Date();
    if (time) {
      time.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }
    if (greet) {
      const hour = now.getHours();
      const index =
        hour >= 5 && hour < 11
          ? 0
          : hour >= 11 && hour < 13
            ? 1
            : hour >= 13 && hour < 18
              ? 2
              : hour >= 18 && hour < 23
                ? 3
                : 4;
      greet.textContent = words[index] ?? words[words.length - 1] ?? "";
    }
  };
  tick();
  window.setInterval(tick, 1000);
}

/* ---------------- 首页旋转词 ---------------- */
function initRotatingWord() {
  const element = qs<HTMLElement>("#rotWord");
  if (!element) return;

  // 兼容换行、中英文逗号、顿号、分号与竖线分隔（含旧版单行逗号配置）
  const words = (element.dataset.words ?? "")
    .split(/[\r\n,，、;；|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (words.length < 2) return;

  // 服务端已归一化首词，这里兜底，避免旧配置下首屏停在一整串文本
  element.textContent = words[0];

  let index = 0;
  let animation: Animation | null = null;

  window.setInterval(() => {
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
}

/* ---------------- 瞬间横向翻页 ---------------- */
function initMoments() {
  const track = qs<HTMLElement>(".moments__track");
  if (!track) return;

  const step = () => Math.min(track.clientWidth * 0.8, 640);
  qs<HTMLButtonElement>("#momPrev")?.addEventListener("click", () => {
    track.scrollBy({ left: -step(), behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
  qs<HTMLButtonElement>("#momNext")?.addEventListener("click", () => {
    track.scrollBy({ left: step(), behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
}

/* ---------------- 首页荐读榜单 ---------------- */
function initPicks() {
  const list = qs<HTMLElement>("#rankList");
  if (!list) return;

  const items = qsa<HTMLAnchorElement>(".rank-item", list);
  if (!items.length) return;

  const sort = list.dataset.sort || "views";
  const limit = Number.parseInt(list.dataset.limit ?? "4", 10) || 4;
  const numeric = (item: HTMLElement, key: string) =>
    Number.parseFloat(item.dataset[key] ?? "0") || 0;

  // pinned 保持服务端默认顺序（置顶 → 优先级 → 发布时间），无需重排
  if (sort === "views") {
    items.sort((a, b) => numeric(b, "views") - numeric(a, "views"));
  } else if (sort === "latest") {
    items.sort(
      (a, b) => (Date.parse(b.dataset.date ?? "") || 0) - (Date.parse(a.dataset.date ?? "") || 0),
    );
  }

  items.forEach((item, index) => {
    item.hidden = index >= limit;
    list.appendChild(item);
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

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.tagName !== "IMG") return;
    if (!target.closest(".post__image, .moment-image")) return;
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (event as MouseEvent).button !== 0
    )
      return;

    const scope = target.closest(".moment-images, .post-content, .post__image") ?? document;
    const items = qsa<HTMLImageElement>(".post__image img, .moment-image img", scope)
      .filter((image) => image.complete && image.naturalWidth > 0 && image.src)
      .map((image) => ({ src: image.currentSrc || image.src, alt: image.alt }));
    const current = (target as HTMLImageElement).currentSrc || (target as HTMLImageElement).src;

    if (!items.length) items.push({ src: current, alt: (target as HTMLImageElement).alt });
    const index = Math.max(
      0,
      items.findIndex((item) => item.src === current),
    );
    event.preventDefault();
    openLightbox(items, index);
  });
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
  if (!window.hljs) return;
  qsa<HTMLElement>(".post-content pre code").forEach((block) => {
    window.hljs?.highlightElement(block);
  });
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

/* ---------------- 启动 ---------------- */
function boot() {
  initThemeToggle();
  initSearch();
  initNavigation();
  initScrollUi();
  initReveal();
  initCounters();
  initClock();
  initRotatingWord();
  initMoments();
  initPicks();
  initRelativeTimes();
  initReadTime();
  initContentImages();
  initToc();
  initLinkCards();
  initLinkFilter();
  initArchiveCounts();
  initHighlight();
  initLinkCaptcha();
  window.addEventListener("load", initHighlight, { once: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
