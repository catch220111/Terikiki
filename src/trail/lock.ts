import type { ThinkingTrailEvent } from '../types/domain.ts';
import { orderedTrail, originAgreesWithVoice } from './events.ts';

/**
 * Stage 4 lock: the thinking trail is a thin, ordered history keyed to card ids.
 * AI-generated beats must be labeled separately from student ink. Not a VCS.
 */
export function trailCardIds(events: readonly ThinkingTrailEvent[]): string[] {
  return orderedTrail(events).map((event) => event.cardId);
}

export function trailKindSequence(events: readonly ThinkingTrailEvent[]): ThinkingTrailEvent['kind'][] {
  return orderedTrail(events).map((event) => event.kind);
}

export function unlabeledAiBeats(events: readonly ThinkingTrailEvent[]): string[] {
  return events.filter((event) => event.fromAi && event.layerOrigin !== 'ai').map((event) => event.id);
}

export function mislabeledStudentBeats(events: readonly ThinkingTrailEvent[]): string[] {
  return events.filter((event) => !event.fromAi && event.layerOrigin === 'ai').map((event) => event.id);
}

export function trailVoiceViolations(events: readonly ThinkingTrailEvent[]): string[] {
  return events.filter((event) => !originAgreesWithVoice(event.layerOrigin, event.fromAi)).map((event) => event.id);
}

export function trailIsKeyedToCards(events: readonly ThinkingTrailEvent[]): boolean {
  return events.every((event) => event.cardId.length > 0);
}
