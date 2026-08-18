<script setup lang="ts">
import BaseButton from '~/components/BaseButton.vue';

defineProps<{ confidence: number; productType: string | null }>();
const emit = defineEmits<{ retry: []; manual: [] }>();
</script>

<template>
  <!--
    The low-confidence branch. We say plainly that the item was not identified
    instead of publishing a plausible-looking guess.
  -->
  <div class="mx-auto max-w-xl text-center">
    <p class="text-5xl" aria-hidden="true">🤔</p>

    <h1 class="mt-5 text-[length:var(--t-h2)] font-bold tracking-[-0.02em]">
      Не вдалося точно визначити товар
    </h1>

    <p class="mt-3 text-[length:var(--t-lg)] text-text-secondary">
      <template v-if="productType">
        AI розпізнав категорію як «{{ productType }}», але впевненості замало
        ({{ Math.round(confidence * 100) }}%), щоб заповнити оголошення за вас.
      </template>
      <template v-else>
        AI не зміг упізнати товар на фотографіях.
      </template>
    </p>

    <div class="mt-6 rounded-[var(--r-lg)] border border-border bg-bg-subtle p-5 text-left">
      <p class="text-[var(--t-sm)] font-semibold">Що допоможе:</p>
      <ul class="mt-3 space-y-2 text-[var(--t-sm)] text-text-secondary">
        <li class="flex gap-2"><span aria-hidden="true">📸</span>Зніміть товар при денному світлі, повністю в кадрі</li>
        <li class="flex gap-2"><span aria-hidden="true">🏷️</span>Додайте фото етикетки, шильдика або коробки з назвою моделі</li>
        <li class="flex gap-2"><span aria-hidden="true">✍️</span>Напишіть у підказці бренд і модель, якщо ви їх знаєте</li>
      </ul>
    </div>

    <div class="mt-8 flex flex-wrap justify-center gap-3">
      <BaseButton variant="ai" size="lg" @click="emit('retry')">
        Спробувати з іншими фото
      </BaseButton>
      <BaseButton variant="secondary" size="lg" @click="emit('manual')">
        Заповнити вручну
      </BaseButton>
    </div>
  </div>
</template>
