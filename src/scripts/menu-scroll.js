// Ported verbatim from the Webflow export index.html inline <script> block.

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector("[data-menu-wrap]");
  if (!menu) return;
  const SCROLL_THRESHOLD = 88;
  const altButtons = document.querySelectorAll(".button.is-secondary.is-alternate");
  let scrolled = null;
  let ticking = false;
  function update() {
    const isScrolled = window.scrollY > SCROLL_THRESHOLD;
    if (isScrolled !== scrolled) {
      scrolled = isScrolled;
      menu.classList.toggle("is-scrolled", isScrolled);
      altButtons.forEach((btn) => btn.classList.toggle("is-alternate", !isScrolled));
    }
    ticking = false;
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
});
