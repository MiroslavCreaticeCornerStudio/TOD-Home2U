// Ported verbatim from the Webflow export index.html inline <script> block.

document.addEventListener('DOMContentLoaded', function () {
  const buttons = document.querySelector('.fixed_buttons');
  if (!buttons) return;
  // Sections that HIDE the buttons while in view.
  // rootMargin is the tuning knob.
  const hideSections = [
    { selector: '#hero',    rootMargin: '-65% 0px 0px 0px' },
    { selector: '#contact', rootMargin: '0px 0px -40% 0px' },
    { selector: '#footer',  rootMargin: '0px' },
  ];
  const active = new Set();
  const update = () => buttons.classList.toggle('is-hidden', active.size > 0);
  hideSections.forEach(({ selector, rootMargin }) => {
    const el = document.querySelector(selector);
    if (!el) return;
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.isIntersecting ? active.add(selector) : active.delete(selector);
      });
      update();
    }, { root: null, rootMargin, threshold: 0 }).observe(el);
  });
});
