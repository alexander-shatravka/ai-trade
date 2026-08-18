<script setup lang="ts">
import AppLogo from '~/components/AppLogo.vue';
import BaseButton from '~/components/BaseButton.vue';

const { theme, toggle } = useTheme();

const links = [
  { href: '#features', label: 'Можливості' },
  { href: '#how', label: 'Як це працює' },
  { href: '#pricing', label: 'Тарифи' },
  { href: '#roadmap', label: 'Розвиток' },
];

const scrolled = ref(false);
const onScroll = () => (scrolled.value = window.scrollY > 8);

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
  <nav
    class="sticky top-0 z-50 border-b transition-colors duration-[var(--d-base)]"
    :class="
      scrolled
        ? 'border-border bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl'
        : 'border-transparent bg-transparent'
    "
  >
    <div class="container-page flex h-16 items-center gap-6">
      <AppLogo />

      <div class="hidden flex-1 items-center gap-1 md:flex">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="rounded-[var(--r-sm)] px-3 py-2 text-[var(--t-sm)] font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
        >{{ link.label }}</a>
      </div>

      <div class="ml-auto flex items-center gap-2 md:ml-0">
        <button
          type="button"
          class="grid h-9 w-9 place-items-center rounded-[var(--r-md)] border border-border bg-surface transition-colors hover:bg-surface-hover"
          :aria-label="theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'"
          @click="toggle"
        >
          <ClientOnly>
            <span aria-hidden="true">{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
            <template #fallback><span aria-hidden="true">🌙</span></template>
          </ClientOnly>
        </button>
        <BaseButton variant="ghost" size="sm" to="/login">Увійти</BaseButton>
        <BaseButton size="sm" to="/sell">Почати безкоштовно</BaseButton>
      </div>
    </div>
  </nav>
</template>
