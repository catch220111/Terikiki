import { describe, expect, it } from 'vitest';
import { matchAnchorsCiteDecidedSuggestions, pendingSuggestionIdsOnGraph } from './lock.ts';
import type { Anchor, MatchSuggestion } from '../types/domain.ts';

const pending: MatchSuggestion = {
  id: 'match_1',
  noteId: 'n1',
  target: { kind: 'page', documentId: 'doc', pageIndex: 0 },
  confidence: 0.8,
  rationale: 'stub',
  status: 'pending',
};

const rejected: MatchSuggestion = { ...pending, id: 'match_2', status: 'rejected' };

const accepted: MatchSuggestion = { ...pending, id: 'match_3', status: 'accepted' };

describe('Stage 2 anchor lock', () => {
  it('keeps pending and rejected suggestion ids off the graph', () => {
    const anchors: Anchor[] = [{ id: 'a1', cardId: 'n1', target: pending.target, source: 'manual' }];
    expect(pendingSuggestionIdsOnGraph([pending, rejected], anchors)).toEqual([]);
  });

  it('flags a pending suggestion that leaked onto a match-sourced anchor', () => {
    const leak: Anchor = {
      id: 'a2',
      cardId: 'n1',
      target: pending.target,
      source: 'accepted-match',
      suggestionId: 'match_1',
    };
    expect(pendingSuggestionIdsOnGraph([pending], [leak])).toEqual(['match_1']);
  });

  it('requires match-sourced anchors to cite an accepted or corrected suggestion', () => {
    const ok: Anchor = {
      id: 'a3',
      cardId: 'n1',
      target: accepted.target,
      source: 'accepted-match',
      suggestionId: 'match_3',
    };
    expect(matchAnchorsCiteDecidedSuggestions([accepted], [ok])).toBe(true);
    expect(matchAnchorsCiteDecidedSuggestions([pending], [ok])).toBe(false);
  });
});
