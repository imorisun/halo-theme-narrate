import { qs, qsa } from "./utils";

/* ---------------- 图库分组筛选 ---------------- */
/**
 * plugin-photos 2.1.2 及以下未向列表模板暴露当前 group，
 * 服务端无法标记选中的分组，也无法在页码链接中保留筛选。
 * 这里按地址栏参数同步激活状态，并为分页链接补回 group。
 */
export function initPhotoFilter() {
  const filter = qs<HTMLElement>(".gallery-filter");
  if (!filter) return;

  const current = new URLSearchParams(window.location.search).get("group") ?? "";

  qsa<HTMLElement>("[data-group]", filter).forEach((item) => {
    const active = (item.dataset.group ?? "") === current;
    item.classList.toggle("is-active", active);
    if (active) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  if (!current) return;
  qsa<HTMLAnchorElement>(".page-navigator a[href]").forEach((link) => {
    const url = new URL(link.href);
    if (url.searchParams.get("group") === current) return;
    url.searchParams.set("group", current);
    link.href = url.href;
  });
}
