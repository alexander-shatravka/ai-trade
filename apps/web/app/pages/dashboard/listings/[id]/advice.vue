<script setup lang="ts">
import {
  diagnoseListing,
  lockAdvice,
  demoDiagnoseInput,
  demoPricePosition,
} from '@ai-trade/ai';
import HealthScore from '~/components/advisor/HealthScore.vue';
import FindingCard from '~/components/advisor/FindingCard.vue';
import PricePositionChart from '~/components/advisor/PricePositionChart.vue';
import ListingStatsPanel from '~/components/advisor/ListingStatsPanel.vue';
import UpgradePrompt from '~/components/advisor/UpgradePrompt.vue';
import BaseButton from '~/components/BaseButton.vue';

const route = useRoute();
const { allows } = useAuth();
const { ready } = useRequireAuth();

useHead({ title: 'Чому не продається — AI Trade' });

/**
 * No API and no auth yet, so the listing comes from a fixture and the plan from
 * ?plan=free. When the backend exists this becomes
 * GET /listings/{id}/advice, which already applies the lock server-side.
 */
const input = demoDiagnoseInput;

// The lock now follows the signed-in plan rather than a query parameter. The
// session is restored on the client, so `ready` gates the first render — until
// then we must not decide, or the page would flash the wrong version.
const adviceEntitlement = computed(() => allows('ai.advice'));
const isFree = computed(() => !adviceEntitlement.value.allowed);

// The timestamp is fixed so the prerendered page and the hydrated one agree.
const fullAdvice = diagnoseListing(input, new Date('2026-08-18T09:00:00.000Z'));
const advice = computed(() => (isFree.value ? lockAdvice(fullAdvice) : fullAdvice));

const applied = ref<string[]>([]);
function apply(actionId: string) {
  // POST /listings/{id}/advice/apply goes here; for now the effect is local.
  if (!applied.value.includes(actionId)) applied.value.push(actionId);
}
function applyAll() {
  for (const finding of advice.value.findings) {
    if (finding.action) apply(finding.action.id);
  }
}

const hiddenCount = computed(() => fullAdvice.findings.length - advice.value.findings.length);
const allApplied = computed(() =>
  advice.value.findings.every((f) => !f.action || applied.value.includes(f.action.id)),
);

const headline = computed(() => {
  if (advice.value.findings.length === 0) return 'Оголошення виглядає добре';
  return advice.value.healthScore < 40
    ? 'Оголошення майже не має шансів у видачі'
    : 'Оголошення потребує уваги';
});

const summary = computed(() => {
  const { daysSincePublished, viewsCount, contactsCount } = input.stats;
  const count = fullAdvice.findings.length;
  return `За ${daysSincePublished} днів — ${viewsCount} переглядів і ${
    contactsCount === 0 ? 'жодного звернення' : `${contactsCount} звернень`
  }. AI знайшов ${count} ${count === 1 ? 'причину' : count < 5 ? 'причини' : 'причин'}.`;
});
</script>

<template>
  <!--
    The session only exists on the client, so this subtree is client-only:
    rendering it during hydration would disagree with the server HTML.
  -->
  <ClientOnly>
    <div class="container-page py-12">
      <p class="text-[var(--t-sm)] text-text-muted">
        Оголошення {{ route.params.id }} · аналіз «чому не продається»
      </p>

      <header class="mt-4 flex flex-wrap items-center gap-5">
        <HealthScore :score="advice.healthScore" />
        <div>
          <h1 class="text-[length:var(--t-h2)] font-bold tracking-[-0.02em]">
            {{ headline }}
          </h1>
          <p class="mt-1 text-text-secondary">{{ summary }}</p>
        </div>
        <span
          class="rounded-[var(--r-full)] border border-border px-3 py-1.5 text-[var(--t-sm)] font-medium sm:ml-auto"
        >Health {{ advice.healthScore }} / 100</span>
      </header>

      <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div class="space-y-4">
          <FindingCard
            v-for="(finding, index) in advice.findings"
            :key="finding.axis"
            :finding="finding"
            :primary="index === 0"
            :locked="advice.locked"
            :applied="finding.action ? applied.includes(finding.action.id) : false"
            @apply="apply"
          />

          <UpgradePrompt
            v-if="advice.locked && hiddenCount > 0"
            :hidden-count="hiddenCount"
            :reason="adviceEntitlement.reason"
          />

          <div v-if="!advice.locked" class="pt-2">
            <BaseButton v-if="!allApplied" variant="ai" size="lg" @click="applyAll">
              Застосувати всі рекомендації
            </BaseButton>
            <p v-else class="text-[var(--t-sm)] font-medium text-success-500">
              ✓ Усі рекомендації застосовано. Бекенда ще немає, тому зміни не збережені.
            </p>
          </div>

          <PricePositionChart
            v-if="!advice.locked"
            class="mt-2"
            :position="demoPricePosition"
            :median-kop="input.market.medianKop"
          />
        </div>

        <ListingStatsPanel :input="input" />
      </div>
    </div>

    <template #fallback>
      <div class="container-page py-12">
        <p class="text-text-muted">Завантаження…</p>
      </div>
    </template>
  </ClientOnly>
</template>
