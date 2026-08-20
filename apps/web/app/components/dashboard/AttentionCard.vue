<script setup lang="ts">
import { formatKop } from '@ai-trade/utils';
import type { ListingSummary } from '@ai-trade/contracts';
import BaseButton from '~/components/BaseButton.vue';

defineProps<{ listing: ListingSummary; daysSincePublished: number }>();
</script>

<template>
  <section class="rounded-[var(--r-lg)] border border-warning-500 bg-warning-500/10 p-5">
    <h2 class="flex items-center gap-2 font-semibold">
      <span aria-hidden="true">⚠</span> AI знайшов проблему
    </h2>
    <p class="mt-2 text-[var(--t-sm)] leading-relaxed text-text-secondary">
      <strong class="text-text">{{ listing.title }}</strong> —
      {{ listing.viewsCount }} переглядів і жодного звернення за
      {{ daysSincePublished }} днів. Ціна {{ formatKop(listing.priceKop) }} вища за медіану
      по категорії.
    </p>
    <BaseButton
      class="mt-4"
      size="sm"
      :to="`/dashboard/listings/${listing.id}/advice`"
    >Подивитися розбір</BaseButton>
  </section>
</template>
