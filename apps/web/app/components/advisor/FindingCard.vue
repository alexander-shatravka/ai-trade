<script setup lang="ts">
import { formatKop } from '@ai-trade/utils/money';
import type { AdviceFinding } from '@ai-trade/contracts';
import BaseButton from '~/components/BaseButton.vue';

const props = defineProps<{ finding: AdviceFinding; primary: boolean; locked: boolean; applied: boolean }>();
const emit = defineEmits<{ apply: [actionId: string] }>();

const icons: Record<AdviceFinding['axis'], string> = {
  price: '💰',
  photos: '📷',
  description: '📝',
  title: '🔤',
  timing: '📅',
};

const severityLabel: Record<AdviceFinding['severity'], string> = {
  high: 'висока',
  medium: 'середня',
  low: 'низька',
};

const e = computed(() => props.finding.evidence as Record<string, never>);
const kop = (value: unknown) => formatKop(Number(value));
</script>

<template>
  <article
    class="rounded-[var(--r-lg)] border bg-surface p-5"
    :class="applied ? 'border-success-500' : primary ? 'border-warning-500' : 'border-border'"
  >
    <header class="flex gap-2.5">
      <span class="shrink-0 text-xl leading-tight" aria-hidden="true">{{ icons[finding.axis] }}</span>
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 class="font-semibold">{{ finding.finding }}</h3>
        <span
          v-if="primary"
          class="whitespace-nowrap rounded-[var(--r-full)] bg-warning-500/15 px-2 py-0.5 text-[10px] font-semibold text-warning-500"
        >головна причина</span>
        <span v-else class="text-[var(--t-xs)] text-text-muted">
          важливість: {{ severityLabel[finding.severity] }}
        </span>
      </div>
    </header>

    <!-- Evidence: the numbers the finding was computed from. Hidden on FREE. -->
    <div v-if="!locked" class="mt-3 text-[var(--t-sm)] leading-relaxed text-text-secondary">
      <p v-if="finding.axis === 'price'">
        Ваша ціна — <strong class="text-text">{{ kop(e.yourPriceKop) }}</strong>.
        Медіана по {{ e.sampleSize }} схожих оголошеннях за останні 60 днів —
        <strong class="text-text">{{ kop(e.medianKop) }}</strong>.
        Типовий діапазон — {{ kop(e.p25Kop) }}–{{ kop(e.p75Kop) }}.
      </p>

      <p v-else-if="finding.axis === 'photos'">
        У вас {{ e.photoCount }} фото проти {{ e.topPhotoCount }} у найшвидше проданих
        оголошень категорії. Бракує ракурсів:
        {{ (e.missingAngles as unknown as string[]).join(', ') }}.
      </p>

      <p v-else-if="finding.axis === 'title'">
        «{{ e.label }}» — фільтр №1 у категорії «{{ e.categoryName }}»: його застосовують
        у {{ e.filterSharePercent }}% пошуків. Без нього оголошення не потрапляє
        у відфільтровану видачу.
      </p>

      <p v-else-if="finding.axis === 'description'">
        Опис — {{ e.length }} символів. Оголошення з описом від {{ e.recommended }} символів
        отримують більше звернень: покупцю не доводиться писати уточнення.
      </p>

      <p v-else>
        Сезонний попит зараз становить {{ Math.round(Number(e.seasonalityFactor) * 100) }}%
        від середнього по року.
      </p>
    </div>

    <footer v-if="!locked && finding.action" class="mt-4 flex flex-wrap items-center gap-3">
      <BaseButton
        v-if="!applied"
        size="sm"
        :variant="primary ? 'primary' : 'secondary'"
        @click="emit('apply', finding.action.id)"
      >{{ finding.action.label }}</BaseButton>
      <span v-else class="text-[var(--t-sm)] font-medium text-success-500">✓ Застосовано</span>

      <span class="text-[var(--t-sm)] text-accent-500">→ {{ finding.expectedEffect }}</span>
    </footer>
  </article>
</template>
