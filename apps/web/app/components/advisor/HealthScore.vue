<script setup lang="ts">
const props = defineProps<{ score: number }>();

/** Red below 40, amber to 70, green above — the same thresholds as the badge. */
const color = computed(() =>
  props.score >= 70 ? 'var(--success-500)' : props.score >= 40 ? 'var(--warning-500)' : 'var(--danger-500)',
);
</script>

<template>
  <div
    class="grid h-16 w-16 shrink-0 place-items-center rounded-full"
    :style="{
      background: `conic-gradient(${color} 0 ${score}%, var(--bg-inset) ${score}% 100%)`,
    }"
    role="img"
    :aria-label="`Health score ${score} зі 100`"
  >
    <span class="grid h-12 w-12 place-items-center rounded-full bg-surface font-bold">
      {{ score }}
    </span>
  </div>
</template>
