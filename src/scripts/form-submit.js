// Replaces the Webflow-hosted form handler: posts the contact form to our
// serverless endpoint (/api/lead → SkyGuru CRM + Brevo), redirects to
// /thank-you on success, and shows the Webflow .w-form-fail UI on error.
function initFormSubmit() {
  document.querySelectorAll('.w-form form').forEach((form) => {
    const wrapper = form.closest('.w-form');
    const fail = wrapper?.querySelector('.w-form-fail');
    const submitBtn = form.querySelector('input[type="submit"]');
    let busy = false;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (busy) return;
      busy = true;

      const originalValue = submitBtn?.value;
      if (submitBtn && submitBtn.dataset.wait) submitBtn.value = submitBtn.dataset.wait;

      try {
        const data = Object.fromEntries(new FormData(form).entries());
        const response = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, page: window.location.href }),
        });
        if (!response.ok) throw new Error(`lead endpoint responded ${response.status}`);
        window.location.assign('/thank-you');
        return;
      } catch (err) {
        console.error('Form submission failed:', err);
        if (fail) fail.style.display = 'block';
      } finally {
        if (submitBtn && originalValue) submitBtn.value = originalValue;
        busy = false;
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initFormSubmit();
});
