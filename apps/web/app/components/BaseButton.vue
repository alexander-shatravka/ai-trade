<script setup lang="ts">
/**
 * The button variants from design/design-system.html. Rendered as <NuxtLink>
 * when `to` is given, otherwise as a real <button> so keyboard and screen
 * reader behaviour stays correct.
 */
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'ai';
    size?: 'sm' | 'md' | 'lg';
    to?: string;
  }>(),
  { variant: 'primary', size: 'md' },
);

// Resolved here rather than inline in :is — resolveComponent must run during
// setup, and calling it in the template silently yields an unresolved
// <nuxtlink> element with no href, i.e. a link that does not navigate.
const NuxtLink = resolveComponent('NuxtLink');

const base =
  'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap ' +
  'rounded-[var(--r-md)] border transition-all duration-[var(--d-fast)] ' +
  'ease-[var(--e-out)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

const variants = {
  primary:
    'border-transparent bg-primary text-white hover:bg-primary-hover hover:-translate-y-px ' +
    'shadow-[var(--sh-sm)] hover:shadow-[var(--sh-md)]',
  secondary: 'border-border bg-surface text-text hover:bg-surface-hover hover:border-border-strong',
  ghost: 'border-transparent bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text',
  ai:
    'border-transparent text-white shadow-[var(--sh-brand)] hover:-translate-y-px ' +
    'bg-[linear-gradient(135deg,var(--brand-500),var(--accent-500))]',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-[var(--t-sm)]',
  md: 'h-10 px-4 text-[var(--t-base)]',
  lg: 'h-[52px] px-7 text-[var(--t-lg)]',
} as const;
</script>

<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :class="[base, variants[variant], sizes[size]]"
  >
    <slot />
  </component>
</template>
