<script setup lang="ts">
import BaseButton from '~/components/BaseButton.vue';

const trust = ['Безкоштовний старт', 'Без банківської картки', 'Українська мова'];
</script>

<template>
  <header class="relative overflow-hidden pt-20 pb-24 text-center">
    <!-- Brand glow behind the headline; decorative only. -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-60 [background:radial-gradient(60%_60%_at_50%_0%,var(--brand-100),transparent_70%)]"
    />

    <div class="container-page relative">
      <span
        class="inline-flex items-center gap-2 rounded-[var(--r-full)] border border-border bg-surface px-3.5 py-1.5 text-[var(--t-sm)] font-medium text-text-secondary shadow-[var(--sh-xs)]"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-accent-500" />
        Штучний інтелект замість форми на 12 полів
      </span>

      <h1
        class="mx-auto mt-7 max-w-4xl text-[length:var(--t-display)] font-extrabold leading-[1.05] tracking-[-0.03em]"
      >
        Продайте будь-яку річ за
        <span
          class="bg-[linear-gradient(120deg,var(--brand-500),var(--accent-500))] bg-clip-text text-transparent"
        >30 секунд</span>
        за допомогою AI
      </h1>

      <p class="mx-auto mt-6 max-w-2xl text-[length:var(--t-lg)] leading-relaxed text-text-secondary">
        AI створить оголошення, оцінить товар, покращить фото та допоможе знайти покупця.
        Ви лише завантажуєте фотографію.
      </p>

      <div class="mt-9 flex flex-wrap justify-center gap-3">
        <BaseButton variant="ai" size="lg" to="/sell">✨ Продати товар</BaseButton>
        <BaseButton variant="secondary" size="lg" to="/search">Знайти товар</BaseButton>
      </div>

      <ul class="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[var(--t-sm)] text-text-muted">
        <li v-for="item in trust" :key="item">✓ {{ item }}</li>
      </ul>
    </div>
  </header>
</template>
