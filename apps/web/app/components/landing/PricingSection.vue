<script setup lang="ts">
import { formatKop } from '@ai-trade/utils/money';
import SectionHeading from './SectionHeading.vue';
import BaseButton from '~/components/BaseButton.vue';
import { planCards } from '~/data/plans';

/** Money never reaches the template as a number — formatKop is the only formatter. */
const priceLabel = (priceKop: number) =>
  priceKop === 0 ? '0 ₴' : formatKop(priceKop);
</script>

<template>
  <section id="pricing" class="border-y border-border bg-bg-subtle py-24">
    <div class="container-page">
      <SectionHeading
        eyebrow="Тарифи"
        title="Оберіть свій тариф"
        lede="Почніть безкоштовно. Переходьте на платний, коли продажі стануть регулярними."
      />

      <div class="grid items-start gap-6 lg:grid-cols-3">
        <article
          v-for="plan in planCards"
          :key="plan.code"
          class="relative rounded-[var(--r-xl)] border bg-surface p-7"
          :class="
            plan.featured
              ? 'border-primary shadow-[var(--sh-lg)] lg:-mt-4 lg:pb-10'
              : 'border-border shadow-[var(--sh-xs)]'
          "
        >
          <span
            v-if="plan.featured"
            class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-[var(--r-full)] bg-primary px-3 py-1 text-[var(--t-xs)] font-semibold text-white"
          >★ Найпопулярніший</span>

          <h3 class="text-[length:var(--t-h3)] font-bold">{{ plan.name }}</h3>
          <p class="mt-1 text-[var(--t-sm)] text-text-muted">{{ plan.tagline }}</p>

          <p class="mt-6 flex items-baseline gap-1.5">
            <span class="text-4xl font-extrabold tracking-tight">{{ priceLabel(plan.priceKop) }}</span>
            <span class="text-[var(--t-sm)] text-text-muted">/ місяць</span>
          </p>

          <ul class="mt-7 space-y-3">
            <li
              v-for="feature in plan.features"
              :key="feature.label"
              class="flex items-start gap-2.5 text-[var(--t-sm)]"
              :class="feature.included ? 'text-text-secondary' : 'text-text-muted line-through'"
            >
              <span
                class="mt-0.5 shrink-0"
                :class="feature.included ? 'text-success-500' : 'text-text-muted'"
                aria-hidden="true"
              >{{ feature.included ? '✓' : '—' }}</span>
              <span>{{ feature.label }}</span>
            </li>
          </ul>

          <BaseButton
            class="mt-8 w-full"
            :variant="plan.featured ? 'primary' : 'secondary'"
            to="/sell"
          >{{ plan.cta }}</BaseButton>
        </article>
      </div>
    </div>
  </section>
</template>
