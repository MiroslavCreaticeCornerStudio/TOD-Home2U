# TOD — Home2U

One-page real-estate site for the TOD residential project (Манастирски ливади, Изток), migrated pixel-perfect from Webflow (https://tod-staging.webflow.io/) to Astro.

## Stack

- **Astro 5** (static output) + **@astrojs/vercel** (one serverless route: `/api/lead`)
- Plain CSS carried over verbatim from the Webflow export (Client-First naming) — no Tailwind
- **GSAP 3.15 + ScrollTrigger** (mega nav, parallax, sticky features), **Lenis 1.3.25** (smooth scroll), **tippy.js 5** (form error tooltips) — same versions the live site loads, but npm-bundled instead of CDN
- jQuery and the Webflow runtime were dropped — nothing in this site uses them

## Develop

```bash
npm install
cp .env.example .env   # fill in BREVO_API_KEY
npm run dev            # http://localhost:4321
npm run build          # production build (dist/ + .vercel/output)
```

## Deploy (Vercel)

1. Push this folder to a Git repo and import it in Vercel (framework auto-detected as Astro).
2. Set Environment Variables in Vercel → Project → Settings:
   - `BREVO_API_KEY` (required for the Brevo sync)
   - `BREVO_LIST_ID` = `16`
   - `CRM_ENDPOINT` = `https://skyguru.ai/api/v1/public/leads` (default, override if it changes)
   - `CRM_FORM_NAME` = `TOD - Home2U`
   - `SITE_URL` = the final domain (used for canonical/OG/sitemap URLs)
3. After the first deploy, submit one test enquiry and confirm it arrives in the SkyGuru CRM and the Brevo list.

## Contact form architecture

Browser → `POST /api/lead` (serverless, [src/pages/api/lead.ts](src/pages/api/lead.ts)) → forwards to:
1. **SkyGuru CRM** — `{ name, phone, email, form: "TOD - Home2U", utm_*, gclid, fbclid }`. Primary: if the CRM rejects, the visitor sees the error state.
2. **Brevo** — contact upsert into list 16 (FIRSTNAME/LASTNAME/SMS attributes). Secondary: failures are logged, never block the lead.

The Brevo API key lives only in environment variables — never in client code or this repo.
UTM parameters and click IDs present on the page URL when the visitor submits are passed to the CRM automatically.

## Notes / known quirks (inherited from the original site, kept for fidelity)

- **Fonts are "TT Firs Neue Trial"** — trial-licensed files shipped by the Webflow site. Consider purchasing a production license or swapping the font.
- The mobile menu shows a white logo/CTA on white background when opened before scrolling — the live Webflow site does the same.
- `/401` is a visual replica only; Webflow's password protection does not exist outside Webflow.
- GTM container `GTM-KNWQ7KNQ` is kept as-is.
- The console warning “GSAP target [object NodeList] not found” also appears on the live Webflow site.

## Docs

- [docs/MIGRATION_MAP.md](docs/MIGRATION_MAP.md) — full source→component mapping, style/animation inventory, and migration decisions.
