// Ported verbatim from the Webflow export index.html inline <script> block.

function initLetterWave(root){
  const els = (root || document).querySelectorAll('[data-letter-wave]');
  els.forEach(el => {
    if (el.dataset.lwInit) return;        // don't split twice
    el.dataset.lwInit = 'true';
    // Use an inner label if present, otherwise the element's own text.
    const source = el.querySelector('[data-letter-wave-text]') || el;
    const text = source.textContent.trim();
    if (!text) return;
    const wrap = document.createElement('span');
    wrap.className = 'lw-text';
    [...text].forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.setProperty('--index', i);
      if (char === ' ') span.style.whiteSpace = 'pre';
      wrap.appendChild(span);
    });
    source.textContent = '';
    source.appendChild(wrap);
  });
}
document.addEventListener('DOMContentLoaded', () => {
  document.fonts.ready.then(() => initLetterWave());
});
