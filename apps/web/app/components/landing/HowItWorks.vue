<script setup lang="ts">
import SectionHeading from './SectionHeading.vue';

const steps = [
  {
    title: 'Завантажте фото',
    text: 'Одна фотографія з телефона. Більше — точніша оцінка.',
  },
  {
    title: 'AI створює оголошення',
    text: 'Заголовок, опис, характеристики, ціна й покращені фото — за 15–25 секунд.',
  },
  {
    title: 'Публікуйте і продавайте',
    text: 'Перевірте, змініть що завгодно й натисніть «Опублікувати».',
  },
];
</script>

<template>
  <section id="how" class="py-24">
    <div class="container-page">
      <SectionHeading eyebrow="Як це працює" title="Три кроки замість тридцяти хвилин" />

      <ol class="grid gap-6 md:grid-cols-3">
        <li v-for="(step, index) in steps" :key="step.title" class="relative">
          <span
            class="grid h-12 w-12 place-items-center rounded-[var(--r-full)] bg-[linear-gradient(135deg,var(--brand-500),var(--brand-700))] text-lg font-bold text-white shadow-[var(--sh-brand)]"
          >{{ index + 1 }}</span>
          <h3 class="mt-5 text-[length:var(--t-h4)] font-semibold">{{ step.title }}</h3>
          <p class="mt-2 text-[var(--t-sm)] leading-relaxed text-text-secondary">{{ step.text }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>
