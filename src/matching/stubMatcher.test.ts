import { describe, expect, it } from 'vitest';
import { suggestMatches, StubMatchingService } from './stubMatcher.ts';
import { assertPendingOnly, formatConfidence } from './service.ts';
import { makeNote, makePdfPage } from '../engine/selectors.ts';

const pages = [
  makePdfPage({ documentId: 'doc', pageIndex: 0, title: 'Setup', excerpt: 'two oscillators masses springs' }),
  makePdfPage({
    documentId: 'doc',
    pageIndex: 1,
    title: 'Energy sloshing / beating',
    excerpt: 'envelope period coupling does not create energy',
  }),
];

describe('stubMatcher', () => {
  it('returns pending suggestions only — never an anchor', () => {
    const note = makeNote({
      title: 'Why beating?',
      caption: 'beating envelope page 2',
      filename: 'note-beating.svg',
      imageUrl: '',
      inkHints: ['page 2'],
    });
    const suggestions = suggestMatches(note, pages);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((s) => s.status === 'pending')).toBe(true);
    expect(suggestions.every((s) => s.rationale.length > 0)).toBe(true);
    expect(suggestions.some((s) => s.target.pageIndex === 1)).toBe(true);
  });

  it('still suggests something weak rather than silently attaching', () => {
    const note = makeNote({
      title: 'Grocery list',
      caption: 'milk',
      filename: 'list.png',
      imageUrl: '',
    });
    const suggestions = suggestMatches(note, pages);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.confidence).toBeLessThan(0.5);
    expect(suggestions[0]?.status).toBe('pending');
  });

  it('exposes MatchingService as suggest-only', () => {
    const matcher = new StubMatchingService();
    const note = makeNote({
      title: 'Box the envelope',
      caption: 'box region page 2',
      filename: 'note-envelope.svg',
      imageUrl: '',
      inkHints: ['box', 'region'],
    });
    const suggestions = matcher.suggestForNote(note, pages);
    expect(suggestions.some((s) => s.target.kind === 'region')).toBe(true);
    expect(suggestions.every((s) => s.status === 'pending')).toBe(true);
    expect(formatConfidence(0.87)).toBe('87%');
  });

  it('refuses to treat a committed suggestion as matcher output', () => {
    expect(() =>
      assertPendingOnly([
        {
          id: 'match_x',
          noteId: 'n',
          target: { kind: 'page', documentId: 'doc', pageIndex: 0 },
          confidence: 0.9,
          rationale: 'nope',
          status: 'accepted',
        },
      ]),
    ).toThrow(/pending/i);
  });
});
