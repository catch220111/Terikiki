import { describe, expect, it } from 'vitest';
import {
  COMMAND_MARK_GLYPH,
  DEFAULT_LAYER_VISIBILITY,
  cardLayer,
  clampRect,
  layerKey,
} from './domain.ts';

describe('layerKey', () => {
  it('joins origin and type', () => {
    expect(layerKey('student', 'handwriting')).toBe('student:handwriting');
  });
});

describe('DEFAULT_LAYER_VISIBILITY', () => {
  it('keeps PDF and handwriting on', () => {
    expect(DEFAULT_LAYER_VISIBILITY[layerKey('system', 'pdf')]).toBe(true);
    expect(DEFAULT_LAYER_VISIBILITY[layerKey('student', 'handwriting')]).toBe(true);
  });
});

describe('cardLayer', () => {
  it('maps card kinds onto origin/type layers', () => {
    expect(
      cardLayer({
        id: 'p',
        kind: 'pdf-page',
        origin: 'system',
        type: 'pdf',
        documentId: 'd',
        pageIndex: 0,
        axisIndex: 0,
        title: 't',
        excerpt: '',
      }),
    ).toEqual({ origin: 'system', type: 'pdf' });
    expect(
      cardLayer({
        id: 'n',
        kind: 'note',
        origin: 'student',
        type: 'handwriting',
        title: 'n',
        caption: '',
        filename: 'n.svg',
        imageUrl: '',
        inkHints: [],
        createdAt: '',
      }),
    ).toEqual({ origin: 'student', type: 'handwriting' });
  });
});

describe('command marks', () => {
  it('exposes the boarding glyphs', () => {
    expect(COMMAND_MARK_GLYPH.question).toBe('?');
    expect(COMMAND_MARK_GLYPH.star).toBe('*');
    expect(COMMAND_MARK_GLYPH.recall).toBe('R');
    expect(COMMAND_MARK_GLYPH.explain).toBe('EXPLAIN');
  });
});

describe('clampRect', () => {
  it('keeps normalized rects on the page', () => {
    const rect = clampRect({ x: -0.2, y: 0.9, w: 0.8, h: 0.5 });
    expect(rect.x).toBe(0);
    expect(rect.y).toBe(0.9);
    expect(rect.w).toBeGreaterThan(0);
    expect(rect.x + rect.w).toBeLessThanOrEqual(1);
    expect(rect.y + rect.h).toBeLessThanOrEqual(1);
  });
});
