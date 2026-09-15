import { describe, expect, it } from 'vitest';
import { StubMatchingService } from './matching';

describe('StubMatchingService', () => {
  it('never auto-commits suggestions', async () => {
    const svc = new StubMatchingService();
    await expect(svc.suggestForNote()).resolves.toEqual([]);
  });
});
