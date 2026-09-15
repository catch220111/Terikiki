import { describe, expect, it } from 'vitest';
import { deskReducer, initialDeskState } from './deskState.ts';
import { labelForCard, looseCards, makeNote, makePdfPage } from './selectors.ts';

describe('selectors', () => {
  it('treats unanchored notes as loose leaves', () => {
    let state = deskReducer(initialDeskState, {
      type: 'hydrate-document',
      document: { id: 'doc', title: 'L', sourceUrl: '/x.pdf', pageCount: 1 },
      pages: [makePdfPage({ documentId: 'doc', pageIndex: 0, title: 'Setup', excerpt: 'oscillator' })],
    });
    const note = makeNote({ title: 'Why beating?', caption: '', filename: 'n.svg', imageUrl: '' });
    state = deskReducer(state, { type: 'import-note', note });
    expect(looseCards(state).map((c) => c.id)).toEqual([note.id]);
    expect(labelForCard(state.pages[0]!)).toBe('PDF p1');
    state = deskReducer(state, {
      type: 'commit-anchor',
      cardId: note.id,
      target: { kind: 'page', documentId: 'doc', pageIndex: 0 },
      source: 'manual',
    });
    expect(looseCards(state)).toEqual([]);
  });
});
