<script setup lang="ts">
/**
 * Wraps a generated field. Two things are non-negotiable here: the field is
 * marked as AI-written, and it is editable. AI proposes, the person decides.
 */
defineProps<{
  label: string;
  /** Set when the model flagged this field as one it was unsure about. */
  uncertain?: boolean;
  edited?: boolean;
  hint?: string;
}>();
</script>

<template>
  <div>
    <div class="mb-2 flex flex-wrap items-center gap-2">
      <label class="text-[var(--t-sm)] font-medium">{{ label }}</label>
      <span
        class="rounded-[var(--r-full)] bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary"
      >✨ AI</span>
      <span
        v-if="edited"
        class="rounded-[var(--r-full)] bg-bg-inset px-2 py-0.5 text-[10px] font-medium text-text-muted"
      >відредаговано</span>
      <span v-if="hint" class="ml-auto text-[var(--t-xs)] text-text-muted">{{ hint }}</span>
    </div>

    <slot />

    <p
      v-if="uncertain"
      class="mt-2 flex items-center gap-1.5 text-[var(--t-xs)] font-medium text-warning-500"
    >
      <span aria-hidden="true">⚠</span> AI не впевнений — перевірте це поле
    </p>
  </div>
</template>
