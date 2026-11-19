import SwupA11yPlugin from "@swup/a11y-plugin";
import SwupHeadPlugin from "@swup/head-plugin";
import SwupPreloadPlugin from "@swup/preload-plugin";
import SwupProgressPlugin from "@swup/progress-plugin";
import Swup from "swup";

import { closeLightbox } from "./lightbox";
import { initPage, initPageMotion } from "./page";
import { prefersReducedMotion, runPageCleanups } from "./utils";

/* ---------------- Swup 页面过渡 ---------------- */
/** 绕过全局平滑滚动，立即定位（兼容不支持 instant 的浏览器） */
function scrollInstant(target: "top" | Element) {
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  if (target === "top") {
    window.scrollTo(0, 0);
  } else {
    target.scrollIntoView({ block: "start", behavior: "auto" });
  }
  root.style.scrollBehavior = previous;
}

export function initSwup() {
  const swup = new Swup({
    containers: ["#swup"],
    animationSelector: ".transition-main",
    cache: true,
    native: false,
    plugins: [
      // 同步新页面 head 中的标题、样式与脚本资源，等待样式加载完成再切换
      new SwupHeadPlugin({
        persistAssets: true,
        awaitAssets: true,
        timeout: 3000,
      }),
      // 预加载悬停链接，减少等待时间
      new SwupPreloadPlugin({
        preloadHoveredLinks: true,
        preloadVisibleLinks: false,
        preloadInitialPage: false,
        throttle: 3,
      }),
      new SwupA11yPlugin({
        respectReducedMotion: true,
        headingSelector: ["main h1", "h1"],
        announcements: {
          "zh-CN": { visit: "已打开：{title}", url: "已打开新页面：{url}" },
          "*": { visit: "已打开：{title}", url: "已打开新页面：{url}" },
        },
      }),
      // 顶部细进度条，弱化等待感
      new SwupProgressPlugin({
        className: "narrate-progress",
        delay: 200,
        transition: 260,
        minValue: 0.08,
        initialValue: 0.2,
      }),
    ],
  });

  // 页面切换使用即时滚动，同页锚点保留平滑滚动
  swup.hooks.replace("scroll:top", () => {
    scrollInstant("top");
    return true;
  });

  swup.hooks.replace("scroll:anchor", (visit, { hash }) => {
    const target = swup.getAnchorElement(hash);
    if (!(target instanceof Element)) return false;
    const samePage = visit.from.url === visit.to.url;
    if (samePage && !prefersReducedMotion) {
      target.scrollIntoView({ block: "start", behavior: "smooth" });
    } else {
      scrollInstant(target);
    }
    return true;
  });

  swup.hooks.on("visit:start", (visit) => {
    closeLightbox();
    // 分页跳转后回到列表区域，而不是页面顶部
    if (visit.trigger.el?.closest(".page-navigator")) {
      visit.scroll.target = "pager-region";
    }
  });

  // 内容替换完成后先清理旧页面状态，再初始化新页面
  swup.hooks.on("content:replace", () => {
    runPageCleanups();
    initPage(true);
  });

  swup.hooks.on("visit:end", () => {
    initPageMotion();
  });
}
