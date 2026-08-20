<script setup lang="ts">
import { formatKopCompact } from '@ai-trade/utils';
import StatTile from '~/components/dashboard/StatTile.vue';
import ViewsChart from '~/components/dashboard/ViewsChart.vue';
import ListingsTable from '~/components/dashboard/ListingsTable.vue';
import PlanPanel from '~/components/dashboard/PlanPanel.vue';
import AttentionCard from '~/components/dashboard/AttentionCard.vue';
import BaseButton from '~/components/BaseButton.vue';
import { mockListings, mockSellerStats } from '~/data/mock-listings';

useHead({ title: 'Кабінет — AI Trade' });

const { user } = useAuth();
const { ready } = useRequireAuth();

// GET /users/me/stats and GET /listings?mine=true once the API exists.
const stats = mockSellerStats;
const listings = mockListings;

const attention = computed(() => listings.find((l) => l.needsAttention) ?? null);

const daysSince = (iso: string | null) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000) : 0;

/**
 * The API returns usage and the listing list from the same data, so they cannot
 * disagree. Here they are two separate fixtures, so the panel is fed the count
 * actually being shown rather than letting one screen contradict itself.
 */
const planForPanel = computed(() => {
  if (!user.value) return null;
  return {
    ...user.value.plan,
    usage: { ...user.value.plan.usage, activeListings: stats.activeListings },
  };
});

/** Active listings are counted against the plan, so the tile shows both. */
const activeHint = computed(() => {
  const limit = user.value?.plan.limits.activeListings;
  if (limit === undefined) return undefined;
  return limit === null ? 'без обмежень за тарифом' : `з ${limit} за тарифом`;
});

const avgSellHint = computed(() =>
  stats.avgSellDays === null ? undefined : `у середньому за ${stats.avgSellDays} днів`,
);
</script>

<template>
  <!--
    The session only exists on the client, so this subtree is client-only:
    rendering it during hydration would disagree with the server HTML.
  -->
  <ClientOnly>
    <div class="container-page py-12">
      <header class="flex flex-wrap items-center gap-4">
        <div>
          <h1 class="text-[length:var(--t-h2)] font-bold tracking-[-0.02em]">Кабінет</h1>
          <p class="mt-1 text-text-secondary">
            Оголошення, статистика і те, що потребує дії.
          </p>
        </div>
        <BaseButton class="sm:ml-auto" variant="ai" to="/sell">✨ Створити оголошення</BaseButton>
      </header>

      <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Активні оголошення"
          :value="String(stats.activeListings)"
          :hint="activeHint"
        />
        <StatTile
          label="Перегляди за 30 днів"
          :value="stats.totalViews.toLocaleString('uk-UA')"
          :delta-percent="stats.viewsDeltaPercent"
        />
        <StatTile
          label="Звернення"
          :value="String(stats.totalContacts)"
          :delta-percent="stats.contactsDeltaPercent"
        />
        <StatTile
          label="Продано"
          :value="String(stats.soldCount)"
          :hint="avgSellHint"
        />
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div class="min-w-0 space-y-6">
          <AttentionCard
            v-if="attention"
            :listing="attention"
            :days-since-published="daysSince(attention.publishedAt)"
          />
          <ViewsChart :series="stats.series" :delta-percent="stats.viewsDeltaPercent" />
          <ListingsTable :listings="listings" />
        </div>

        <aside class="space-y-6">
          <PlanPanel v-if="planForPanel" :plan="planForPanel" />

          <section class="rounded-[var(--r-lg)] border border-border bg-surface p-5">
            <h2 class="text-[length:var(--t-h4)] font-semibold">Конверсія</h2>
            <p class="mt-2 text-3xl font-extrabold tabular-nums">
              {{ (stats.conversionRate * 100).toFixed(1) }}%
            </p>
            <p class="mt-1.5 text-[var(--t-sm)] text-text-muted">
              звернень від переглядів за 30 днів
            </p>
            <p class="mt-4 text-[var(--t-xs)] text-text-muted">
              Сумарна вартість активних оголошень —
              {{ formatKopCompact(listings.filter((l) => l.status === 'ACTIVE').reduce((s, l) => s + l.priceKop, 0)) }}
            </p>
          </section>
        </aside>
      </div>
    </div>

    <template #fallback>
      <div class="container-page py-12">
        <p class="text-text-muted">Завантаження…</p>
      </div>
    </template>
  </ClientOnly>
</template>
