import { prefersReducedMotion, qs, qsa, registerPageCleanup } from "./utils";

/* ---------------- 返回顶部 / 阅读进度 ---------------- */
export function initScrollUi() {
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
export function initReveal() {
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
export function initCounters() {
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

export function initClock() {
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
export function initRotatingWord() {
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
