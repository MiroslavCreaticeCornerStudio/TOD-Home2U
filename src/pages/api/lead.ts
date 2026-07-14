import type { APIRoute } from 'astro';

export const prerender = false;

const CRM_ENDPOINT = import.meta.env.CRM_ENDPOINT || 'https://skyguru.ai/api/v1/public/leads';
const CRM_FORM_NAME = import.meta.env.CRM_FORM_NAME || 'TOD - Home2U';
const BREVO_API_KEY = import.meta.env.BREVO_API_KEY;
const BREVO_LIST_ID = Number(import.meta.env.BREVO_LIST_ID || 16);

/**
 * Receives the contact form and forwards it to:
 *  1. SkyGuru CRM (public leads endpoint) — primary; the request fails if this fails.
 *  2. Brevo contacts (list BREVO_LIST_ID) — secondary; errors are logged, not fatal.
 *
 * CRM schema (probed via its validation responses): name (заглавие), phone
 * (required), email, form, utm_source/medium/campaign/term/content, gclid, fbclid.
 */
export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  const firstName = (body['First-Name'] || '').trim();
  const lastName = (body['Last-Name'] || '').trim();
  const email = (body['email'] || '').trim();
  const phone = (body['Phone'] || '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  if (!phone || !fullName || !email) {
    return json({ ok: false, error: 'Missing required fields' }, 422);
  }

  // UTM/click-id passthrough from the page URL the form was submitted on
  const utm: Record<string, string> = {};
  try {
    const pageUrl = new URL(body.page || '');
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid']) {
      const value = pageUrl.searchParams.get(key);
      if (value) utm[key] = value;
    }
  } catch {
    /* no page URL — skip UTM passthrough */
  }

  // 1) SkyGuru CRM — primary destination
  const crmResponse = await fetch(CRM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name: fullName, phone, email, form: CRM_FORM_NAME, ...utm }),
  });

  if (!crmResponse.ok) {
    const detail = await crmResponse.text().catch(() => '');
    console.error('CRM lead failed:', crmResponse.status, detail);
    return json({ ok: false, error: 'CRM rejected the lead' }, 502);
  }

  // 2) Brevo — add/update the contact in the configured list
  if (BREVO_API_KEY) {
    const attributes: Record<string, string> = { FIRSTNAME: firstName, LASTNAME: lastName };
    const normalizedPhone = phone.replace(/[^\d+]/g, '');
    if (/^\+?\d{7,15}$/.test(normalizedPhone)) {
      attributes.SMS = normalizedPhone.startsWith('+') ? normalizedPhone : `+359${normalizedPhone.replace(/^0/, '')}`;
    }

    const brevoCall = (attrs: Record<string, string>) =>
      fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'api-key': BREVO_API_KEY },
        body: JSON.stringify({ email, attributes: attrs, listIds: [BREVO_LIST_ID], updateEnabled: true }),
      });

    try {
      let brevoResponse = await brevoCall(attributes);
      if (!brevoResponse.ok && attributes.SMS) {
        // SMS numbers Brevo considers invalid make the whole call fail — retry without it
        const { SMS, ...withoutSms } = attributes;
        brevoResponse = await brevoCall(withoutSms);
      }
      if (!brevoResponse.ok) {
        console.error('Brevo contact failed:', brevoResponse.status, await brevoResponse.text().catch(() => ''));
      }
    } catch (err) {
      console.error('Brevo request error:', err);
    }
  } else {
    console.warn('BREVO_API_KEY not set — skipping Brevo sync');
  }

  return json({ ok: true });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
