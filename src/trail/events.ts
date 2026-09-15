import type { LayerOrigin, ThinkingTrailEvent, TrailEventKind } from '../types/domain.ts';
import { assertNever } from '../types/domain.ts';
import { createId } from '../engine/ids.ts';

export const TRAIL_KIND_LABEL: Record<TrailEventKind, string> = {
  first_note: 'First note',
  question: 'Question',
  pdf_evidence: 'PDF evidence',
  correction: 'Correction',
  ai_explanation: 'AI explanation',
  latest_understanding: 'Latest understanding',
};

export function trailKindLabel(kind: TrailEventKind): string {
  switch (kind) {
    case 'first_note':
    case 'question':
    case 'pdf_evidence':
    case 'correction':
    case 'ai_explanation':
    case 'latest_understanding':
      return TRAIL_KIND_LABEL[kind];
    default:
      return assertNever(kind, 'Unhandled trail kind');
  }
}

export function trailVoice(fromAi: boolean): 'ai' | 'ink' {
  return fromAi ? 'ai' : 'ink';
}

export function makeTrailEvent(partial: Omit<ThinkingTrailEvent, 'id'>): ThinkingTrailEvent {
  return { ...partial, id: createId('trail') };
}

/** Append-only copy. Insertion order is the thinking order — not a VCS log. */
export function orderedTrail(events: readonly ThinkingTrailEvent[]): ThinkingTrailEvent[] {
  return [...events];
}

export function originAgreesWithVoice(layerOrigin: LayerOrigin, fromAi: boolean): boolean {
  return fromAi === (layerOrigin === 'ai');
}
