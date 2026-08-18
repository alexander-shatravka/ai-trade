<script setup lang="ts">
import SectionHeading from './SectionHeading.vue';

const features = [
  {
    icon: '✨',
    title: 'AI створення оголошень',
    text: 'Розпізнає бренд, модель і категорію за фотографією, заповнює характеристики, пише заголовок і опис українською.',
    note: 'Заповнює 12 полів за 15 секунд',
  },
  {
    icon: '📊',
    title: 'AI оцінка ціни',
    text: 'Аналізує реальні угоди в категорії й пропонує три сценарії: швидкий продаж, оптимальна ціна, максимум — з поясненням кожного.',
    note: 'На основі медіани по ринку, не здогадок',
  },
  {
    icon: '🖼️',
    title: 'Покращення фото',
    text: 'Прибирає фон, підвищує різкість і яскравість, підказує, яких ракурсів бракує і скільки це додасть до ціни.',
    note: '+18% довіри за фото з увімкненим екраном',
  },
  {
    icon: '🔍',
    title: 'AI аналіз продажу',
    text: 'Оголошення висить тиждень без дзвінків? AI розбирає ціну, фото, опис, заголовок і час публікації — і каже, що саме виправити.',
    note: 'Кожна порада — з кнопкою «застосувати»',
  },
  {
    icon: '💬',
    title: 'AI допомога в чаті',
    text: 'Пропонує варіанти відповіді покупцям, підказує, чи вигідна пропозиція торгу, а для магазинів — відповідає на типові питання сам.',
    note: 'Швидка відповідь = вища позиція у видачі',
  },
  {
    icon: '🗣️',
    title: 'Пошук звичайною мовою',
    text: '«Ноутбук для ігор до 30000 грн» або «зимові шини R18» — AI розуміє сенс запиту і показує, як саме він його зрозумів.',
    note: 'Фільтри можна виправити в один клік',
  },
];
</script>

<template>
  <section id="features" class="border-y border-border bg-bg-subtle py-24">
    <div class="container-page">
      <SectionHeading
        eyebrow="Можливості"
        title="П'ять речей, які AI робить замість вас"
        lede="Не «розумний пошук» поверх старої дошки оголошень, а продукт, побудований навколо AI."
      />

      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="rounded-[var(--r-lg)] border border-border bg-surface p-6 shadow-[var(--sh-xs)] transition-all duration-[var(--d-base)] ease-[var(--e-out)] hover:-translate-y-0.5 hover:shadow-[var(--sh-md)]"
        >
          <div
            class="grid h-11 w-11 place-items-center rounded-[var(--r-md)] bg-primary-soft text-xl"
            aria-hidden="true"
          >{{ feature.icon }}</div>
          <h3 class="mt-4 text-[length:var(--t-h4)] font-semibold">{{ feature.title }}</h3>
          <p class="mt-2 text-[var(--t-sm)] leading-relaxed text-text-secondary">{{ feature.text }}</p>
          <p class="mt-4 text-[var(--t-xs)] font-medium text-accent-500">{{ feature.note }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
