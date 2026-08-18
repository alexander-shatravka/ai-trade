<script setup lang="ts">
import HeroSection from '~/components/landing/HeroSection.vue';
import FeatureGrid from '~/components/landing/FeatureGrid.vue';
import HowItWorks from '~/components/landing/HowItWorks.vue';
import PricingSection from '~/components/landing/PricingSection.vue';
import CtaSection from '~/components/landing/CtaSection.vue';

useHead({
  title: 'AI Trade — Продайте будь-яку річ за 30 секунд за допомогою AI',
  meta: [
    {
      name: 'description',
      content:
        'AI Trade — український маркетплейс, у якому оголошення створює штучний інтелект. ' +
        'Завантажте фото — AI напише заголовок, опис, характеристики та запропонує ціну.',
    },
  ],
});
</script>

<template>
  <HeroSection />
  <FeatureGrid />
  <HowItWorks />
  <PricingSection />
  <CtaSection />
</template>
