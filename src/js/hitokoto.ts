import { prefersReducedMotion, qs, qsa } from "./utils";

/* ---------------- 轻言（plugin-hitokoto-hub） ---------------- */
const HITOKOTO_API = "/apis/public.api.hitokotohub.puresky.top/v1alpha1";
const LIKED_STORAGE = "narrate.hitokoto.liked";
const WALL_SIZE = 12;

const HEART_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.6 4.7 13.3a4.8 4.8 0 0 1 6.8-6.8l.5.5.5-.5a4.8 4.8 0 0 1 6.8 6.8Z"/></svg>';
const REFRESH_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 6.2"/><path d="M20 5v6h-6"/></svg>';
const COPY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>';

/** 句子字段：Finder 返回 SentenceVo（name），公开接口返回 SentenceItem（metaName） */
interface ApiSentence {
  name?: string;
  metaName?: string;
  content?: string;
  author?: string;
  source?: string;
  likeCount?: number;
  jumpUrl?: string;
}

/* ---------------- 点赞状态 ---------------- */
function readLiked(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(LIKED_STORAGE) || "[]");
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeLiked(names: string[]) {
  try {
    localStorage.setItem(LIKED_STORAGE, JSON.stringify(names));
  } catch {
    // 隐私模式下写入失败时仅保留本次会话内的视觉状态
  }
}

/* ---------------- 轻提示 ---------------- */
let toastTimer: number | undefined;

function showToast(message: string) {
  let toast = qs<HTMLElement>(".narrate-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "narrate-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast?.classList.remove("is-visible"), 2200);
}

/* ---------------- 数据请求 ---------------- */
function toSentences(payload: unknown): ApiSentence[] {
  const raw = Array.isArray(payload)
    ? payload
    : (payload as { sentences?: unknown } | null)?.sentences;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is ApiSentence => typeof item === "object" && item !== null)
    .map((item) => ({ ...item, name: item.name || item.metaName || "" }));
}

async function fetchRandom(limit: number, category: string | null): Promise<ApiSentence[]> {
  const params = new URLSearchParams({ limit: String(limit), encode: "json" });
  if (category) params.set("categoryName", category);
  const response = await fetch(`${HITOKOTO_API}/sentence/random?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(String(response.status));
  return toSentences(await response.json());
}

/* ---------------- 卡片与主句构建 ---------------- */
function likeHref(name: string): string {
  return `${HITOKOTO_API}/sentence/like?${new URLSearchParams({ name, action: "like" }).toString()}`;
}

function shareHref(name: string): string {
  return `${window.location.origin}/hitokoto?sentence=${encodeURIComponent(name)}`;
}

function buildLikeButton(sentence: ApiSentence, className: string): HTMLAnchorElement {
  const name = sentence.name ?? "";
  const link = document.createElement("a");
  link.className = className;
  link.dataset.hitoLike = "";
  link.dataset.noSwup = "";
  link.dataset.name = name;
  link.href = likeHref(name);
  link.setAttribute("role", "button");
  link.setAttribute("aria-pressed", "false");
  link.setAttribute("aria-label", "点赞");
  link.innerHTML = HEART_ICON;

  const count = document.createElement("span");
  count.dataset.hitoLikeCount = "";
  count.textContent = String(sentence.likeCount ?? 0);
  link.appendChild(count);
  return link;
}

function buildStage(sentence: ApiSentence, shareView: boolean): HTMLElement {
  const figure = document.createElement("figure");
  figure.className = "hito-stage";
  figure.dataset.hitoStage = "";
  figure.dataset.name = sentence.name ?? "";
  figure.dataset.jumpUrl = sentence.jumpUrl ?? "";

  const mark = document.createElement("span");
  mark.className = "hito-stage__mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = "“";
  figure.appendChild(mark);

  if (shareView) {
    const flag = document.createElement("span");
    flag.className = "hito-stage__flag";
    flag.textContent = "分享的句子";
    figure.appendChild(flag);
  }

  const quote = document.createElement("blockquote");
  quote.className = "hito-stage__quote";
  quote.dataset.hitoQuote = "";
  quote.textContent = sentence.content ?? "";
  figure.appendChild(quote);

  const meta = document.createElement("figcaption");
  meta.className = "hito-stage__meta";

  const author = document.createElement("span");
  author.className = "hito-stage__author";
  author.dataset.hitoAuthor = "";
  author.textContent = (sentence.author ?? "").trim() || "佚名";
  meta.appendChild(author);

  const source = (sentence.source ?? "").trim();
  if (source) {
    const sep = document.createElement("span");
    sep.className = "hito-stage__sep";
    sep.setAttribute("aria-hidden", "true");
    sep.textContent = "·";
    meta.appendChild(sep);

    const sourceLink = document.createElement("a");
    sourceLink.className = "hito-stage__src";
    sourceLink.dataset.hitoSource = "";
    sourceLink.textContent = `《${source}》`;
    if (sentence.jumpUrl) {
      sourceLink.href = sentence.jumpUrl;
      sourceLink.target = "_blank";
      sourceLink.rel = "noopener noreferrer";
    } else {
      sourceLink.classList.add("is-plain");
    }
    meta.appendChild(sourceLink);
  }
  figure.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "hito-stage__actions";

  if (!shareView) {
    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.className = "hito-act";
    refresh.dataset.hitoRefresh = "";
    refresh.innerHTML = REFRESH_ICON;
    refresh.appendChild(document.createTextNode("换一句"));
    actions.appendChild(refresh);
  }

  actions.appendChild(buildLikeButton(sentence, "hito-act hito-act--like"));

  const copy = document.createElement("a");
  copy.className = "hito-act";
  copy.dataset.hitoCopy = "";
  copy.dataset.noSwup = "";
  copy.href = shareHref(sentence.name ?? "");
  copy.setAttribute("role", "button");
  copy.innerHTML = COPY_ICON;
  copy.appendChild(document.createTextNode("分享"));
  actions.appendChild(copy);

  figure.appendChild(actions);
  return figure;
}

function buildCard(sentence: ApiSentence): HTMLElement {
  const card = document.createElement("article");
  card.className = "hito-card";
  card.dataset.hitoCard = "";
  card.dataset.name = sentence.name ?? "";

  const text = document.createElement("p");
  text.className = "hito-card__text";
  text.textContent = sentence.content ?? "";
  card.appendChild(text);

  const foot = document.createElement("div");
  foot.className = "hito-card__foot";

  const meta = document.createElement("span");
  meta.className = "hito-card__meta";

  const author = document.createElement("span");
  author.textContent = (sentence.author ?? "").trim() || "佚名";
  meta.appendChild(author);

  const source = (sentence.source ?? "").trim();
  if (source) {
    const sourceText = document.createElement("span");
    sourceText.textContent = `《${source}》`;
    meta.appendChild(sourceText);
  }
  foot.appendChild(meta);
  foot.appendChild(buildLikeButton(sentence, "hito-card__like"));
  card.appendChild(foot);

  if (sentence.jumpUrl) {
    const jump = document.createElement("a");
    jump.className = "hito-card__jump";
    jump.href = sentence.jumpUrl;
    jump.target = "_blank";
    jump.rel = "noopener noreferrer";
    jump.textContent = "阅读原文 →";
    card.appendChild(jump);
  }
  return card;
}

function buildEmpty(): HTMLElement {
  const empty = document.createElement("div");
  empty.className = "ff-empty";
  const title = document.createElement("b");
  title.textContent = "这个分类下还没有句子";
  const hint = document.createElement("span");
  hint.textContent = "换个分类看看，或到后台「工具 → 轻言管理」添加句子。";
  empty.append(title, hint);
  return empty;
}

/* ---------------- 状态同步 ---------------- */
function syncLikes(root: ParentNode) {
  const liked = readLiked();
  qsa<HTMLButtonElement>("[data-hito-like]", root).forEach((button) => {
    const isLiked = liked.includes(button.dataset.name ?? "");
    button.classList.toggle("is-liked", isLiked);
    button.setAttribute("aria-pressed", String(isLiked));
  });
}

function bumpLikeCount(root: ParentNode, name: string) {
  qsa<HTMLButtonElement>("[data-hito-like]", root).forEach((button) => {
    if (button.dataset.name !== name) return;
    const count = qs<HTMLElement>("[data-hito-like-count]", button);
    if (!count) return;
    const current = Number.parseInt(count.textContent ?? "0", 10) || 0;
    count.textContent = String(current + 1);
  });
}

function renderWall(wall: HTMLElement, sentences: ApiSentence[], shareView: boolean) {
  const fragment = document.createDocumentFragment();
  if (sentences.length) {
    fragment.appendChild(buildStage(sentences[0], shareView));
    sentences.slice(1).forEach((sentence) => fragment.appendChild(buildCard(sentence)));
  }
  wall.replaceChildren(fragment);
}

/* ---------------- 交互 ---------------- */
async function refreshStage(root: HTMLElement) {
  if (root.dataset.loading === "true") return;
  const stage = qs<HTMLElement>("[data-hito-stage]", root);
  if (!stage) return;

  root.dataset.loading = "true";
  try {
    const sentences = await fetchRandom(1, root.dataset.category || null);
    if (!sentences.length) {
      showToast("这个分类下还没有句子");
      return;
    }
    const next = buildStage(sentences[0], false);
    if (!prefersReducedMotion) next.classList.add("is-swapping");
    stage.replaceWith(next);
    syncLikes(root);
  } catch {
    showToast("换句失败，请稍后重试");
  } finally {
    root.dataset.loading = "false";
  }
}

async function switchCategory(root: HTMLElement, wall: HTMLElement, chip: HTMLElement) {
  if (root.dataset.loading === "true") return;

  const category = chip.dataset.hitoCat ?? "";
  qsa<HTMLElement>("[data-hito-cat]", root).forEach((item) => {
    const active = item === chip;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", String(active));
  });

  root.dataset.category = category;
  // 切换分类后进入常规浏览模式：首句恢复「换一句」操作
  root.dataset.shareView = "false";
  root.dataset.loading = "true";
  wall.classList.add("is-loading");

  try {
    const sentences = await fetchRandom(WALL_SIZE, category || null);
    renderWall(wall, sentences, false);
    if (!sentences.length) wall.appendChild(buildEmpty());
    syncLikes(root);
  } catch {
    showToast("加载失败，请稍后重试");
  } finally {
    wall.classList.remove("is-loading");
    root.dataset.loading = "false";
  }
}

/** 句子名称优先取 data-name，缺失时回退解析控件自身链接上的 name 参数 */
function resolveSentenceName(element: Element): string {
  const fromData = (element as HTMLElement).dataset.name;
  if (fromData) return fromData;
  if (element instanceof HTMLAnchorElement) {
    return new URL(element.href, window.location.href).searchParams.get("name") ?? "";
  }
  return "";
}

async function likeSentence(root: HTMLElement, button: HTMLElement, name: string) {
  if (button.dataset.busy === "true") return;
  if (!name) {
    showToast("句子信息缺失，请刷新页面后重试");
    return;
  }
  if (readLiked().includes(name)) {
    showToast("已经点过赞啦");
    return;
  }

  button.dataset.busy = "true";
  try {
    const response = await fetch(likeHref(name));
    if (!response.ok) throw new Error(String(response.status));
    writeLiked([...readLiked(), name]);
    syncLikes(root);
    bumpLikeCount(root, name);
    showToast("谢谢你的喜欢");
  } catch {
    showToast("点赞失败，请稍后重试");
  } finally {
    button.dataset.busy = "false";
  }
}

async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 交由下方兜底方案处理
    }
  }
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();
  const copied = document.execCommand("copy");
  helper.remove();
  return copied;
}

/** 复制分享链接：优先使用服务端渲染的分享地址，缺失时按当前句名拼装 */
async function copyShareLink(link: HTMLElement | null) {
  let url = link instanceof HTMLAnchorElement ? link.href : "";
  if (!url) {
    const stage = qs<HTMLElement>("[data-hito-stage]", document);
    const name = stage ? resolveSentenceName(stage) : "";
    url = name ? shareHref(name) : window.location.href;
  }
  const copied = await copyText(url);
  showToast(copied ? "分享链接已复制" : "复制失败，请手动复制地址栏链接");
}

/* ---------------- 页面初始化 ---------------- */
export function initHitokoto() {
  const root = qs<HTMLElement>("[data-hito-page]");
  const wall = root ? qs<HTMLElement>("[data-hito-wall]", root) : null;
  if (!root || !wall) return;

  // 插件尚未录入句子（或当前默认分类为空）时给出空态，避免整块留白
  if (!wall.querySelector("[data-hito-stage], [data-hito-card]")) {
    wall.appendChild(buildEmpty());
  }
  syncLikes(root);

  if (root.dataset.bound === "true") return;
  root.dataset.bound = "true";

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    // 点赞与分享使用真实链接承载句子名称，交由 JS 接管时阻止默认跳转
    const likeLink = target.closest<HTMLElement>("[data-hito-like]");
    if (likeLink) {
      event.preventDefault();
      void likeSentence(root, likeLink, resolveSentenceName(likeLink));
      return;
    }
    if (target.closest("[data-hito-refresh]")) {
      void refreshStage(root);
      return;
    }
    const copyLink = target.closest<HTMLElement>("[data-hito-copy]");
    if (copyLink) {
      event.preventDefault();
      void copyShareLink(copyLink);
      return;
    }
    const chip = target.closest<HTMLElement>("[data-hito-cat]");
    if (chip) void switchCategory(root, wall, chip);
  });
}
