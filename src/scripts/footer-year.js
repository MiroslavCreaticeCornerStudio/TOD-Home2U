// Ported verbatim from the Webflow export index.html inline <script> block.

document.addEventListener('DOMContentLoaded', function () {
    const yearSpan = document.getElementById('footer-year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }
  });
