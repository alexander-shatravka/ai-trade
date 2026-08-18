<script setup lang="ts">
import { formatKop } from '@ai-trade/utils/money';
import type { DiagnoseInput } from '@ai-trade/contracts';

const props = defineProps<{ input: DiagnoseInput }>();

const ctr = computed(() => {
  const { impressionsCount, viewsCount } = props.input.stats;
  if (impressionsCount === 0) return '—';
  return `${((viewsCount / impressionsCount) * 100).toFixed(1)}%`;
});

const rows = computed(() => [
  { label: 'Покази у пошуку', value: props.input.stats.impressionsCount.toLocaleString('uk-UA') },
  { label: 'Перегляди', value: props.input.stats.viewsCount.toLocaleString('uk-UA') },
  { label: 'CTR', value: ctr.value },
  { label: 'Збереження', value: String(props.input.stats.savesCount) },
  { label: 'Звернення', value: String(props.input.stats.contactsCount), alarming: props.input.stats.contactsCount === 0 },
]);
</script>

<template>
  <aside class="space-y-5">
    <section class="rounded-[var(--r-lg)] border border-border bg-surface p-5">
      <h2 class="text-[length:var(--t-h4)] font-semibold">Ваше оголошення</h2>
      <p class="mt-3 font-medium">{{ input.listing.title }}</p>
      <p class="mt-1 text-xl font-extrabold">{{ formatKop(input.listing.priceKop) }}</p>
      <p class="mt-2 text-[var(--t-sm)] text-text-muted">
        {{ input.listing.categoryName }} · {{ input.listing.photoCount }} фото ·
        опубліковано {{ input.stats.daysSincePublished }} днів тому
      </p>
    </section>

    <section class="rounded-[var(--r-lg)] border border-border bg-surface p-5">
      <h2 class="text-[length:var(--t-h4)] font-semibold">Динаміка</h2>
      <dl class="mt-4 space-y-3">
        <div v-for="row in rows" :key="row.label" class="flex items-baseline justify-between gap-3">
          <dt class="text-[var(--t-sm)] text-text-secondary">{{ row.label }}</dt>
          <dd
            class="font-semibold tabular-nums"
            :class="row.alarming ? 'text-danger-500' : ''"
          >{{ row.value }}</dd>
        </div>
      </dl>
    </section>
  </aside>
</template>
