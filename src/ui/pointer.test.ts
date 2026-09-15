import { describe, expect, it } from 'vitest';
import { isAdditiveClick } from './pointer.ts';

describe('isAdditiveClick', () => {
  it('treats Shift, Ctrl, and Meta as additive', () => {
    expect(isAdditiveClick({ shiftKey: true, metaKey: false, ctrlKey: false })).toBe(true);
    expect(isAdditiveClick({ shiftKey: false, metaKey: true, ctrlKey: false })).toBe(true);
    expect(isAdditiveClick({ shiftKey: false, metaKey: false, ctrlKey: true })).toBe(true);
    expect(isAdditiveClick({ shiftKey: false, metaKey: false, ctrlKey: false })).toBe(false);
  });
});
