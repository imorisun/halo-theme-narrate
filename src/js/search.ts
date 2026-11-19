import { qs } from "./utils";

type HaloSearchWidget = { open(): void };
declare global {
  interface Window {
    SearchWidget?: HaloSearchWidget;
  }
}

/* ---------------- 搜索（plugin-search-widget） ---------------- */
export function initSearch() {
  const open = () => window.SearchWidget?.open();
  qs<HTMLButtonElement>("#searchBtn")?.addEventListener("click", open);

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      // 未安装搜索组件时不拦截快捷键，交还给浏览器 / 其他扩展
      if (!window.SearchWidget) return;
      event.preventDefault();
      open();
    }
  });
}
