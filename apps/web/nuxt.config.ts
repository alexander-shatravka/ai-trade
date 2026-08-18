import tailwindcss from '@tailwindcss/vite';

/**
 * GitHub Pages serves this project from https://<user>.github.io/ai-trade/,
 * so every asset and route needs that prefix. Locally the prefix is empty,
 * which is why it comes from the environment rather than being hardcoded.
 */
const baseURL = process.env.NUXT_APP_BASE_URL ?? '/';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  nitro: {
    prerender: {
      routes: ['/', '/dashboard/listings/lst_88/advice'],
      // Follows <NuxtLink>s to prerender pages as they are added. Links to
      // routes that do not exist yet are reported but must not fail the build.
      crawlLinks: true,
      failOnError: false,
    },
  },

  app: {
    baseURL,
    head: {
      htmlAttrs: { lang: 'uk' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: `${baseURL}favicon.svg` }],
      // Applies the stored theme before first paint, so a dark-mode user does
      // not get a white flash while Vue hydrates.
      script: [
        {
          innerHTML:
            "(()=>{try{const t=localStorage.getItem('ai-trade-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch{}})()",
          tagPosition: 'head',
        },
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
});
