<script setup lang="ts">
import { remaining } from '@ai-trade/utils';

const { user, signOut } = useAuth();
const open = ref(false);
const root = ref<HTMLElement | null>(null);

function close(event: MouseEvent) {
  if (root.value && !root.value.contains(event.target as Node)) open.value = false;
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false;
}

onMounted(() => {
  document.addEventListener('click', close);
  window.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', close);
  window.removeEventListener('keydown', onKeydown);
});

const initials = computed(() => {
  const source = user.value?.name || user.value?.email || '?';
  return source
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
});

const aiLeft = computed(() => {
  const p = user.value?.plan;
  if (!p) return null;
  return remaining(p.usage.aiGenerations, p.limits.aiGenerations);
});

function leave() {
  signOut();
  open.value = false;
  navigateTo('/');
}
</script>

<template>
  <div v-if="user" ref="root" class="relative">
    <button
      type="button"
      class="flex h-9 items-center gap-2 rounded-[var(--r-full)] border border-border bg-surface pl-1 pr-3 transition-colors hover:bg-surface-hover"
      :aria-expanded="open"
      aria-haspopup="menu"
      aria-label="Меню акаунта"
      @click="open = !open"
    >
      <img
        v-if="user.avatarUrl"
        :src="user.avatarUrl"
        alt=""
        class="h-7 w-7 rounded-full object-cover"
      >
      <span
        v-else
        class="grid h-7 w-7 place-items-center rounded-full bg-primary text-[10px] font-bold text-white"
        aria-hidden="true"
      >{{ initials }}</span>
      <span class="max-w-24 truncate text-[var(--t-sm)] font-medium">{{ user.name }}</span>
    </button>

    <div
      v-show="open"
      role="menu"
      class="absolute right-0 z-50 mt-2 w-64 rounded-[var(--r-lg)] border border-border bg-surface p-2 shadow-[var(--sh-lg)]"
    >
      <div class="border-b border-border px-3 pb-3 pt-2">
        <p class="truncate text-[var(--t-sm)] font-semibold">{{ user.email }}</p>
        <p class="mt-1 text-[var(--t-xs)] text-text-muted">Тариф {{ user.plan.planName }}</p>
        <p
          v-if="!user.phoneVerified"
          class="mt-1.5 rounded-[var(--r-sm)] bg-warning-500/15 px-2 py-1 text-[var(--t-xs)] font-medium text-warning-500"
        >Телефон не підтверджено</p>
        <p class="mt-1 text-[var(--t-xs)] text-text-muted">
          AI-створень {{ aiLeft === null ? 'без обмежень' : `залишилось ${aiLeft}` }}
        </p>
      </div>

      <NuxtLink
        to="/dashboard/listings/lst_88/advice"
        role="menuitem"
        class="mt-1 block rounded-[var(--r-md)] px-3 py-2 text-[var(--t-sm)] transition-colors hover:bg-surface-hover"
        @click="open = false"
      >Мої оголошення</NuxtLink>
      <NuxtLink
        to="/sell"
        role="menuitem"
        class="block rounded-[var(--r-md)] px-3 py-2 text-[var(--t-sm)] transition-colors hover:bg-surface-hover"
        @click="open = false"
      >Створити оголошення</NuxtLink>

      <button
        type="button"
        role="menuitem"
        class="mt-1 block w-full rounded-[var(--r-md)] px-3 py-2 text-left text-[var(--t-sm)] text-danger-500 transition-colors hover:bg-surface-hover"
        @click="leave"
      >Вийти</button>
    </div>
  </div>
</template>
