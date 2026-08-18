<script setup lang="ts">
import { magicLinkRequestSchema } from '@ai-trade/contracts';
import { DEMO_ACCOUNTS } from '~/utils/mock-auth';
import BaseButton from '~/components/BaseButton.vue';

const { signIn, signInAs, isAuthenticated } = useAuth();
const route = useRoute();

useHead({ title: 'Вхід — AI Trade' });

const redirect = computed(() => (route.query.redirect as string) || '/');

const email = ref('');
const error = ref('');
const sent = ref(false);

function requestLink() {
  const result = magicLinkRequestSchema.safeParse({ email: email.value.trim() });
  if (!result.success) {
    error.value = result.error.issues[0]?.message ?? 'Некоректний email';
    return;
  }
  error.value = '';
  // POST /auth/magic-link — the real endpoint answers the same way for unknown
  // addresses so it cannot be used to probe who has an account.
  sent.value = true;
}

/** Stands in for opening the link from the email. */
function openLink() {
  signIn(email.value.trim());
  navigateTo(redirect.value);
}

function google() {
  signIn('demo.google@aitrade.ua', {
    plan: 'PREMIUM',
    name: 'Олена Ковальчук',
  });
  navigateTo(redirect.value);
}

function demo(demoEmail: string, plan: (typeof DEMO_ACCOUNTS)[number]['plan']) {
  signInAs(demoEmail, plan);
  navigateTo(redirect.value);
}
</script>

<template>
  <div class="container-page py-14">
    <div class="mx-auto max-w-md">
      <h1 class="text-[length:var(--t-h2)] font-bold tracking-[-0.02em]">Вхід в AI Trade</h1>
      <p class="mt-2 text-text-secondary">
        Без паролів — увійдіть через Google або посиланням на пошту.
      </p>

      <p
        v-if="isAuthenticated"
        class="mt-6 rounded-[var(--r-md)] border border-success-500 bg-success-500/10 p-4 text-[var(--t-sm)]"
        role="status"
      >
        Ви вже увійшли.
        <NuxtLink to="/" class="font-semibold underline">На головну</NuxtLink>
      </p>

      <BaseButton class="mt-7 w-full" variant="secondary" size="lg" @click="google">
        Увійти через Google
      </BaseButton>

      <div class="my-6 flex items-center gap-3 text-[var(--t-xs)] text-text-muted">
        <span class="h-px flex-1 bg-border" />або<span class="h-px flex-1 bg-border" />
      </div>

      <form v-if="!sent" novalidate @submit.prevent="requestLink">
        <label for="email" class="text-[var(--t-sm)] font-medium">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          class="mt-2 h-11 w-full rounded-[var(--r-md)] border bg-surface px-3.5 transition-colors focus:border-primary"
          :class="error ? 'border-danger-500' : 'border-border'"
          :aria-invalid="Boolean(error)"
          aria-describedby="email-error"
        >
        <p v-if="error" id="email-error" class="mt-2 text-[var(--t-sm)] text-danger-500">
          {{ error }}
        </p>

        <BaseButton class="mt-4 w-full" size="lg" type="submit">
          Надіслати посилання
        </BaseButton>
      </form>

      <div
        v-else
        class="rounded-[var(--r-lg)] border border-border bg-bg-subtle p-5"
        role="status"
      >
        <p class="font-semibold">Перевірте пошту</p>
        <p class="mt-2 text-[var(--t-sm)] leading-relaxed text-text-secondary">
          Ми надіслали посилання для входу на <strong class="text-text">{{ email }}</strong>.
          Воно діє 15 хвилин.
        </p>
        <p class="mt-4 text-[var(--t-xs)] text-text-muted">
          Пошти тут ще немає — це кнопка замість листа:
        </p>
        <BaseButton class="mt-2 w-full" @click="openLink">Відкрити посилання</BaseButton>
        <button
          type="button"
          class="mt-3 text-[var(--t-sm)] text-text-muted underline"
          @click="sent = false"
        >Змінити email</button>
      </div>

      <!--
        Demo accounts, not product UI: without a backend there is no other way to
        reach the paid branches of the interface.
      -->
      <section class="mt-10 rounded-[var(--r-lg)] border border-dashed border-border p-5">
        <h2 class="text-[var(--t-sm)] font-semibold">Демо-акаунти</h2>
        <p class="mt-1 text-[var(--t-xs)] text-text-muted">
          Тимчасово, поки немає бекенда — щоб побачити інтерфейс на кожному тарифі.
        </p>

        <ul class="mt-4 space-y-2">
          <li v-for="account in DEMO_ACCOUNTS" :key="account.email">
            <button
              type="button"
              class="w-full rounded-[var(--r-md)] border border-border bg-surface p-3 text-left transition-colors hover:bg-surface-hover"
              @click="demo(account.email, account.plan)"
            >
              <span class="font-semibold">{{ account.label }}</span>
              <span class="mt-0.5 block text-[var(--t-xs)] text-text-muted">
                {{ account.description }}
              </span>
            </button>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
