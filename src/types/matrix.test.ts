import { describe, expect, it } from 'vitest';
import { DEFAULT_LAYER_VISIBILITY, layerKey } from './matrix';

describe('layerKey', () => {
  it('joins origin and type', () => {
    expect(layerKey('student', 'handwriting')).toBe('student:handwriting');
  });
});

describe('DEFAULT_LAYER_VISIBILITY', () => {
  it('keeps PDF and handwriting on by default', () => {
    expect(DEFAULT_LAYER_VISIBILITY[layerKey('system', 'pdf')]).toBe(true);
    expect(DEFAULT_LAYER_VISIBILITY[layerKey('student', 'handwriting')]).toBe(true);
  });
});
