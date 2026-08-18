<script setup lang="ts">
import BaseButton from '~/components/BaseButton.vue';

defineProps<{ hiddenCount: number; reason?: string }>();
</script>

<template>
  <!--
    The FREE teaser. It names a real problem and hides the numbers and the
    fixes — not a fake lock over nothing.
  -->
  <section class="rounded-[var(--r-lg)] border border-primary bg-primary-soft p-6">
    <h2 class="text-[length:var(--t-h4)] font-semibold">
      AI знайшов ще {{ hiddenCount }}
      {{ hiddenCount === 1 ? 'причину' : hiddenCount < 5 ? 'причини' : 'причин' }}
    </h2>
    <p v-if="reason" class="mt-2 text-[var(--t-sm)] font-medium text-primary">{{ reason }}</p>
    <p class="mt-2 text-[var(--t-sm)] leading-relaxed text-text-secondary">
      На тарифі Premium видно всі знахідки з числами, доказами й кнопкою «застосувати»:
      наскільки ваша ціна відрізняється від медіани, яких фото бракує та що виправити
      в заголовку, щоб оголошення потрапляло у видачу.
    </p>
    <BaseButton class="mt-5" variant="ai" to="/#pricing">
      Перейти на Premium — 199 ₴/міс
    </BaseButton>
  </section>
</template>
