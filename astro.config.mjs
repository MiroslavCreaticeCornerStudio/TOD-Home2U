// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

const SITE = process.env.SITE_URL || 'https://www.todbg.com';

// Static site + one serverless route (/api/lead) via the Vercel adapter.
export default defineConfig({
  site: SITE,
  output: 'static',
  adapter: vercel(),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/401') && !page.includes('/404') && !page.includes('/thank-you'),
    }),
  ],
});
