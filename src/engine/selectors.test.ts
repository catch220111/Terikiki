import { describe, expect, it } from 'vitest';
import { deskReducer, initialDeskState } from './deskState.ts';
import { cardsHangingOnPage, labelForCard, looseCards, makeNote, makePdfPage } from './selectors.ts';

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

  it('hangs a multi-target note once, on the oldest pin', () => {
    let state = deskReducer(initialDeskState, {
      type: 'hydrate-document',
      document: { id: 'doc', title: 'L', sourceUrl: '/x.pdf', pageCount: 2 },
      pages: [
        makePdfPage({ documentId: 'doc', pageIndex: 0, title: 'Setup', excerpt: 'oscillator' }),
        makePdfPage({ documentId: 'doc', pageIndex: 1, title: 'Beating', excerpt: 'envelope' }),
      ],
    });
    const leaf = makeNote({ title: 'Why beating?', caption: '', filename: 'n.svg', imageUrl: '' });
    state = deskReducer(state, { type: 'import-note', note: leaf });
    state = deskReducer(state, {
      type: 'commit-anchor',
      cardId: leaf.id,
      target: { kind: 'page', documentId: 'doc', pageIndex: 1 },
      source: 'manual',
    });
    state = deskReducer(state, {
      type: 'commit-anchor',
      cardId: leaf.id,
      target: { kind: 'page', documentId: 'doc', pageIndex: 0 },
      source: 'manual',
    });
    expect(cardsHangingOnPage(state, 1).map((c) => c.id)).toEqual([leaf.id]);
    expect(cardsHangingOnPage(state, 0)).toEqual([]);
    expect(looseCards(state)).toEqual([]);
  });
});
