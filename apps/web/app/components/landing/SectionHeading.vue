<script setup lang="ts">
defineProps<{ eyebrow: string; title: string; lede?: string }>();
</script>

<template>
  <div class="mx-auto mb-12 max-w-2xl text-center">
    <span class="text-[var(--t-xs)] font-semibold uppercase tracking-[0.12em] text-primary">
      {{ eyebrow }}
    </span>
    <h2 class="mt-3 text-[length:var(--t-h2)] font-bold tracking-[-0.02em]">{{ title }}</h2>
    <p v-if="lede" class="mt-4 text-[length:var(--t-lg)] leading-relaxed text-text-secondary">
      {{ lede }}
    </p>
  </div>
</template>
