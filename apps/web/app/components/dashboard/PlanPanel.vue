<script setup lang="ts">
import { formatKop, remaining } from '@ai-trade/utils';
import type { SubscriptionState } from '@ai-trade/contracts';
import BaseButton from '~/components/BaseButton.vue';

const props = defineProps<{ plan: SubscriptionState }>();

/** Monthly prices, until GET /plans exists. */
const PRICE_KOP: Record<string, number> = { FREE: 0, PREMIUM: 19_900, BUSINESS: 49_900 };

const bars = computed(() => [
  {
    label: 'AI-створення',
    used: props.plan.usage.aiGenerations,
    limit: props.plan.limits.aiGenerations,
  },
  {
    label: 'Активні оголошення',
    used: props.plan.usage.activeListings,
    limit: props.plan.limits.activeListings,
  },
]);

/** Amber once the quota is nearly gone, so it is noticed before it blocks. */
function tone(used: number, limit: number | null) {
  if (limit === null) return 'bg-primary';
  const share = used / limit;
  if (share >= 1) return 'bg-danger-500';
  return share >= 0.8 ? 'bg-warning-500' : 'bg-primary';
}

const renewal = computed(() => {
  if (!props.plan.currentPeriodEnd) return null;
  const date = new Date(props.plan.currentPeriodEnd).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
  });
  return `Наступне списання — ${date}, ${formatKop(PRICE_KOP[props.plan.planCode] ?? 0)}`;
});
</script>

<template>
  <section class="rounded-[var(--r-lg)] border border-border bg-surface p-5">
    <h2 class="text-[length:var(--t-h4)] font-semibold">Тариф {{ plan.planName }}</h2>

    <dl class="mt-5 space-y-4">
      <div v-for="bar in bars" :key="bar.label">
        <div class="flex items-baseline justify-between gap-2">
          <dt class="text-[var(--t-sm)] text-text-secondary">{{ bar.label }}</dt>
          <dd class="text-[var(--t-sm)] font-semibold tabular-nums">
            {{ bar.used }} / {{ bar.limit === null ? '∞' : bar.limit }}
          </dd>
        </div>
        <div
          class="mt-2 h-2 overflow-hidden rounded-full bg-bg-inset"
          role="progressbar"
          :aria-valuenow="bar.used"
          :aria-valuemin="0"
          :aria-valuemax="bar.limit ?? bar.used"
          :aria-label="bar.label"
        >
          <div
            class="h-full rounded-full transition-[width] duration-500 ease-[var(--e-out)]"
            :class="tone(bar.used, bar.limit)"
            :style="{ width: bar.limit === null ? '100%' : `${Math.min(100, (bar.used / bar.limit) * 100)}%` }"
          />
        </div>
        <p
          v-if="bar.limit !== null && remaining(bar.used, bar.limit) === 0"
          class="mt-1.5 text-[var(--t-xs)] font-medium text-danger-500"
        >Ліміт вичерпано</p>
      </div>
    </dl>

    <p v-if="renewal" class="mt-5 text-[var(--t-xs)] text-text-muted">{{ renewal }}</p>

    <BaseButton
      v-if="plan.planCode === 'FREE'"
      class="mt-4 w-full"
      variant="ai"
      to="/#pricing"
    >Перейти на Premium</BaseButton>
  </section>
</template>
