import { qs, qsa } from "./utils";

/* ---------------- 移动端菜单 ---------------- */
export function initNavigation() {
  const toggle = qs<HTMLButtonElement>("#navToggle");
  const nav = qs<HTMLElement>("#nav");
  if (!toggle || !nav) return;

  const close = () => {
    nav.classList.remove("nav--open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("nav--open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest("a")) close();
  });
  // Esc 关闭已展开的菜单
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("nav--open")) close();
  });
  // 点击菜单与按钮以外的区域时收起菜单
  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("nav--open")) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("#nav, #navToggle")) return;
    close();
  });
  // 视口放大到桌面宽度后自动收起，避免残留展开状态
  window.matchMedia("(min-width: 761px)").addEventListener("change", (event) => {
    if (event.matches) close();
  });
}

/* ---------------- 导航选中态 ---------------- */
function normalizePath(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export function initNavActive() {
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
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}
