import { describe, expect, it } from 'vitest';
import {
  anchorsForCard,
  describeTarget,
  hasMatchingAnchor,
  isTinyRegion,
  pageTarget,
  primaryHangPageIndex,
  regionTarget,
  sameTarget,
} from './anchors.ts';
import type { Anchor } from '../types/domain.ts';

function anchor(cardId: string, target: Anchor['target'], id = 'a'): Anchor {
  return { id, cardId, target, source: 'manual' };
}

describe('anchor helpers', () => {
  it('builds page and clamped region targets', () => {
    expect(pageTarget('doc', 2)).toEqual({ kind: 'page', documentId: 'doc', pageIndex: 2 });
    const region = regionTarget('doc', 1, { x: -0.2, y: 0.9, w: 0.8, h: 0.5 });
    expect(region.kind).toBe('region');
    if (region.kind !== 'region') throw new Error('expected region');
    expect(region.rect.x).toBe(0);
    expect(region.rect.y).toBe(0.9);
    expect(region.rect.x + region.rect.w).toBeLessThanOrEqual(1);
    expect(region.rect.y + region.rect.h).toBeLessThanOrEqual(1);
  });

  it('compares targets without confusing page and region', () => {
    const page = pageTarget('doc', 1);
    const region = regionTarget('doc', 1, { x: 0.1, y: 0.2, w: 0.3, h: 0.4 });
    expect(sameTarget(page, pageTarget('doc', 1))).toBe(true);
    expect(sameTarget(page, pageTarget('doc', 0))).toBe(false);
    expect(sameTarget(page, region)).toBe(false);
    expect(sameTarget(region, regionTarget('doc', 1, { x: 0.1, y: 0.2, w: 0.3, h: 0.4 }))).toBe(true);
  });

  it('describes targets in student language', () => {
    expect(describeTarget(pageTarget('doc', 0))).toBe('page 1');
    expect(describeTarget(regionTarget('doc', 2, { x: 0.1, y: 0.1, w: 0.2, h: 0.2 }))).toBe('region on p3');
  });

  it('detects duplicate pins and tiny accidental drags', () => {
    const target = pageTarget('doc', 0);
    const anchors = [anchor('note_1', target, 'a1')];
    expect(hasMatchingAnchor(anchors, 'note_1', target)).toBe(true);
    expect(hasMatchingAnchor(anchors, 'note_1', pageTarget('doc', 1))).toBe(false);
    expect(isTinyRegion({ x: 0.4, y: 0.4, w: 0.01, h: 0.4 })).toBe(true);
    expect(isTinyRegion({ x: 0.1, y: 0.1, w: 0.2, h: 0.2 })).toBe(false);
  });

  it('hangs a multi-target note on its oldest pin', () => {
    const anchors = [
      anchor('note_1', pageTarget('doc', 2), 'a1'),
      anchor('note_1', regionTarget('doc', 0, { x: 0.1, y: 0.1, w: 0.2, h: 0.2 }), 'a2'),
      anchor('note_2', pageTarget('doc', 0), 'a3'),
    ];
    expect(primaryHangPageIndex(anchors, 'note_1')).toBe(2);
    expect(primaryHangPageIndex(anchors, 'note_2')).toBe(0);
    expect(primaryHangPageIndex(anchors, 'missing')).toBeUndefined();
    expect(anchorsForCard(anchors, 'note_1')).toHaveLength(2);
  });
});
