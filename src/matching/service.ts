import type { MatchSuggestion, NoteCard, PdfPageCard, PendingMatchSuggestion } from '../types/domain.ts';
import { isPendingSuggestion } from '../types/domain.ts';

/**
 * MatchingService UX boundary.
 *
 * Implementations may only *suggest*. Return values are pending and are not anchors.
 * Accept / correct / manual pin live on the desk reducer — the only commit paths.
 * Reject never writes an anchor.
 */
export interface MatchingService {
  suggestForNote(note: NoteCard, pages: readonly PdfPageCard[]): readonly PendingMatchSuggestion[];
}

export function formatConfidence(confidence: number): string {
  const clamped = Math.min(1, Math.max(0, confidence));
  return `${Math.round(clamped * 100)}%`;
}

export function assertPendingOnly(
  suggestions: readonly MatchSuggestion[],
): readonly PendingMatchSuggestion[] {
  const pending: PendingMatchSuggestion[] = [];
  for (const suggestion of suggestions) {
    if (!isPendingSuggestion(suggestion)) {
      throw new Error('MatchingService must return pending suggestions only — never auto-commit.');
    }
    pending.push(suggestion);
  }
  return pending;
}
