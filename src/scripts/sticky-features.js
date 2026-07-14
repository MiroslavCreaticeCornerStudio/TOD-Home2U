// Ported verbatim from the Webflow export index.html inline <script> block.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function initStickyFeatures(root){
  const wraps = Array.from((root || document).querySelectorAll("[data-sticky-feature-wrap]"));
  if(!wraps.length) return;
  const DESKTOP = "(min-width: 992px)"; // Webflow desktop — change to 1154px etc. if you need
  const mm = gsap.matchMedia();
  mm.add(DESKTOP, () => {
    const cleanups = [];
    wraps.forEach(w => {
      const pinEl = w.querySelector("[data-sticky-feature-pin]") || w; // the 100vh inner container
      const items = Array.from(w.querySelectorAll("[data-sticky-feature-item]"));
      const progressBar = w.querySelector("[data-sticky-feature-progress]");
      const count = items.length;
      if(count < 1) return;
      const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const DURATION = rm ? 0.01 : 0.75;
      const SCROLL_AMOUNT = 0.9;
      const getTexts = el => Array.from(el.querySelectorAll("[data-sticky-feature-text]"));
      const getDivider = el => el.querySelector("[data-divider]"); // ← one divider per item now
      gsap.set(items[0], { autoAlpha: 1 });
      /* Dividers: visible by default on the active (first) item, collapsed on the rest.
         NOT tied to scrub — they animate as part of each text transition. */
      const dividers = items.map(getDivider);
      dividers.forEach((d, i) => { if (d) gsap.set(d, { width: i === 0 ? "100%" : "0%" }); });
      /* ── Intro phase (runs while the box is already fixed at 100vh):
            collapse pretitle + title (height AND margins/padding so no phantom gap). ── */
      const header = [
        w.querySelector("[data-pretitle]"),
        w.querySelector("[data-title]")
      ].filter(Boolean);
      let introTL = null;
      const hasIntro = header.length > 0;
      if (hasIntro) {
        introTL = gsap.timeline({ paused: true });
        gsap.set(header, { overflow: "hidden", transformOrigin: "top" });
        introTL.to(header, {
          autoAlpha: 0,
          y: -30,
          height: 0,
          marginTop: 0,
          marginBottom: 0,
          paddingTop: 0,
          paddingBottom: 0,
          ease: "none",
          stagger: 0.1,
          duration: 1
        }, 0);
      }
      let currentIndex = 0;
      function transition(fromIndex, toIndex){
        if(fromIndex === toIndex) return;
        animateOut(items[fromIndex]);
        animateIn(items[toIndex]);
      }
      function animateOut(itemEl){
        const texts = getTexts(itemEl);
        const divider = getDivider(itemEl);
        gsap.to(texts, {
          autoAlpha: 0, y: -30, ease: "power4.out", duration: 0.4,
          onComplete: () => gsap.set(itemEl, { autoAlpha: 0 })
        });
        if (divider) gsap.to(divider, { width: "0%", ease: "power4.out", duration: 0.4 });
      }
      function animateIn(itemEl){
        const texts = getTexts(itemEl);
        const divider = getDivider(itemEl);
        gsap.set(itemEl, { autoAlpha: 1 });
        gsap.fromTo(texts, { autoAlpha: 0, y: 30 }, {
          autoAlpha: 1, y: 0, ease: "power4.out", duration: DURATION, stagger: 0.1
        });
        if (divider) gsap.fromTo(divider, { width: "0%" }, { width: "100%", ease: "power4.out", duration: DURATION });
      }
      const steps = Math.max(1, count - 1);
      const INTRO_UNITS = hasIntro ? 0.5 : 0;
      const totalUnits = steps + INTRO_UNITS;
      const introFrac = totalUnits > 0 ? INTRO_UNITS / totalUnits : 0;
      ScrollTrigger.create({
        trigger: pinEl,
        start: "center center",
        end: () => `+=${totalUnits * 100}%`,
        pin: pinEl,
        pinSpacing: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: self => {
          const total = self.progress;
          // Phase 1: intro (header collapse only)
          if (introTL) {
            const ip = introFrac > 0 ? Math.min(total / introFrac, 1) : 1;
            introTL.progress(ip);
          }
          // Phase 2: text + divider step transitions on the remaining scroll
          const stepsRaw = introFrac < 1 ? Math.max(0, (total - introFrac) / (1 - introFrac)) : 0;
          const p = Math.min(stepsRaw, SCROLL_AMOUNT) / SCROLL_AMOUNT;
          let idx = Math.floor(p * steps + 1e-6);
          idx = Math.max(0, Math.min(steps, idx));
          gsap.to(progressBar, { scaleX: p, ease: "none" });
          if (idx !== currentIndex) {
            transition(currentIndex, idx);
            currentIndex = idx;
          }
        }
      });
      // Clear inline styles left by scroll-time tweens when leaving desktop
      cleanups.push(() => {
        const textEls = items.flatMap(getTexts);
        gsap.set([...items, ...textEls, ...dividers, progressBar, ...header].filter(Boolean), { clearProps: "all" });
      });
    });
    return () => cleanups.forEach(fn => fn());
  });
}
document.addEventListener("DOMContentLoaded", () => {
  initStickyFeatures();
});
// Recalc after fonts/Webflow settle so pin measurements are final
window.addEventListener("load", () => ScrollTrigger.refresh());
