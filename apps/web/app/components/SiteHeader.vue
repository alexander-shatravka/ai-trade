<script setup lang="ts">
import AppLogo from '~/components/AppLogo.vue';
import BaseButton from '~/components/BaseButton.vue';

const { theme, toggle } = useTheme();
const route = useRoute();

const links = [
  { href: '/#features', label: 'Можливості' },
  { href: '/#how', label: 'Як це працює' },
  { href: '/#pricing', label: 'Тарифи' },
  { href: '/#roadmap', label: 'Розвиток' },
];

const scrolled = ref(false);
const onScroll = () => (scrolled.value = window.scrollY > 8);

/**
 * Below lg the links do not fit beside the buttons, so they move into a panel.
 * Without it they would simply be unreachable on a phone.
 */
const menuOpen = ref(false);
watch(() => route.fullPath, () => (menuOpen.value = false));

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') menuOpen.value = false;
}

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <nav
    class="sticky top-0 z-50 border-b transition-colors duration-[var(--d-base)]"
    :class="
      scrolled || menuOpen
        ? 'border-border bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl'
        : 'border-transparent bg-transparent'
    "
  >
    <div class="container-page flex h-16 items-center gap-4">
      <AppLogo />

      <div class="hidden flex-1 items-center gap-1 lg:flex">
        <NuxtLink
          v-for="link in links"
          :key="link.href"
          :to="link.href"
          class="rounded-[var(--r-sm)] px-3 py-2 text-[var(--t-sm)] font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
        >{{ link.label }}</NuxtLink>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <button
          type="button"
          class="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--r-md)] border border-border bg-surface transition-colors hover:bg-surface-hover"
          :aria-label="theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'"
          @click="toggle"
        >
          <ClientOnly>
            <span aria-hidden="true">{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
            <template #fallback><span aria-hidden="true">🌙</span></template>
          </ClientOnly>
        </button>

        <!-- Desktop actions -->
        <div class="hidden items-center gap-2 lg:flex">
          <BaseButton variant="ghost" size="sm" to="/login">Увійти</BaseButton>
          <BaseButton size="sm" to="/sell">Почати безкоштовно</BaseButton>
        </div>

        <!-- Mobile menu trigger -->
        <button
          type="button"
          class="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--r-md)] border border-border bg-surface transition-colors hover:bg-surface-hover lg:hidden"
          :aria-label="menuOpen ? 'Закрити меню' : 'Відкрити меню'"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          @click="menuOpen = !menuOpen"
        >
          <span aria-hidden="true">{{ menuOpen ? '✕' : '☰' }}</span>
        </button>
      </div>
    </div>

    <div
      v-show="menuOpen"
      id="mobile-menu"
      class="border-t border-border bg-surface lg:hidden"
    >
      <div class="container-page flex flex-col gap-1 py-4">
        <NuxtLink
          v-for="link in links"
          :key="link.href"
          :to="link.href"
          class="rounded-[var(--r-md)] px-3 py-2.5 font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
          @click="menuOpen = false"
        >{{ link.label }}</NuxtLink>

        <div class="mt-3 flex flex-col gap-2">
          <BaseButton variant="secondary" to="/login">Увійти</BaseButton>
          <BaseButton to="/sell">Почати безкоштовно</BaseButton>
        </div>
      </div>
    </div>
  </nav>
</template>
