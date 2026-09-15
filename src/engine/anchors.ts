import { clampRect, type Anchor, type AnchorTarget, type NormalizedRect } from '../types/domain.ts';

export function pageTarget(documentId: string, pageIndex: number): AnchorTarget {
  return { kind: 'page', documentId, pageIndex };
}

export function regionTarget(
  documentId: string,
  pageIndex: number,
  rect: NormalizedRect,
): AnchorTarget {
  return { kind: 'region', documentId, pageIndex, rect: clampRect(rect) };
}

export function sameTarget(a: AnchorTarget, b: AnchorTarget): boolean {
  if (a.documentId !== b.documentId || a.pageIndex !== b.pageIndex) return false;
  switch (a.kind) {
    case 'page':
      return b.kind === 'page';
    case 'region':
      return (
        b.kind === 'region' &&
        a.rect.x === b.rect.x &&
        a.rect.y === b.rect.y &&
        a.rect.w === b.rect.w &&
        a.rect.h === b.rect.h
      );
    default: {
      const _never: never = a;
      return _never;
    }
  }
}

export function describeTarget(target: AnchorTarget): string {
  switch (target.kind) {
    case 'page':
      return `page ${target.pageIndex + 1}`;
    case 'region':
      return `region on p${target.pageIndex + 1}`;
    default: {
      const _never: never = target;
      return _never;
    }
  }
}

export function hasMatchingAnchor(
  anchors: readonly Anchor[],
  cardId: string,
  target: AnchorTarget,
): boolean {
  return anchors.some((anchor) => anchor.cardId === cardId && sameTarget(anchor.target, target));
}

/** Oldest pin for a card — one leaf on the desk, many ink threads. */
export function primaryHangPageIndex(anchors: readonly Anchor[], cardId: string): number | undefined {
  return anchors.find((anchor) => anchor.cardId === cardId)?.target.pageIndex;
}

export function anchorsForCard(anchors: readonly Anchor[], cardId: string): Anchor[] {
  return anchors.filter((anchor) => anchor.cardId === cardId);
}

export function isTinyRegion(rect: NormalizedRect): boolean {
  return rect.w < 0.025 || rect.h < 0.025;
}
