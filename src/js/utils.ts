export const qs = <T extends Element>(selector: string, root: ParentNode = document): T | null =>
  root.querySelector<T>(selector);
export const qsa = <T extends Element>(selector: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll<T>(selector));

export const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- 页面级生命周期（Swup 切换前后） ---------------- */
let pageCleanups: Array<() => void> = [];

/** 注册当前页面需要释放的监听 / 定时器，切换页面时统一清理，避免重复累积 */
export function registerPageCleanup(cleanup: () => void) {
  pageCleanups.push(cleanup);
}

export function runPageCleanups() {
  pageCleanups.forEach((cleanup) => {
    try {
      cleanup();
    } catch {
      /* 单个清理失败不影响后续页面初始化 */
    }
  });
  pageCleanups = [];
}

/** 重新执行内容区域内的脚本（如评论组件等第三方脚本） */
export function replayContentScripts(root: ParentNode) {
  qsa<HTMLScriptElement>("script", root).forEach((script) => {
    if (script.hasAttribute("data-swup-ignore-script")) return;
    // 通过重新创建 script 节点触发执行，保留原有属性与内联代码
    const clone = document.createElement("script");
    Array.from(script.attributes).forEach((attribute) => {
      clone.setAttribute(attribute.name, attribute.value);
    });
    clone.textContent = script.textContent;
    script.replaceWith(clone);
  });
}
