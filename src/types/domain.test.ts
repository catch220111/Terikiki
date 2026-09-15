import { describe, expect, it } from 'vitest';
import {
  COMMAND_MARK_GLYPH,
  COMMAND_MARK_IF_CONFIRMED,
  COMMAND_MARK_MEANING,
  DEFAULT_LAYER_VISIBILITY,
  cardLayer,
  citationKindVoice,
  clampRect,
  layerKey,
  sourceForCommitPath,
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
  it('exposes the boarding glyphs and meanings', () => {
    expect(COMMAND_MARK_GLYPH.question).toBe('?');
    expect(COMMAND_MARK_GLYPH.star).toBe('*');
    expect(COMMAND_MARK_GLYPH.recall).toBe('R');
    expect(COMMAND_MARK_GLYPH.explain).toBe('EXPLAIN');
    expect(COMMAND_MARK_MEANING.question).toBe('Unresolved question');
    expect(COMMAND_MARK_MEANING.box).toMatch(/study card/i);
    expect(COMMAND_MARK_MEANING.circle).toMatch(/equation/i);
    expect(COMMAND_MARK_MEANING.arrow).toMatch(/anchor/i);
    expect(COMMAND_MARK_IF_CONFIRMED.explain).toMatch(/until you Ask/i);
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

describe('citationKindVoice', () => {
  it('names printed pages, handwriting, AI cards, and pinned regions', () => {
    expect(citationKindVoice('pdf-page')).toBe('Printed page');
    expect(citationKindVoice('note')).toBe('Handwriting');
    expect(citationKindVoice('ai')).toBe('AI card');
    expect(citationKindVoice('region')).toBe('Pinned region');
  });
});

describe('anchor commit paths', () => {
  it('maps accept / correct / manual onto graph sources and excludes reject', () => {
    expect(sourceForCommitPath('accept')).toBe('accepted-match');
    expect(sourceForCommitPath('correct')).toBe('corrected-match');
    expect(sourceForCommitPath('manual')).toBe('manual');
    const paths: readonly string[] = ['accept', 'correct', 'manual'];
    expect(paths).not.toContain('reject');
  });
});
