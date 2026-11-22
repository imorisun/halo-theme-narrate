import { prefersReducedMotion, qs, qsa, registerPageCleanup } from "./utils";

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

export function initRelativeTimes() {
  qsa<HTMLTimeElement>("time[data-relative]").forEach((element) => {
    const datetime = element.getAttribute("datetime") ?? "";
    const text = relativeTime(datetime);
    if (!text) return;
    // 把服务端渲染的原始日期保留在 title 中，悬停即可查看精确时间
    if (!element.title) element.title = (element.textContent ?? "").trim();
    element.textContent = text;
  });
}

/* ---------------- 阅读时长 ---------------- */
export function initReadTime() {
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

/* ---------------- 文章目录 ---------------- */
export function initToc() {
  const content = qs<HTMLElement>(".post-content");
  const lists = qsa<HTMLUListElement>(".toc__list");
  const widget = qs<HTMLElement>("#tocWidget");
  const mobile = qs<HTMLDetailsElement>("#tocMobile");
  if (!content || !lists.length) return;

  const headings = qsa<HTMLHeadingElement>("h2, h3", content);
  if (!headings.length) {
    if (widget) widget.hidden = true;
    if (mobile) mobile.hidden = true;
    // 没有实际目录时让正文收窄居中
    (widget ?? mobile)?.closest(".post")?.classList.add("post--no-toc");
    return;
  }

  // 与 CSS 的 --anchor-offset 保持同一避让高度，读取失败时回退
  const anchorOffset =
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--anchor-offset"),
    ) || 88;

  let serial = 0;
  const links: { element: HTMLAnchorElement; id: string }[] = [];
  lists.forEach((list) => list.replaceChildren());

  headings.forEach((heading) => {
    if (!heading.id) {
      serial += 1;
      heading.id = `h-${serial}`;
    }
    const id = heading.id;

    // 桌面侧栏与移动端折叠目录共用同一份标题数据，分别生成列表项
    lists.forEach((list) => {
      const item = document.createElement("li");
      item.className = heading.tagName === "H3" ? "lvl-3" : "lvl-2";
      const link = document.createElement("a");
      link.href = `#${id}`;
      link.textContent = heading.textContent ?? "";
      // 目录使用自定义滚动偏移，禁止 Swup 再次接管锚点跳转
      link.setAttribute("data-no-swup", "");
      link.addEventListener("click", (event) => {
        event.preventDefault();
        mobile?.removeAttribute("open");
        const top = heading.getBoundingClientRect().top + window.scrollY - anchorOffset;
        window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
        history.replaceState(null, "", `#${id}`);
      });
      item.appendChild(link);
      list.appendChild(item);
      links.push({ element: link, id });
    });
  });

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach(({ element, id }) => {
          element.classList.toggle("active", id === entry.target.id);
        });
      });
    },
    { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
  );
  headings.forEach((heading) => observer.observe(heading));
  registerPageCleanup(() => observer.disconnect());
}
