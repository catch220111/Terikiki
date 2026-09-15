import type { MatchSuggestion, NoteCard, PdfPageCard } from '../types/domain.ts';

/**
 * MatchingService UX boundary.
 *
 * Implementations may only *suggest*. They never write anchors.
 * Accept / reject / correct live on the desk reducer — the only commit paths.
 */
export interface MatchingService {
  suggestForNote(note: NoteCard, pages: readonly PdfPageCard[]): readonly MatchSuggestion[];
}

export function formatConfidence(confidence: number): string {
  const clamped = Math.min(1, Math.max(0, confidence));
  return `${Math.round(clamped * 100)}%`;
}

export function assertPendingOnly(suggestions: readonly MatchSuggestion[]): readonly MatchSuggestion[] {
  for (const suggestion of suggestions) {
    if (suggestion.status !== 'pending') {
      throw new Error('MatchingService must return pending suggestions only — never auto-commit.');
    }
  }
  return suggestions;
}
