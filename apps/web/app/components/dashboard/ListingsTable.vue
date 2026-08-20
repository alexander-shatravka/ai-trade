<script setup lang="ts">
import { formatKop } from '@ai-trade/utils';
import { promotionTierLabels, type ListingStatus, type ListingSummary } from '@ai-trade/contracts';

const props = defineProps<{ listings: ListingSummary[] }>();

type Tab = 'ACTIVE' | 'DRAFT' | 'SOLD';
const tab = ref<Tab>('ACTIVE');

const counts = computed(() => ({
  ACTIVE: props.listings.filter((l) => l.status === 'ACTIVE').length,
  DRAFT: props.listings.filter((l) => l.status === 'DRAFT').length,
  SOLD: props.listings.filter((l) => l.status === 'SOLD').length,
}));

const tabs: { key: Tab; label: string }[] = [
  { key: 'ACTIVE', label: 'Активні' },
  { key: 'DRAFT', label: 'Чернетки' },
  { key: 'SOLD', label: 'Продані' },
];

const rows = computed(() => props.listings.filter((l) => l.status === tab.value));

const statusLabels: Partial<Record<ListingStatus, string>> = {
  ACTIVE: 'Активне',
  DRAFT: 'Чернетка',
  SOLD: 'Продано',
  PENDING_MODERATION: 'На модерації',
  REJECTED: 'Відхилено',
  ARCHIVED: 'В архіві',
  EXPIRED: 'Термін вийшов',
};

const days = (iso: string | null) => {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
};

function subtitle(listing: ListingSummary): string {
  if (listing.status === 'DRAFT') {
    return listing.aiGenerated ? 'чернетка · створено AI' : 'чернетка';
  }
  const d = days(listing.publishedAt);
  if (d === null) return '';
  return d === 0 ? 'опубліковано сьогодні' : `опубліковано ${d} дн. тому`;
}
</script>

<template>
  <section class="rounded-[var(--r-lg)] border border-border bg-surface">
    <header class="flex flex-wrap items-center gap-4 border-b border-border p-5">
      <h2 class="text-[length:var(--t-h4)] font-semibold">Мої оголошення</h2>

      <div class="flex flex-wrap gap-1" role="tablist" aria-label="Стан оголошень">
        <button
          v-for="item in tabs"
          :key="item.key"
          type="button"
          role="tab"
          :aria-selected="tab === item.key"
          class="rounded-[var(--r-full)] px-3 py-1.5 text-[var(--t-sm)] font-medium transition-colors"
          :class="
            tab === item.key
              ? 'bg-primary-soft text-primary'
              : 'text-text-secondary hover:bg-surface-hover'
          "
          @click="tab = item.key"
        >{{ item.label }} · {{ counts[item.key] }}</button>
      </div>
    </header>

    <p v-if="rows.length === 0" class="p-8 text-center text-text-muted">
      Тут поки порожньо.
    </p>

    <!-- The table scrolls inside its own box; the page never scrolls sideways. -->
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[640px] text-[var(--t-sm)]">
        <thead class="text-left text-text-muted">
          <tr class="border-b border-border">
            <th scope="col" class="min-w-[240px] p-4 font-medium">Товар</th>
            <th scope="col" class="p-4 text-right font-medium">Ціна</th>
            <th scope="col" class="p-4 text-right font-medium">Перегляди</th>
            <th scope="col" class="p-4 text-right font-medium">Звернення</th>
            <th scope="col" class="p-4 font-medium">Стан</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="listing in rows"
            :key="listing.id"
            class="border-b border-border last:border-0 hover:bg-surface-hover"
          >
            <td class="p-4">
              <div class="flex items-center gap-3">
                <span
                  class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--r-md)] bg-bg-inset text-lg"
                  aria-hidden="true"
                >{{ listing.coverEmoji }}</span>
                <span>
                  <span class="font-medium">{{ listing.title }}</span>
                  <span class="mt-0.5 block text-[var(--t-xs)] text-text-muted">
                    {{ subtitle(listing) }}
                  </span>
                </span>
              </div>
            </td>
            <td class="p-4 text-right font-semibold tabular-nums whitespace-nowrap">
              {{ formatKop(listing.priceKop) }}
            </td>
            <td class="p-4 text-right tabular-nums">
              {{ listing.status === 'DRAFT' ? '—' : listing.viewsCount }}
            </td>
            <td class="p-4 text-right tabular-nums">
              {{ listing.status === 'DRAFT' ? '—' : listing.contactsCount }}
            </td>
            <td class="p-4">
              <NuxtLink
                v-if="listing.needsAttention"
                :to="`/dashboard/listings/${listing.id}/advice`"
                class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--r-full)] bg-warning-500/15 px-2.5 py-1 text-[var(--t-xs)] font-semibold text-warning-500"
              >⚠ Потребує уваги</NuxtLink>
              <span
                v-else-if="listing.promotionTier"
                class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--r-full)] bg-primary-soft px-2.5 py-1 text-[var(--t-xs)] font-semibold text-primary"
              >{{ promotionTierLabels[listing.promotionTier] }}</span>
              <span v-else class="text-text-muted">{{ statusLabels[listing.status] }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
