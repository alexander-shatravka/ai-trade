<script setup lang="ts">
import { formatKop } from '@ai-trade/utils/money';
import type { PricePosition } from '@ai-trade/contracts';

const props = defineProps<{ position: PricePosition; medianKop: number }>();

const prices = computed(() => props.position.items.map((i) => i.priceKop));
const minKop = computed(() => Math.min(...prices.value));
const maxKop = computed(() => Math.max(...prices.value));

/**
 * Bars are scaled across the observed range, not from zero: these prices differ
 * by ~20%, and a zero-based bar makes them look identical. The range is printed
 * below the chart so the scale is not hiding anything.
 */
const widthOf = (kop: number) => {
  const span = maxKop.value - minKop.value || 1;
  return `${Math.round(12 + ((kop - minKop.value) / span) * 88)}%`;
};
</script>

<template>
  <section class="rounded-[var(--r-lg)] border border-border bg-surface p-6">
    <h2 class="text-[length:var(--t-h4)] font-semibold">Позиція серед схожих</h2>
    <p class="mt-1 text-[var(--t-sm)] text-text-muted">
      Ваша ціна порівняно з {{ position.items.length - 1 }} найближчими за характеристиками
      оголошеннями. Медіана — {{ formatKop(medianKop) }}.
    </p>

    <ul class="mt-5 space-y-2">
      <li
        v-for="item in position.items"
        :key="`${item.label}-${item.priceKop}`"
        class="flex items-center gap-3"
      >
        <span class="w-11 shrink-0 text-right text-[var(--t-xs)] tabular-nums" :class="item.isYours ? 'font-bold' : 'text-text-muted'">
          {{ Math.round(item.priceKop / 100000) }}k
        </span>
        <span class="h-6 flex-1 overflow-hidden rounded-[var(--r-xs)] bg-bg-inset">
          <span
            class="block h-full rounded-[var(--r-xs)]"
            :class="item.isYours ? 'bg-danger-500' : 'bg-border-strong'"
            :style="{ width: widthOf(item.priceKop) }"
          />
        </span>
        <span
          class="w-40 shrink-0 truncate text-[var(--t-xs)]"
          :class="item.isYours ? 'font-semibold text-danger-500' : 'text-text-muted'"
        >{{ item.label }}</span>
      </li>
    </ul>

    <p class="mt-4 text-[var(--t-xs)] text-text-muted">
      Шкала охоплює діапазон {{ formatKop(minKop) }} – {{ formatKop(maxKop) }} і не починається
      з нуля — інакше різниця між цінами була б непомітною.
    </p>
  </section>
</template>
