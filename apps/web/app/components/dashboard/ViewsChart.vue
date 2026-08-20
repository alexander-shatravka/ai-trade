<script setup lang="ts">
/**
 * Views over 30 days — one series, one axis.
 *
 * Contacts are deliberately NOT plotted here: they run in single digits against
 * views in the hundreds, so sharing an axis would flatten one of them and a
 * second y-scale is never the answer. Contacts have their own stat tile.
 *
 * The series colour is var(--primary), which is brand-500 in light and
 * brand-400 in dark; both were checked against their surface for contrast.
 */
import type { StatsPoint } from '@ai-trade/contracts';

const props = defineProps<{ series: StatsPoint[]; deltaPercent: number | null }>();

/**
 * The chart is drawn at its real pixel size rather than scaled from a fixed
 * viewBox: scaling a 720-wide drawing into a 333px phone column would shrink
 * 11px labels to about 5px. One SVG unit is always one CSS pixel here.
 */
const wrapper = ref<HTMLElement | null>(null);
const W = ref(720);
const H = computed(() => (W.value < 480 ? 160 : 200));
const PAD = computed(() => ({
  top: 16,
  right: 8,
  bottom: 24,
  left: W.value < 480 ? 32 : 40,
}));

let observer: ResizeObserver | null = null;

function measure(width: number) {
  W.value = Math.max(280, Math.round(width));
}

onMounted(async () => {
  // The wrapper is inside v-show, so wait a tick for it to exist before measuring.
  await nextTick();
  const el = wrapper.value;
  if (!el) return;

  measure(el.getBoundingClientRect().width);
  observer = new ResizeObserver(([entry]) => {
    if (entry) measure(entry.contentRect.width);
  });
  observer.observe(el);
});
onBeforeUnmount(() => observer?.disconnect());

const showTable = ref(false);
const hoverIndex = ref<number | null>(null);

const maxViews = computed(() => Math.max(...props.series.map((p) => p.views)));
/** Round the axis top to a clean number so the gridline labels read well. */
const axisMax = computed(() => Math.ceil(maxViews.value / 50) * 50);

const plotW = computed(() => W.value - PAD.value.left - PAD.value.right);
const plotH = computed(() => H.value - PAD.value.top - PAD.value.bottom);

const x = (index: number) =>
  PAD.value.left + (index / Math.max(1, props.series.length - 1)) * plotW.value;
const y = (value: number) =>
  PAD.value.top + plotH.value - (value / axisMax.value) * plotH.value;

const linePath = computed(() =>
  props.series.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.views).toFixed(1)}`).join(' '),
);

const areaPath = computed(() => {
  const base = PAD.value.top + plotH.value;
  return `${linePath.value} L${x(props.series.length - 1).toFixed(1)},${base} L${PAD.value.left},${base} Z`;
});

/** Three gridlines is enough to read magnitude without hatching the plot. */
const ticks = computed(() => [0, axisMax.value / 2, axisMax.value]);

/** Selective labelling: the peak only, never a number on every point. */
const peakIndex = computed(() =>
  props.series.reduce((best, p, i) => (p.views > (props.series[best]?.views ?? 0) ? i : best), 0),
);

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });

const active = computed(() =>
  hoverIndex.value === null ? null : props.series[hoverIndex.value] ?? null,
);

function onMove(event: MouseEvent) {
  const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
  const ratio = (event.clientX - rect.left) / rect.width;
  const index = Math.round(
    ((ratio * W.value - PAD.value.left) / plotW.value) * (props.series.length - 1),
  );
  hoverIndex.value = Math.min(props.series.length - 1, Math.max(0, index));
}
</script>

<template>
  <section class="rounded-[var(--r-lg)] border border-border bg-surface p-6">
    <header class="flex flex-wrap items-baseline gap-3">
      <h2 class="text-[length:var(--t-h4)] font-semibold">Перегляди за 30 днів</h2>
      <span
        v-if="deltaPercent !== null"
        class="text-[var(--t-sm)] font-medium"
        :class="deltaPercent >= 0 ? 'text-success-500' : 'text-danger-500'"
      >{{ deltaPercent >= 0 ? '↑' : '↓' }} {{ Math.abs(deltaPercent) }}% до попереднього періоду</span>

      <button
        type="button"
        class="ml-auto text-[var(--t-sm)] text-text-muted underline"
        :aria-expanded="showTable"
        @click="showTable = !showTable"
      >{{ showTable ? 'Показати графіком' : 'Показати таблицею' }}</button>
    </header>

    <div v-show="!showTable" ref="wrapper" class="relative mt-5">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        :width="W"
        :height="H"
        class="w-full"
        role="img"
        :aria-label="`Графік переглядів за 30 днів, максимум ${maxViews} переглядів на день`"
        @mousemove="onMove"
        @mouseleave="hoverIndex = null"
      >
        <!-- Grid: recessive, horizontal only. -->
        <g>
          <line
            v-for="tick in ticks"
            :key="tick"
            :x1="PAD.left"
            :x2="W - PAD.right"
            :y1="y(tick)"
            :y2="y(tick)"
            stroke="var(--border)"
            stroke-width="1"
          />
          <text
            v-for="tick in ticks"
            :key="`l-${tick}`"
            :x="PAD.left - 8"
            :y="y(tick) + 4"
            text-anchor="end"
            fill="var(--text-muted)"
            font-size="11"
          >{{ tick }}</text>
        </g>

        <defs>
          <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.22" />
            <stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
          </linearGradient>
        </defs>

        <path :d="areaPath" fill="url(#viewsFill)" />
        <path
          :d="linePath"
          fill="none"
          stroke="var(--primary)"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <!-- Peak marker with a direct label, so the high point needs no tooltip. -->
        <circle
          :cx="x(peakIndex)"
          :cy="y(series[peakIndex]?.views ?? 0)"
          r="4"
          fill="var(--primary)"
          stroke="var(--surface)"
          stroke-width="2"
        />
        <text
          :x="x(peakIndex)"
          :y="y(series[peakIndex]?.views ?? 0) - 10"
          text-anchor="middle"
          fill="var(--text-secondary)"
          font-size="11"
          font-weight="600"
        >{{ series[peakIndex]?.views }}</text>

        <!-- Crosshair -->
        <g v-if="hoverIndex !== null && active">
          <line
            :x1="x(hoverIndex)"
            :x2="x(hoverIndex)"
            :y1="PAD.top"
            :y2="PAD.top + plotH"
            stroke="var(--border-strong)"
            stroke-width="1"
          />
          <circle
            :cx="x(hoverIndex)"
            :cy="y(active.views)"
            r="5"
            fill="var(--primary)"
            stroke="var(--surface)"
            stroke-width="2"
          />
        </g>

        <text
          :x="PAD.left"
          :y="H - 6"
          fill="var(--text-muted)"
          font-size="11"
        >{{ formatDay(series[0]?.date ?? '') }}</text>
        <text
          :x="W - PAD.right"
          :y="H - 6"
          text-anchor="end"
          fill="var(--text-muted)"
          font-size="11"
        >{{ formatDay(series.at(-1)?.date ?? '') }}</text>
      </svg>

      <p
        v-if="active"
        class="pointer-events-none absolute top-0 rounded-[var(--r-md)] border border-border bg-surface px-3 py-2 text-[var(--t-sm)] shadow-[var(--sh-md)]"
        :style="{ left: `${(x(hoverIndex ?? 0) / W) * 100}%`, transform: 'translateX(-50%)' }"
        role="status"
      >
        <span class="font-semibold">{{ active.views }}</span> переглядів
        <span class="block text-[var(--t-xs)] text-text-muted">{{ formatDay(active.date) }}</span>
      </p>
    </div>

    <!-- The same numbers as text, for screen readers and anyone who wants them. -->
    <div v-show="showTable" class="mt-5 max-h-64 overflow-y-auto">
      <table class="w-full text-[var(--t-sm)]">
        <caption class="sr-only">Перегляди та звернення за днями</caption>
        <thead class="sticky top-0 bg-surface text-left text-text-muted">
          <tr>
            <th scope="col" class="py-1.5 font-medium">Дата</th>
            <th scope="col" class="py-1.5 text-right font-medium">Перегляди</th>
            <th scope="col" class="py-1.5 text-right font-medium">Звернення</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="point in series" :key="point.date" class="border-t border-border">
            <td class="py-1.5">{{ formatDay(point.date) }}</td>
            <td class="py-1.5 text-right tabular-nums">{{ point.views }}</td>
            <td class="py-1.5 text-right tabular-nums">{{ point.contacts }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
