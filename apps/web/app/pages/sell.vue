<script setup lang="ts">
import PhotoUpload from '~/components/sell/PhotoUpload.vue';
import AnalyzingProgress from '~/components/sell/AnalyzingProgress.vue';
import UnrecognizedNotice from '~/components/sell/UnrecognizedNotice.vue';
import DraftReview from '~/components/sell/DraftReview.vue';

const {
  stage,
  photos,
  hint,
  progress,
  result,
  attributeSchema,
  elapsedMs,
  lowConfidence,
  pipelineSteps,
  addPhotos,
  removePhoto,
  analyze,
  restart,
} = useAiSeller();

const { allows, isAuthenticated } = useAuth();

useHead({ title: 'Створити оголошення — AI Trade' });

/**
 * Rule: the limit is checked BEFORE the AI call, and quota is charged only
 * after it succeeds — a failed or degraded job must not cost a generation.
 * Signed-out visitors may still try the flow; publishing is what needs an
 * account.
 */
const quota = computed(() => allows('ai.generation'));
const blocked = computed(() => isAuthenticated.value && !quota.value.allowed);

async function startAnalysis() {
  if (blocked.value) return;
  await analyze();
}

const published = ref<{ priceKop: number; aiAcceptedFields: string[] } | null>(null);

function publish(payload: { priceKop: number; aiAcceptedFields: string[] }) {
  // No API yet: the draft is not persisted. The payload shape is already the
  // one POST /listings will take, so wiring it up is a single call.
  published.value = payload;
}
</script>

<template>
  <div class="container-page py-14">
    <template v-if="stage === 'upload'">
      <PhotoUpload
        :photos="photos"
        :hint="hint"
        @add="addPhotos"
        @remove="removePhoto"
        @update:hint="hint = $event"
        @analyze="startAnalysis"
      />

      <ClientOnly>
        <p
          v-if="blocked"
          class="mx-auto mt-6 max-w-2xl rounded-[var(--r-md)] border border-warning-500 bg-warning-500/10 p-4 text-[var(--t-sm)]"
          role="status"
        >
          {{ quota.reason }}.
          <NuxtLink to="/#pricing" class="font-semibold text-primary underline">
            Порівняти тарифи
          </NuxtLink>
        </p>
      </ClientOnly>
    </template>

    <AnalyzingProgress
      v-else-if="stage === 'analyzing'"
      :progress="progress"
      :steps="pipelineSteps"
      :photos="photos"
    />

    <UnrecognizedNotice
      v-else-if="stage === 'unrecognized' && lowConfidence"
      :confidence="lowConfidence.confidence"
      :product-type="lowConfidence.productType"
      @retry="restart"
      @manual="restart"
    />

    <template v-else-if="stage === 'review' && result">
      <div
        v-if="published"
        class="mx-auto mb-6 max-w-3xl rounded-[var(--r-lg)] border border-success-500 bg-success-500/10 p-5"
        role="status"
      >
        <p class="font-semibold">Чернетку зібрано</p>
        <p class="mt-1 text-[var(--t-sm)] text-text-secondary">
          Бекенда ще немає, тому оголошення не збережено. Ціна:
          {{ published.priceKop }} копійок, без правок залишено
          {{ published.aiAcceptedFields.length }} полів.
        </p>
      </div>

      <DraftReview
        :result="result"
        :attribute-schema="attributeSchema"
        :photos="photos"
        :elapsed-ms="elapsedMs"
        @publish="publish"
      />
    </template>
  </div>
</template>
