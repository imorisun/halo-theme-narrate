import "../css/style.css";
import { initImageLightbox } from "./lightbox";
import { initScrollUi } from "./motion";
import { initNavigation } from "./navigation";
import { initPage, initPageMotion } from "./page";
import { initSearch } from "./search";
import { initSwup } from "./swup";
import { initThemeToggle } from "./theme";

/* ---------------- 启动 ---------------- */
function boot() {
  initThemeToggle();
  initSearch();
  initNavigation();
  initScrollUi();
  initImageLightbox();
  initPage();
  initPageMotion();
  initSwup();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
