<script setup lang="ts">
import { formatKop } from '@ai-trade/utils/money';
import type { PriceRecommendation } from '@ai-trade/contracts';

const props = defineProps<{ price: PriceRecommendation; selectedKop: number }>();
const emit = defineEmits<{ select: [kop: number] }>();

const scenarios = computed(() => [
  {
    key: 'quickSale' as const,
    label: 'Швидкий продаж',
    kop: props.price.quickSaleKop,
    reason: props.price.reasoning.quickSale,
  },
  {
    key: 'optimal' as const,
    label: 'Оптимальна',
    kop: props.price.optimalKop,
    reason: props.price.reasoning.optimal,
    recommended: true,
  },
  {
    key: 'maximum' as const,
    label: 'Максимум',
    kop: props.price.maximumKop,
    reason: props.price.reasoning.maximum,
  },
]);
</script>

<template>
  <section class="rounded-[var(--r-lg)] border border-border bg-surface p-6">
    <h2 class="text-[length:var(--t-h4)] font-semibold">Рекомендація ціни</h2>
    <p class="mt-1 text-[var(--t-sm)] text-text-muted">
      Числа пораховані по {{ price.market.sampleSize }} схожих оголошеннях за 60 днів —
      AI лише пояснює їх.
    </p>

    <div class="mt-5 grid gap-3 sm:grid-cols-3">
      <button
        v-for="scenario in scenarios"
        :key="scenario.key"
        type="button"
        class="rounded-[var(--r-md)] border p-4 text-left transition-all duration-[var(--d-fast)]"
        :class="
          selectedKop === scenario.kop
            ? 'border-primary bg-primary-soft'
            : 'border-border bg-surface hover:border-border-strong'
        "
        :aria-pressed="selectedKop === scenario.kop"
        @click="emit('select', scenario.kop)"
      >
        <span class="flex items-center gap-1.5 text-[var(--t-xs)] font-semibold uppercase tracking-wide text-text-muted">
          {{ scenario.label }}
          <span v-if="scenario.recommended" class="text-success-500" aria-label="рекомендовано">✓</span>
        </span>
        <span class="mt-1.5 block text-xl font-extrabold tracking-tight">
          {{ formatKop(scenario.kop) }}
        </span>
        <span class="mt-2 block text-[var(--t-xs)] leading-relaxed text-text-secondary">
          {{ scenario.reason }}
        </span>
      </button>
    </div>

    <dl class="mt-5 grid grid-cols-2 gap-3 rounded-[var(--r-md)] bg-bg-subtle p-4 text-[var(--t-sm)] sm:grid-cols-4">
      <div>
        <dt class="text-text-muted">Медіана</dt>
        <dd class="font-semibold">{{ formatKop(price.market.medianKop) }}</dd>
      </div>
      <div>
        <dt class="text-text-muted">Діапазон p25–p75</dt>
        <dd class="font-semibold">
          {{ formatKop(price.market.p25Kop, { currency: false }) }}–{{ formatKop(price.market.p75Kop) }}
        </dd>
      </div>
      <div>
        <dt class="text-text-muted">Вибірка</dt>
        <dd class="font-semibold">{{ price.market.sampleSize }} оголошень</dd>
      </div>
      <div>
        <dt class="text-text-muted">Медіанний час продажу</dt>
        <dd class="font-semibold">{{ price.market.medianSellDays }} днів</dd>
      </div>
    </dl>

    <!-- Required under every price recommendation. -->
    <p class="mt-4 text-[var(--t-xs)] leading-relaxed text-text-muted">
      {{ price.disclaimer }}
    </p>
  </section>
</template>
