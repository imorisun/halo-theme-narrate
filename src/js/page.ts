import { initReadTime, initRelativeTimes, initToc } from "./content";
import { initHitokoto } from "./hitokoto";
import { initContentImages } from "./lightbox";
import { initArchiveCounts, initLinkCaptcha, initLinkCards, initLinkFilter } from "./links";
import {
  initMomentComments,
  initMomentSummary,
  initMomentTagLinks,
  initMomentUpvote,
  initMoments,
} from "./moments";
import { initClock, initCounters, initReveal, initRotatingWord } from "./motion";
import { initNavActive } from "./navigation";
import { initPhotoFilter } from "./photos";
import { qs, replayContentScripts } from "./utils";

/* ---------------- 页面级初始化 ---------------- */
export function initPage(replayScripts = false) {
  if (replayScripts) {
    const container = qs<HTMLElement>("#swup") ?? document.body;
    replayContentScripts(container);
  }

  initClock();
  initRotatingWord();
  initMoments();
  initRelativeTimes();
  initReadTime();
  initContentImages();
  initToc();
  initLinkCards();
  initLinkFilter();
  initPhotoFilter();
  initHitokoto();
  initArchiveCounts();
  initLinkCaptcha();
  initMomentUpvote();
  initMomentSummary();
  initMomentTagLinks();
  initMomentComments();
}

/** 入场动画结束后再触发滚动浮现，避免与页面过渡叠加 */
export function initPageMotion() {
  initReveal();
  initCounters();
  initNavActive();
  // 刷新滚动进度条与回到顶部按钮状态
  window.dispatchEvent(new Event("scroll"));
}
