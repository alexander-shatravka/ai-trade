<script setup lang="ts">
/**
 * A single number with its context. Per the form heuristic, a headline figure
 * is a stat tile, not a chart — there is nothing to plot in one value.
 */
defineProps<{
  label: string;
  value: string;
  hint?: string;
  deltaPercent?: number | null;
}>();
</script>

<template>
  <div class="rounded-[var(--r-lg)] border border-border bg-surface p-5">
    <p class="text-[var(--t-sm)] text-text-secondary">{{ label }}</p>
    <p class="mt-2 text-3xl font-extrabold tracking-tight tabular-nums">{{ value }}</p>

    <p
      v-if="deltaPercent !== null && deltaPercent !== undefined"
      class="mt-1.5 text-[var(--t-sm)] font-medium"
      :class="deltaPercent >= 0 ? 'text-success-500' : 'text-danger-500'"
    >
      <span aria-hidden="true">{{ deltaPercent >= 0 ? '↑' : '↓' }}</span>
      {{ Math.abs(deltaPercent) }}%
      <span class="font-normal text-text-muted">до попереднього періоду</span>
    </p>
    <p v-else-if="hint" class="mt-1.5 text-[var(--t-sm)] text-text-muted">{{ hint }}</p>
  </div>
</template>
