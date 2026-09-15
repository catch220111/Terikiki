import { matchSuggestionId, type Anchor, type MatchSuggestion } from '../types/domain.ts';

/**
 * Stage 2 lock: pending (and rejected) suggestions stay off the anchor graph.
 * Match-sourced anchors must cite an accepted or corrected suggestion id.
 */
export function pendingSuggestionIdsOnGraph(
  suggestions: readonly MatchSuggestion[],
  anchors: readonly Anchor[],
): string[] {
  const leaked: string[] = [];
  for (const suggestion of suggestions) {
    if (suggestion.status !== 'pending' && suggestion.status !== 'rejected') continue;
    const hit = anchors.some((anchor) => matchSuggestionId(anchor) === suggestion.id);
    if (hit) leaked.push(suggestion.id);
  }
  return leaked;
}

export function matchAnchorsCiteDecidedSuggestions(
  suggestions: readonly MatchSuggestion[],
  anchors: readonly Anchor[],
): boolean {
  const decided = new Map(
    suggestions
      .filter((s) => s.status === 'accepted' || s.status === 'corrected')
      .map((s) => [s.id, s.status]),
  );
  for (const anchor of anchors) {
    const suggestionId = matchSuggestionId(anchor);
    if (!suggestionId) continue;
    const status = decided.get(suggestionId);
    if (anchor.source === 'accepted-match' && status !== 'accepted') return false;
    if (anchor.source === 'corrected-match' && status !== 'corrected') return false;
  }
  return true;
}
