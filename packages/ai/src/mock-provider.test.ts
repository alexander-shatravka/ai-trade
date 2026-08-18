import { describe, expect, it, vi } from 'vitest';
import { sellerAnalysisResultSchema } from '@ai-trade/contracts';
import { MockProvider, hashSeed, pipelineSteps } from './mock-provider';
import { LowConfidenceError } from './provider';

/** Tests must not wait on the simulated pipeline. */
const instant = () => Promise.resolve();
const provider = new MockProvider();
const request = { mediaIds: ['m1', 'm2', 'm3'], enhancePhotos: true };

describe('determinism', () => {
  it('returns the same result for the same input', async () => {
    const a = await provider.analyzeForSelling(request, { sleep: instant });
    const b = await provider.analyzeForSelling(request, { sleep: instant });
    expect(a).toEqual(b);
  });

  it('returns different fixtures for different inputs', () => {
    const seeds = new Set(
      [['a'], ['b'], ['c'], ['d'], ['e'], ['f']].map(
        (mediaIds) => provider.selectFixture({ mediaIds, enhancePhotos: true }).result.recognition.productType,
      ),
    );
    expect(seeds.size).toBeGreaterThan(1);
  });

  it('hashes stably', () => {
    expect(hashSeed('m1m2m3')).toBe(hashSeed('m1m2m3'));
    expect(hashSeed('m1m2m3')).not.toBe(hashSeed('m1m2m4'));
  });
});

describe('result shape', () => {
  it('satisfies the contract', async () => {
    const result = await provider.analyzeForSelling(request, { sleep: instant });
    expect(sellerAnalysisResultSchema.safeParse(result).success).toBe(true);
  });

  it('keeps every price an integer number of kopiyky', async () => {
    const { price } = await provider.analyzeForSelling(request, { sleep: instant });
    for (const kop of [
      price.quickSaleKop,
      price.optimalKop,
      price.maximumKop,
      price.market.medianKop,
      price.market.p25Kop,
      price.market.p75Kop,
    ]) {
      expect(Number.isInteger(kop)).toBe(true);
    }
  });

  it('orders the three price scenarios', async () => {
    const { price } = await provider.analyzeForSelling(request, { sleep: instant });
    expect(price.quickSaleKop).toBeLessThan(price.optimalKop);
    expect(price.optimalKop).toBeLessThan(price.maximumKop);
  });

  it('carries the mandatory disclaimer', async () => {
    const { price } = await provider.analyzeForSelling(request, { sleep: instant });
    expect(price.disclaimer).toBe(
      'Рекомендація базується на ринкових даних і не є експертною оцінкою майна.',
    );
  });

  it('ties condition evidence to media the caller actually sent', async () => {
    const result = await provider.analyzeForSelling(request, { sleep: instant });
    for (const item of result.condition.evidence) {
      expect(request.mediaIds).toContain(item.mediaId);
    }
    for (const id of result.photoAdvice.lowQualityMediaIds) {
      expect(request.mediaIds).toContain(id);
    }
  });

  it('drops advice pointing at photos that were not uploaded', async () => {
    const result = await provider.analyzeForSelling(
      { mediaIds: ['only-one'], enhancePhotos: true },
      { sleep: instant },
    );
    for (const item of result.condition.evidence) {
      expect(item.mediaId).toBe('only-one');
    }
  });
});

describe('progress', () => {
  it('reports every step in order, ending at 100%', async () => {
    const seen: number[] = [];
    const labels: string[] = [];
    await provider.analyzeForSelling(request, {
      sleep: instant,
      onProgress: (p) => {
        seen.push(p.percent);
        labels.push(p.step);
      },
    });
    expect(labels).toEqual(pipelineSteps);
    expect(seen.at(-1)).toBe(100);
    expect([...seen].sort((a, b) => a - b)).toEqual(seen);
  });

  it('reports the first step before any waiting, so the UI is never blank', async () => {
    const onProgress = vi.fn();
    const sleep = vi.fn(() => Promise.resolve());
    await provider.analyzeForSelling(request, { sleep, onProgress });
    expect(onProgress).toHaveBeenCalled();
    expect(onProgress.mock.invocationCallOrder[0]).toBeLessThan(
      sleep.mock.invocationCallOrder[0] as number,
    );
  });
});

describe('low confidence', () => {
  it('refuses to invent a listing when it cannot identify the item', async () => {
    const forced = new MockProvider({ forceLowConfidence: true });
    await expect(forced.analyzeForSelling(request, { sleep: instant })).rejects.toBeInstanceOf(
      LowConfidenceError,
    );
  });

  it('stops at recognition rather than running the whole pipeline', async () => {
    const forced = new MockProvider({ forceLowConfidence: true });
    const onProgress = vi.fn();
    await forced.analyzeForSelling(request, { sleep: instant, onProgress }).catch(() => {});
    expect(onProgress).toHaveBeenCalledTimes(1);
  });

  it('is reachable from a hint that admits the seller does not know', async () => {
    await expect(
      provider.analyzeForSelling(
        { mediaIds: ['x'], hint: 'не знаю що це', enhancePhotos: true },
        { sleep: instant },
      ),
    ).rejects.toBeInstanceOf(LowConfidenceError);
  });
});
