<script setup lang="ts">
import AppLogo from '~/components/AppLogo.vue';

const columns = [
  {
    title: 'Продукт',
    links: [
      { to: '#features', label: 'Можливості' },
      { to: '#how', label: 'Як це працює' },
      { to: '#pricing', label: 'Тарифи' },
      { to: '#roadmap', label: 'Розвиток' },
    ],
  },
  {
    title: 'Компанія',
    links: [
      { to: '/about', label: 'Про нас' },
      { to: '/business', label: 'Для бізнесу' },
      { to: '/contacts', label: 'Контакти' },
    ],
  },
  {
    title: 'Правові',
    links: [
      { to: '/terms', label: 'Правила користування' },
      { to: '/privacy', label: 'Політика конфіденційності' },
      { to: '/privacy#ai', label: 'Використання AI' },
    ],
  },
  {
    title: 'Підтримка',
    links: [
      { to: '/contacts', label: 'Написати нам' },
      { to: '/contacts#business', label: 'Бізнес-звернення' },
      { to: '/contacts#report', label: 'Повідомити про порушення' },
    ],
  },
];

const year = new Date().getFullYear();
</script>

<template>
  <footer class="mt-24 border-t border-border bg-bg-subtle py-16">
    <div class="container-page">
      <div class="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <div class="max-w-sm">
          <AppLogo />
          <p class="mt-4 text-[var(--t-sm)] leading-relaxed text-text-secondary">
            AI Trade створений, щоб змінити спосіб продажу товарів. Ми використовуємо штучний
            інтелект, щоб зробити створення оголошень простим, швидким і доступним для кожного.
          </p>
        </div>

        <div v-for="column in columns" :key="column.title">
          <h5 class="mb-3 text-[var(--t-xs)] font-semibold uppercase tracking-wider text-text-muted">
            {{ column.title }}
          </h5>
          <ul class="space-y-2">
            <li v-for="link in column.links" :key="link.label">
              <NuxtLink
                :to="link.to"
                class="text-[var(--t-sm)] text-text-secondary transition-colors hover:text-text"
              >{{ link.label }}</NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <div
        class="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-[var(--t-sm)] text-text-muted sm:flex-row sm:justify-between"
      >
        <span>© {{ year }} AI Trade. Усі права захищено.</span>
        <span>Зроблено в Україні 🇺🇦</span>
      </div>
    </div>
  </footer>
</template>
