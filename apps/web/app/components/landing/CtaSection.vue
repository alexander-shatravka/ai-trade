<script setup lang="ts">
import BaseButton from '~/components/BaseButton.vue';
</script>

<template>
  <section class="py-24">
    <div class="container-page">
      <div
        class="rounded-[var(--r-2xl)] bg-[linear-gradient(135deg,var(--brand-600),var(--brand-800))] px-8 py-16 text-center shadow-[var(--sh-brand)]"
      >
        <h2 class="text-[length:var(--t-h2)] font-bold tracking-[-0.02em] text-white">
          Спробуйте прямо зараз — це безкоштовно
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-[length:var(--t-lg)] text-white/80">
          Завантажте фото будь-якої речі й подивіться, що AI напише за вас.
        </p>
        <div class="mt-8 flex justify-center">
          <BaseButton variant="secondary" size="lg" to="/sell">✨ Створити оголошення</BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>
