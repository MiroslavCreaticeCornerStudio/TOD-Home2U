# TOD — Home2U · Webflow → Astro migration map

Source: `../tod-staging.webflow/` (export of https://tod-staging.webflow.io/, 2026-07-14)
Method: `from-webflow-to-astro-main` skill v5 discipline (gates not installed — applied manually).

## Site map (Phase 0.5 — confirmed with the user)

| Route | Source HTML | Notes |
|---|---|---|
| `/` | `index.html` | One-page site, Bulgarian, anchor navigation |
| `/404` | `404.html` | Utility page; CDN SVG localized |
| `/401` | `401.html` | Visual only — Webflow password auth (`/.wf_auth`) does not exist outside Webflow |
| — dropped | `style-guide.html`, `components-library.html`, `marketing-elements.html`, `form-styling-validation.html`, `template-page.html`, `detail_cms-template-duplicate-and-modify.html` | Template developer references, not linked from the site |

No CMS (`w-dyn-list` count: 0 on every page). No Webflow Ecommerce/Memberships/Logic.

## COMPONENTS_MAP (index.html body order)

| Component | Source anchor | JS it depends on |
|---|---|---|
| `Navbar.astro` | `nav.nav` | meganav (GSAP directional hover), menu-scroll (`.is-scrolled` ≥88px) |
| `FixedButtons.astro` | `div.fixed_buttons` | fixed-buttons (IntersectionObserver hide near #hero/#contact/#footer) |
| `Hero.astro` | `#hero section_hero` | parallax (`[data-parallax-layers]`), letter-wave |
| `KeyBenefits.astro` | `#project section_key-benefits` | — |
| `StickyFeatures.astro` | `#comfort sticky-features__wrap` | sticky-features (ScrollTrigger pin, desktop ≥992px only) |
| `Location.astro` | `#location section_location` | — |
| `Apartments.astro` | `#apartments section_apartments` | — |
| `Benefits.astro` | `#benefits section_benefits` | — |
| `Contact.astro` | `section_contact` (contains `#contact` anchor) | form-validation (tippy error tooltips) |
| `Footer.astro` | `footer.footer` | footer-year |

## STYLE_MAP (CSS is served verbatim — Rule 13)

Load order in BaseLayout:
1. `normalize.css` (355 lines, verbatim)
2. `tod-staging.css` (6418 lines, verbatim — Client-First custom classes + @font-face TT Firs Neue Trial → `/fonts/`)
3. `components.css` (1800 lines, verbatim)
4. vendor: `tippy.css` + `themes/light.css` + `animations/shift-away.css`, `lenis.css` (from npm)
5. `global-inline.css` — merge of the 8 inline `<style>` blocks from index.html `<head>`/body, in source order:
   - 00 font-smoothing reset · 01 w-embed global styles (color inheritance, focus-visible, hide helpers) · 02–03 mega-nav states · 04 fixed_buttons transitions · 05 sticky-features (incl. `.wf-design-mode` rules — dead outside Designer, kept for fidelity) · 06 benefits grid borders · 07 form field icon states

No `webflow.css` utility file in this export (site uses almost no `w-*` components — only `w-form`/`w-input`/`w-button` classes, whose rules live in tod-staging.css).

## ANIMATION_MAP (no IX2 — zero `data-w-id`; all animation is hand-written inline JS)

| # | Block | Port target | Vendor deps |
|---|---|---|---|
| 0 | GTM `GTM-KNWQ7KNQ` | keep inline in `<head>` (partytown not requested) | — |
| 1 | `initMegaNavDirectionalHover` | `src/scripts/meganav.js` | gsap |
| 2 | `initParallaxLayers` | `src/scripts/parallax.js` | gsap + ScrollTrigger |
| 3 | `initStickyFeatures` | `src/scripts/sticky-features.js` | gsap + ScrollTrigger (matchMedia ≥992px) |
| 4 | fixed buttons observer | `src/scripts/fixed-buttons.js` | — |
| 5 | form validation (OLD duplicate) | **dropped** — superseded by block 6 (same `initAdvancedFormValidation` name, block 6 redefines and re-runs; block 6 is the version with tippy tooltips) | — |
| 6 | `initAdvancedFormValidation` | `src/scripts/form-validation.js` (+ submit rewired to `/api/lead`) | tippy.js@5 (+popper implicit) |
| 7 | Lenis + GSAP ticker wiring | `src/scripts/smooth-scroll.js` — must run before ScrollTrigger animations | lenis@1.3.25, gsap 3.15 |
| 8 | `initLetterWave` | `src/scripts/letter-wave.js` | gsap |
| 9 | footer year | `src/scripts/footer-year.js` | — |
| 10 | menu scroll state | `src/scripts/menu-scroll.js` | — |

Dropped runtimes: **jQuery** and **`js/tod-staging.js`** (Webflow tram runtime) — nothing uses them: no `w-nav`, no `w-slider`, no IX2, and the only `w-form` gets a custom submit handler.

Vendor versions pinned to what the live site loads: `gsap@3.15.0`, `lenis@1.3.25`, `tippy.js@5.x` + `popper.js@1.x`.

## Form (Phase 0.5 decision — user supplied)

- Endpoint: serverless `POST /api/lead` (Astro endpoint, Vercel adapter)
- Forwards to: `https://skyguru.ai/api/v1/public/leads` with form name **"TOD - Home2U"**, and Brevo contacts (list **16**)
- `BREVO_API_KEY` from environment only — never in client code or the repo

## Known source quirks (do not "fix" silently)

- Fonts are **TT Firs Neue *Trial*** — trial-licensed webfonts shipped to production; flagged to the owner.
- Inline block 5 vs 6: index.html ships two versions of the form-validation script; both execute on live. Only the final (block 6) behavior is ported.
- 401 password flow is Webflow-hosted; the page is kept visually, the form cannot authenticate.
- `404.html`/`401.html` reference Webflow CDN SVGs (`page-not-found`, `utility-lock`) — downloaded to `/images/`.
