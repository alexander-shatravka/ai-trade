<script setup lang="ts">
import { formatKop, parseUahToKop } from '@ai-trade/utils/money';
import { itemConditionLabels, itemConditionSchema } from '@ai-trade/contracts';
import type {
  AttributeField,
  ItemCondition,
  SellerAnalysisResult,
} from '@ai-trade/contracts';
import AiField from './AiField.vue';
import PriceScenarios from './PriceScenarios.vue';
import BaseButton from '~/components/BaseButton.vue';
import type { UploadedPhoto } from '~/composables/useAiSeller';

const props = defineProps<{
  result: SellerAnalysisResult;
  attributeSchema: AttributeField[];
  photos: UploadedPhoto[];
  elapsedMs: number;
}>();
const emit = defineEmits<{ publish: [payload: { priceKop: number; aiAcceptedFields: string[] }] }>();

/**
 * The draft the user edits. Generated values are kept separately so we can tell
 * which fields survived untouched — that is Listing.aiAcceptedFields, and
 * without it we cannot answer whether the AI actually works.
 */
const generated = props.result;
const title = ref(generated.copy.title);
const description = ref(generated.copy.description);
const condition = ref<ItemCondition>(generated.condition.value);
const attributes = reactive<Record<string, unknown>>({ ...generated.attributes });
const priceKop = ref(generated.price.optimalKop);
const priceInput = ref(formatKop(generated.price.optimalKop, { currency: false }));
const negotiable = ref(false);
const titleVariant = ref(0);

const titleOptions = computed(() => [generated.copy.title, ...generated.copy.alternativeTitles]);

function cycleTitle() {
  titleVariant.value = (titleVariant.value + 1) % titleOptions.value.length;
  title.value = titleOptions.value[titleVariant.value] ?? title.value;
}

function onPriceInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value;
  priceInput.value = raw;
  try {
    priceKop.value = parseUahToKop(raw);
  } catch {
    // Leave the last valid amount in place while the field is mid-edit.
  }
}

function selectScenario(kop: number) {
  priceKop.value = kop;
  priceInput.value = formatKop(kop, { currency: false });
}

const isUncertain = (key: string) =>
  generated.recognition.uncertainFields.includes(key);

const editedTitle = computed(() => title.value !== generated.copy.title);
const editedDescription = computed(() => description.value !== generated.copy.description);
const editedCondition = computed(() => condition.value !== generated.condition.value);

/** Which generated fields the user left exactly as the AI wrote them. */
const aiAcceptedFields = computed(() => {
  const accepted: string[] = [];
  if (!editedTitle.value) accepted.push('title');
  if (!editedDescription.value) accepted.push('description');
  if (!editedCondition.value) accepted.push('condition');
  if (priceKop.value === generated.price.optimalKop) accepted.push('priceKop');
  for (const field of props.attributeSchema) {
    if (attributes[field.key] === generated.attributes[field.key]) {
      accepted.push(`attributes.${field.key}`);
    }
  }
  return accepted;
});

const acceptedShare = computed(() =>
  Math.round((aiAcceptedFields.value.length / generated.generatedFields.length) * 100),
);

const lowQuality = (id: string) => generated.photoAdvice.lowQualityMediaIds.includes(id);
const evidenceFor = (id: string) =>
  generated.condition.evidence.find((item) => item.mediaId === id)?.note;

const conditionOptions = itemConditionSchema.options;
const seconds = computed(() => Math.max(1, Math.round(props.elapsedMs / 1000)));
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <header class="flex flex-wrap items-center gap-3">
      <h1 class="text-[length:var(--t-h2)] font-bold tracking-[-0.02em]">
        Перевірте та опублікуйте
      </h1>
      <span
        class="rounded-[var(--r-full)] bg-success-500/12 px-2.5 py-1 text-[var(--t-xs)] font-semibold text-success-500"
      >✓ Аналіз за {{ seconds }} с</span>
      <span
        class="rounded-[var(--r-full)] bg-primary-soft px-2.5 py-1 text-[var(--t-xs)] font-semibold text-primary"
      >Впевненість AI {{ Math.round(generated.recognition.confidence * 100) }}%</span>
    </header>

    <p class="mt-3 text-text-secondary">
      Поля з міткою <span class="font-semibold text-primary">✨ AI</span> згенеровані —
      кожне можна змінити. AI пропонує, публікуєте ви.
    </p>

    <p class="mt-2 text-[var(--t-sm)] text-text-muted">
      {{ generated.recognition.categoryPath.join(' → ') }}
    </p>

    <!-- ── Фото ─────────────────────────────────────────────────────────── -->
    <section class="mt-8 rounded-[var(--r-lg)] border border-border bg-surface p-6">
      <h2 class="text-[length:var(--t-h4)] font-semibold">Фотографії</h2>

      <ul class="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
        <li v-for="(photo, index) in photos" :key="photo.id">
          <!-- Badges anchor to the image, not the item, so the caption below stays clear. -->
          <div class="relative">
            <img
              :src="photo.url"
              :alt="photo.name"
              class="aspect-square w-full rounded-[var(--r-md)] border border-border object-cover"
            >
            <span
              v-if="index === 0"
              class="absolute bottom-1 left-1 rounded-[var(--r-xs)] bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white"
            >обкладинка</span>
            <span
              v-if="lowQuality(photo.id)"
              class="absolute bottom-1 right-1 rounded-[var(--r-xs)] bg-warning-500 px-1.5 py-0.5 text-[10px] font-semibold text-white"
              title="AI вважає якість цього фото низькою"
            >якість ↓</span>
          </div>
          <span v-if="evidenceFor(photo.id)" class="mt-1.5 line-clamp-2 text-[10px] leading-tight text-text-muted" :title="evidenceFor(photo.id)">
            {{ evidenceFor(photo.id) }}
          </span>
        </li>
      </ul>

      <div v-if="generated.photoAdvice.missingAngles.length" class="mt-5 rounded-[var(--r-md)] bg-bg-subtle p-4">
        <p class="text-[var(--t-sm)] font-semibold">AI радить додати:</p>
        <ul class="mt-2 space-y-1.5">
          <li
            v-for="angle in generated.photoAdvice.missingAngles"
            :key="angle.angle"
            class="flex flex-wrap items-center gap-2 text-[var(--t-sm)] text-text-secondary"
          >
            <span aria-hidden="true">📸</span>{{ angle.label }}
            <span class="font-medium text-accent-500">{{ angle.impact }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- ── Текст ────────────────────────────────────────────────────────── -->
    <section class="mt-5 space-y-6 rounded-[var(--r-lg)] border border-border bg-surface p-6">
      <AiField
        label="Заголовок"
        :edited="editedTitle"
        :hint="`${title.length} / 70 символів`"
      >
        <div class="flex flex-col gap-2 sm:flex-row">
          <input
            v-model="title"
            type="text"
            maxlength="70"
            class="h-11 w-full rounded-[var(--r-md)] border border-border bg-surface px-3.5 font-medium transition-colors focus:border-primary"
          >
          <button
            type="button"
            class="h-11 shrink-0 rounded-[var(--r-md)] border border-border px-3 text-[var(--t-sm)] transition-colors hover:bg-surface-hover"
            @click="cycleTitle"
          >↻ Інший варіант</button>
        </div>
      </AiField>

      <AiField
        label="Опис"
        :edited="editedDescription"
        :hint="`${description.length} символів`"
      >
        <textarea
          v-model="description"
          rows="9"
          class="w-full resize-y rounded-[var(--r-md)] border border-border bg-surface p-3.5 leading-relaxed transition-colors focus:border-primary"
        />
      </AiField>
    </section>

    <!-- ── Характеристики ───────────────────────────────────────────────── -->
    <section class="mt-5 rounded-[var(--r-lg)] border border-border bg-surface p-6">
      <h2 class="text-[length:var(--t-h4)] font-semibold">Характеристики</h2>

      <div class="mt-5 grid gap-5 sm:grid-cols-2">
        <AiField
          v-for="field in attributeSchema"
          :key="field.key"
          :label="field.unit ? `${field.label}, ${field.unit}` : field.label"
          :uncertain="isUncertain(field.key)"
          :edited="attributes[field.key] !== generated.attributes[field.key]"
        >
          <select
            v-if="field.type === 'enum'"
            v-model="attributes[field.key]"
            class="h-11 w-full rounded-[var(--r-md)] border bg-surface px-3 transition-colors focus:border-primary"
            :class="isUncertain(field.key) ? 'border-warning-500' : 'border-border'"
          >
            <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
          </select>
          <input
            v-else
            v-model="attributes[field.key]"
            :type="field.type === 'number' ? 'number' : 'text'"
            class="h-11 w-full rounded-[var(--r-md)] border bg-surface px-3.5 transition-colors focus:border-primary"
            :class="isUncertain(field.key) ? 'border-warning-500' : 'border-border'"
          >
        </AiField>
      </div>

      <div class="mt-6">
        <AiField label="Стан товару" :edited="editedCondition" :hint="generated.condition.reasoning">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in conditionOptions"
              :key="option"
              type="button"
              class="h-9 rounded-[var(--r-full)] border px-3.5 text-[var(--t-sm)] font-medium transition-colors"
              :class="
                condition === option
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border hover:bg-surface-hover'
              "
              :aria-pressed="condition === option"
              @click="condition = option"
            >{{ itemConditionLabels[option] }}</button>
          </div>
        </AiField>
      </div>
    </section>

    <!-- ── Ціна ─────────────────────────────────────────────────────────── -->
    <div class="mt-5">
      <PriceScenarios :price="generated.price" :selected-kop="priceKop" @select="selectScenario" />
    </div>

    <section class="mt-5 rounded-[var(--r-lg)] border border-border bg-surface p-6">
      <div class="grid gap-5 sm:grid-cols-2">
        <div>
          <label for="price" class="text-[var(--t-sm)] font-medium">Ваша ціна, ₴</label>
          <input
            id="price"
            :value="priceInput"
            inputmode="decimal"
            class="mt-2 h-12 w-full rounded-[var(--r-md)] border border-border bg-surface px-3.5 text-xl font-bold transition-colors focus:border-primary"
            @input="onPriceInput"
          >
          <p class="mt-2 text-[var(--t-xs)] text-text-muted">
            Буде збережено як {{ priceKop }} копійок
          </p>
        </div>

        <div class="flex items-end">
          <label class="flex items-center gap-2.5 text-[var(--t-sm)]">
            <input v-model="negotiable" type="checkbox" class="h-4 w-4 accent-[var(--primary)]">
            Можливий торг
          </label>
        </div>
      </div>

      <div class="mt-6 rounded-[var(--r-md)] bg-bg-subtle p-4">
        <p class="text-[var(--t-sm)]">
          <span class="font-semibold">Ймовірність продажу за 14 днів —
            {{ generated.forecast.sellProbability }}%</span>,
          орієнтовно {{ generated.forecast.estimatedDays }} днів.
        </p>
        <p class="mt-1 text-[var(--t-sm)] text-text-secondary">
          {{ generated.forecast.explanation }}
        </p>
      </div>
    </section>

    <!-- ── Публікація ───────────────────────────────────────────────────── -->
    <section class="mt-5 rounded-[var(--r-lg)] border border-border bg-surface p-6">
      <p class="text-[var(--t-sm)] text-text-muted">
        Без правок залишено {{ aiAcceptedFields.length }} з
        {{ generated.generatedFields.length }} згенерованих полів ({{ acceptedShare }}%).
        Ця цифра показує, наскільки AI влучив.
      </p>

      <div class="mt-5 flex flex-wrap gap-3">
        <BaseButton
          variant="ai"
          size="lg"
          @click="emit('publish', { priceKop, aiAcceptedFields })"
        >Опублікувати оголошення</BaseButton>
        <BaseButton variant="secondary" size="lg">Зберегти як чернетку</BaseButton>
      </div>

      <p class="mt-4 text-[var(--t-xs)] text-text-muted">
        Тариф Free · використано 3 з 5 AI-створень цього місяця
      </p>
    </section>
  </div>
</template>
