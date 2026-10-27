// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages: the deploy workflow sets SITE_URL and BASE_PATH automatically.
// For a user site (SHINO-01.github.io) BASE_PATH is "/"; for a project repo it is "/<repo>".
export default defineConfig({
  site: process.env.SITE_URL || 'https://shino-01.github.io',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
  // keep fonts as separate files (fetched only when a glyph needs them) rather than base64 in the CSS
  vite: { build: { assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined) } },
});
