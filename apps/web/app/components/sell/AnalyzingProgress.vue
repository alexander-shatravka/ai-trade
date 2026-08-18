<script setup lang="ts">
import type { JobProgress } from '@ai-trade/contracts';

const props = defineProps<{
  progress: JobProgress | null;
  steps: readonly string[];
  photos: { id: string; url: string; name: string }[];
}>();

const currentIndex = computed(() => props.progress?.index ?? 0);
const percent = computed(() => props.progress?.percent ?? 0);
</script>

<template>
  <div class="mx-auto max-w-2xl text-center">
    <div class="relative mx-auto h-40 w-40 overflow-hidden rounded-[var(--r-xl)] border border-border">
      <img
        v-if="photos[0]"
        :src="photos[0].url"
        :alt="photos[0].name"
        class="h-full w-full object-cover"
      >
      <!-- Scanning sweep; decorative, and stilled under reduced-motion. -->
      <div
        aria-hidden="true"
        class="absolute inset-x-0 h-1/3 animate-[sweep_1.6s_var(--e-out)_infinite] bg-[linear-gradient(180deg,transparent,rgb(110_91_232/0.45),transparent)]"
      />
    </div>

    <h1 class="mt-8 text-[length:var(--t-h2)] font-bold tracking-[-0.02em]">
      AI аналізує ваш товар
    </h1>

    <p class="mt-2 text-text-secondary" aria-live="polite">
      {{ progress?.step ?? 'Готуємось…' }}
    </p>

    <div
      class="mt-6 h-2 w-full overflow-hidden rounded-full bg-bg-inset"
      role="progressbar"
      :aria-valuenow="percent"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="`Прогрес аналізу: ${percent}%`"
    >
      <div
        class="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-500),var(--accent-500))] transition-[width] duration-300 ease-[var(--e-out)]"
        :style="{ width: `${percent}%` }"
      />
    </div>

    <ol class="mx-auto mt-8 max-w-sm space-y-2 text-left">
      <li
        v-for="(step, index) in steps"
        :key="step"
        class="flex items-center gap-3 text-[var(--t-sm)] transition-opacity"
        :class="index < currentIndex ? 'text-text' : 'text-text-muted opacity-60'"
      >
        <span
          class="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px]"
          :class="
            index + 1 < currentIndex
              ? 'bg-success-500 text-white'
              : index + 1 === currentIndex
                ? 'bg-primary text-white'
                : 'bg-bg-inset text-text-muted'
          "
          aria-hidden="true"
        >{{ index + 1 < currentIndex ? '✓' : index + 1 }}</span>
        {{ step }}
      </li>
    </ol>
  </div>
</template>

<style scoped>
@keyframes sweep {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(400%); }
}
</style>
