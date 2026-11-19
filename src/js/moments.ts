import { prefersReducedMotion, qs, qsa } from "./utils";

/* ---------------- 瞬间横向翻页 ---------------- */
export function initMoments() {
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

/* ---------------- 瞬间卡片摘要 ---------------- */
// 插件渲染的 #标签 链接既可能是相对的 `?tag=xxx`，也可能是绝对的 `/moments?tag=xxx`
const MOMENT_TAG_LINK_PATTERN = /^(?:\.\/)?\?tag=|\/moments\?tag=/;

export function initMomentSummary(root: ParentNode = document) {
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
export function initMomentTagLinks(root: ParentNode = document) {
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

export function initMomentUpvote(root: ParentNode = document) {
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

export function initMomentComments(root: ParentNode = document) {
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
