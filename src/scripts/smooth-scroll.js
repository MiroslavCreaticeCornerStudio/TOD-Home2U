// Ported verbatim from the Webflow export index.html inline <script> block.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({
    lerp: 0.1,          // smoothness: 0.05 = very smooth, 0.2 = snappy
    smoothWheel: true,
    autoRaf: false,     // CRITICAL: GSAP drives the loop, not Lenis
    anchors: true       // native handling for in-page #anchor links
  });
  // Keep ScrollTrigger's positions in sync with Lenis on every scroll
  lenis.on("scroll", ScrollTrigger.update);
  // Single RAF loop — GSAP's ticker drives Lenis
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000); // GSAP ticker is seconds, Lenis expects ms
  });
  // No lag smoothing, or scroll can drift out of sync
  gsap.ticker.lagSmoothing(0);
  // Recalculate after fonts/images/CMS content settle
  window.addEventListener("load", () => ScrollTrigger.refresh());
