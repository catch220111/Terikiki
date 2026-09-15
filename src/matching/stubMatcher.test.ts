import { describe, expect, it } from 'vitest';
import { suggestMatches } from './stubMatcher.ts';
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
});
