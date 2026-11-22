import { qs, qsa } from "./utils";

/* ---------------- 友链卡片 ---------------- */
export function initLinkCards() {
  qsa<HTMLAnchorElement>(".link-grid .link-card").forEach((card) => {
    // 图标加载失败时移除图片，露出底层的首字母占位
    const image = qs<HTMLImageElement>(".link-card__avatar-img", card);
    if (!image) return;
    if (image.complete && image.naturalWidth === 0) {
      image.remove();
      return;
    }
    image.addEventListener("error", () => image.remove(), { once: true });
  });

  const stats = qs<HTMLElement>(".link-stats");
  const grid = qs<HTMLElement>(".link-grid");
  if (stats && grid) {
    // 分类页的卡片是 div.link-card，友链页才是 a.link-card，统一按卡片元素统计
    const count = qsa(".link-card", grid).length;
    const number = qs<HTMLElement>("b", stats);
    if (number) number.textContent = String(count);
  }
}

/* ---------------- 友链分组筛选 ---------------- */
export function initLinkFilter() {
  const menu = qs<HTMLElement>(".links_sort_menu");
  const grid = qs<HTMLElement>(".link-grid");
  if (!menu || !grid) return;

  const buttons = qsa<HTMLButtonElement>("button[data-filter]", menu);
  buttons.forEach((button) => {
    button.setAttribute("aria-pressed", button.classList.contains("active") ? "true" : "false");
    button.addEventListener("click", () => {
      const filter = button.dataset.filter ?? "all";
      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", active ? "true" : "false");
      });
      qsa<HTMLElement>("a.link-card", grid).forEach((card) => {
        card.classList.toggle("is-hidden", filter !== "all" && card.dataset.group !== filter);
      });
    });
  });
}

/* ---------------- 归档页统计 ---------------- */
export function initArchiveCounts() {
  qsa<HTMLElement>("[data-archive-year]").forEach((section) => {
    const count = qs<HTMLElement>("[data-archive-year-count]", section);
    if (count) count.textContent = String(qsa(".archive-item", section).length);
  });
}

/* ---------------- 友链申请验证码刷新 ---------------- */
export function initLinkCaptcha() {
  const captcha = qs<HTMLImageElement>("#link-application-captcha");
  if (!captcha) return;
  captcha.style.cursor = "pointer";
  captcha.title = "点击刷新验证码";
  captcha.addEventListener("click", () => {
    const base = captcha.src.split("?")[0];
    captcha.src = `${base}?t=${Date.now()}`;
  });
}
