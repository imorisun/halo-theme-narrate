import { qs, qsa } from "./utils";

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
/** 打开灯箱前的焦点位置，关闭后需要还原 */
let lastFocused: HTMLElement | null = null;

function ensureLightbox(): HTMLElement {
  if (lightbox) return lightbox;

  const element = document.createElement("div");
  element.className = "narrate-lightbox";
  element.setAttribute("role", "dialog");
  element.setAttribute("aria-modal", "true");
  element.setAttribute("aria-label", "图片预览");
  // 容器本身可聚焦，打开时把焦点移入对话框
  element.setAttribute("tabindex", "-1");
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

  // 必须复用统一的解锁逻辑：只移除类会漏掉 padding 复位与状态标记，
  // 导致二次打开灯箱时滚动锁失效（背景可滚动、右侧留白残留）
  const close = () => {
    element.classList.remove("open");
    setLightboxScrollLock(false);
    // 焦点归还给触发元素，键盘用户不会丢失当前位置
    lastFocused?.focus({ preventScroll: true });
    lastFocused = null;
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

let lightboxScrollLocked = false;
let savedBodyPaddingRight = "";

/**
 * 灯箱开关时锁定 / 解锁页面滚动。
 * 隐藏滚动条会让视口变宽，必须先按滚动条宽度补 body 内边距，
 * 否则正文会整体向右跳一下，关闭时再跳回来。
 */
function setLightboxScrollLock(locked: boolean) {
  if (locked === lightboxScrollLocked) return;
  lightboxScrollLocked = locked;
  if (locked) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    savedBodyPaddingRight = document.body.style.paddingRight;
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.classList.add("lightbox-open");
  } else {
    document.body.classList.remove("lightbox-open");
    document.body.style.paddingRight = savedBodyPaddingRight;
    savedBodyPaddingRight = "";
  }
}

/** 单张图片时隐藏翻页按钮与计数，避免出现无效的操作入口 */
function syncLightboxNav() {
  if (!lightbox) return;
  const single = lightboxItems.length <= 1;
  qs(".narrate-lightbox__prev", lightbox)?.toggleAttribute("hidden", single);
  qs(".narrate-lightbox__next", lightbox)?.toggleAttribute("hidden", single);
  lightboxCount?.toggleAttribute("hidden", single);
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
  syncLightboxNav();
  if (document.activeElement instanceof HTMLElement) lastFocused = document.activeElement;
  element.classList.add("open");
  setLightboxScrollLock(true);
  // 焦点移入对话框，防止 Tab 继续在背景内容中移动
  element.focus({ preventScroll: true });
}

export function initContentImages() {
  const content = qs<HTMLElement>(".post-content");
  if (content) {
    // 正文第一张非小图通常是首屏主图，保持即时加载并提高优先级，避免拖慢 LCP
    let prioritized = false;
    qsa<HTMLImageElement>("img", content).forEach((image) => {
      const isFirst = !prioritized && !isTinyImage(image);
      if (isFirst) {
        prioritized = true;
        image.setAttribute("loading", "eager");
        image.setAttribute("fetchpriority", "high");
      } else if (!image.hasAttribute("loading")) {
        image.setAttribute("loading", "lazy");
      }
      if (!image.hasAttribute("decoding")) image.setAttribute("decoding", "async");
      // 表情 / 小图标保持行内显示，不套用正文配图的边框与留白
      if (isTinyImage(image)) image.classList.add("is-small");

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
    // 内嵌播放器延后加载，避免文章首屏被多个 iframe 拖慢
    qsa<HTMLIFrameElement>("iframe", content).forEach((frame) => {
      if (!frame.hasAttribute("loading")) frame.setAttribute("loading", "lazy");
    });
  }
}

export function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove("open");
  setLightboxScrollLock(false);
}

/** 表情、图标等小尺寸图片不进入灯箱，放大后只会变成模糊色块 */
function isTinyImage(image: HTMLImageElement) {
  const width = Number(image.getAttribute("width"));
  const height = Number(image.getAttribute("height"));
  return (width > 0 && width < 80) || (height > 0 && height < 80);
}

/** 灯箱使用事件委托，只需在全局初始化一次 */
export function initImageLightbox() {
  // 使用捕获阶段，确保先于 Swup 的链接拦截执行并阻止其对图片链接的跳转
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName !== "IMG") return;
      if (target.closest(".narrate-lightbox")) return;
      if (isTinyImage(target as HTMLImageElement)) return;
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
      // 优先匹配「图集容器」，这样同一图集内的图片可以连续翻看；
      // 再回退到正文或单图容器
      const scope =
        target.closest<HTMLElement>(".moment-images") ??
        target.closest<HTMLElement>(".moment-detail__media") ??
        target.closest<HTMLElement>(".photo-figure") ??
        target.closest<HTMLElement>(".post-content") ??
        target.closest<HTMLElement>(".moment-image");
      if (!scope) return;

      const items = qsa<HTMLImageElement>("img", scope)
        .filter((image) => !image.closest(".narrate-lightbox"))
        .filter((image) => !image.classList.contains("emoji"))
        .filter((image) => !isTinyImage(image))
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
