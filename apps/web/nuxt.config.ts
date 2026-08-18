import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'uk' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
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
