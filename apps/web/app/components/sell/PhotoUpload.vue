<script setup lang="ts">
import BaseButton from '~/components/BaseButton.vue';
import type { UploadedPhoto } from '~/composables/useAiSeller';

const props = defineProps<{ photos: UploadedPhoto[]; hint: string }>();
const emit = defineEmits<{
  add: [files: File[]];
  remove: [id: string];
  'update:hint': [value: string];
  analyze: [];
}>();

const input = ref<HTMLInputElement | null>(null);
const dragging = ref(false);

function pick(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (files) emit('add', Array.from(files));
  if (input.value) input.value.value = '';
}

function drop(event: DragEvent) {
  dragging.value = false;
  const files = event.dataTransfer?.files;
  if (files) emit('add', Array.from(files).filter((f) => f.type.startsWith('image/')));
}

const canAnalyze = computed(() => props.photos.length > 0);
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <h1 class="text-[length:var(--t-h1)] font-extrabold tracking-[-0.02em]">
      Завантажте фото — решту зробить AI
    </h1>
    <p class="mt-3 text-[length:var(--t-lg)] text-text-secondary">
      Одна фотографія достатньо, кілька — точніша оцінка. AI напише заголовок і опис,
      заповнить характеристики та запропонує ціну.
    </p>

    <div
      class="mt-8 rounded-[var(--r-xl)] border-2 border-dashed p-10 text-center transition-colors"
      :class="dragging ? 'border-primary bg-primary-soft' : 'border-border bg-bg-subtle'"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="drop"
    >
      <p class="text-4xl" aria-hidden="true">📸</p>
      <p class="mt-3 font-semibold">Перетягніть фото сюди</p>
      <p class="mt-1 text-[var(--t-sm)] text-text-muted">або оберіть файли — до 10 штук</p>

      <input
        ref="input"
        type="file"
        accept="image/*"
        multiple
        class="sr-only"
        @change="pick"
      >
      <BaseButton class="mt-5" variant="secondary" @click="input?.click()">
        Обрати фото
      </BaseButton>
    </div>

    <ul v-if="photos.length" class="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
      <li v-for="photo in photos" :key="photo.id" class="group relative">
        <img
          :src="photo.url"
          :alt="photo.name"
          class="aspect-square w-full rounded-[var(--r-md)] border border-border object-cover"
        >
        <button
          type="button"
          class="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-border bg-surface text-[var(--t-xs)] shadow-[var(--sh-sm)]"
          :aria-label="`Видалити фото ${photo.name}`"
          @click="emit('remove', photo.id)"
        >✕</button>
      </li>
    </ul>

    <div class="mt-8">
      <label for="hint" class="block text-[var(--t-sm)] font-medium">
        Підказка для AI <span class="text-text-muted">— необовʼязково</span>
      </label>
      <input
        id="hint"
        :value="hint"
        type="text"
        maxlength="300"
        placeholder="Наприклад: iPhone 13 Pro, 128 ГБ, є подряпина на рамці"
        class="mt-2 h-11 w-full rounded-[var(--r-md)] border border-border bg-surface px-3.5 text-[var(--t-base)] transition-colors focus:border-primary"
        @input="emit('update:hint', ($event.target as HTMLInputElement).value)"
      >
      <p class="mt-2 text-[var(--t-xs)] text-text-muted">
        AI перевіряє підказку за фотографіями — вона не замінює те, що видно на знімку.
      </p>
    </div>

    <BaseButton
      class="mt-8 w-full"
      variant="ai"
      size="lg"
      :disabled="!canAnalyze"
      @click="emit('analyze')"
    >
      ✨ Створити оголошення
    </BaseButton>
  </div>
</template>
