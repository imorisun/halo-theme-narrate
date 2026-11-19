import { qs } from "./utils";

/* ---------------- 主题切换 ---------------- */
export function initThemeToggle() {
  const root = document.documentElement;
  const button = qs<HTMLButtonElement>("#themeBtn");
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const apply = (dark: boolean) => {
    root.setAttribute("data-theme", dark ? "dark" : "light");
    // Halo 插件组件（评论 / 搜索等）通过该属性读取当前配色
    root.setAttribute("data-color-scheme", dark ? "dark" : "light");
    // 移动端地址栏颜色跟随主题切换
    const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColorMeta) themeColorMeta.content = dark ? "#121316" : "#fbfbfa";
    // 按钮文案说明「点击后会切换到哪种模式」，读屏用户可感知当前状态
    if (button) {
      const label = dark ? "切换到浅色模式" : "切换到深色模式";
      button.setAttribute("aria-label", label);
      button.title = label;
    }
  };

  apply(root.getAttribute("data-theme") === "dark");

  button?.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    apply(next === "dark");
    try {
      localStorage.setItem("narrate-theme", next);
    } catch {
      /* 隐私模式下忽略 */
    }
  });

  // 用户未手动选择过主题时，跟随系统配色变化
  media.addEventListener("change", (event) => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("narrate-theme");
    } catch {
      saved = null;
    }
    if (!saved) apply(event.matches);
  });
}
