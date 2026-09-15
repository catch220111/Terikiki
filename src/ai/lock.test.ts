import { describe, expect, it } from 'vitest';
import { boundCitations } from './context.ts';
import {
  askContextMatchesChips,
  askStartsTucked,
  citationIdsOutsideSelection,
  liveAskCardIds,
} from './lock.ts';
import { deskReducer, initialDeskState } from '../engine/deskState.ts';
import { makeNote, makePdfPage } from '../engine/selectors.ts';

function hydrated() {
  return deskReducer(initialDeskState, {
    type: 'hydrate-document',
    document: { id: 'doc', title: 'Lecture', sourceUrl: '/x.pdf', pageCount: 2 },
    pages: [
      makePdfPage({ documentId: 'doc', pageIndex: 0, title: 'Setup', excerpt: 'oscillator' }),
      makePdfPage({ documentId: 'doc', pageIndex: 1, title: 'Energy sloshing', excerpt: 'envelope' }),
    ],
  });
}

describe('Stage 3 Ask lock', () => {
  it('starts tucked so Ask is never a permanent rail', () => {
    expect(askStartsTucked(initialDeskState.askOpen)).toBe(true);
    const open = deskReducer(initialDeskState, { type: 'open-ask', open: true });
    expect(open.askOpen).toBe(true);
    const tucked = deskReducer(open, { type: 'open-ask', open: false });
    expect(askStartsTucked(tucked.askOpen)).toBe(true);
  });

  it('Ask context is exactly the live SelectionSet chips', () => {
    let state = hydrated();
    const page = state.pages[0]!.id;
    const note = makeNote({
      title: 'Why beating?',
      caption: 'why beating',
      filename: 'n.svg',
      imageUrl: '',
    });
    state = deskReducer(state, { type: 'import-note', note });
    expect(askContextMatchesChips(state)).toBe(true);
    expect(liveAskCardIds(state)).toEqual([]);

    state = deskReducer(state, { type: 'select-card', cardId: page, additive: false });
    expect(liveAskCardIds(state)).toEqual([page]);
    expect(askContextMatchesChips(state)).toBe(true);

    state = deskReducer(state, { type: 'select-card', cardId: note.id, additive: true });
    expect(liveAskCardIds(state)).toEqual([page, note.id]);
    expect(askContextMatchesChips(state)).toBe(true);

    state = deskReducer(state, { type: 'remove-from-selection', cardId: page });
    expect(liveAskCardIds(state)).toEqual([note.id]);
    expect(askContextMatchesChips(state)).toBe(true);

    state = deskReducer(state, { type: 'clear-selection' });
    expect(liveAskCardIds(state)).toEqual([]);
    expect(askContextMatchesChips(state)).toBe(true);
  });

  it('answers may only cite the gathering; jump-back does not change chips', () => {
    let state = hydrated();
    const page = state.pages[0]!.id;
    const other = state.pages[1]!.id;
    state = deskReducer(state, { type: 'select-card', cardId: page, additive: false });
    const bound = boundCitations(
      [{ id: page, kind: 'pdf-page', title: 'Setup', origin: 'system', type: 'pdf', excerpt: 'oscillator', pageIndex: 0, pins: [] }],
      [
        {
          cardId: page,
          quote: 'oscillator',
          kind: 'pdf-page',
          label: 'PDF p1 · Setup',
          pageIndex: 0,
          revealCardId: page,
        },
        {
          cardId: other,
          quote: 'leaked',
          kind: 'pdf-page',
          label: 'PDF p2',
          pageIndex: 1,
          revealCardId: other,
        },
      ],
    );
    expect(citationIdsOutsideSelection([page], bound)).toEqual([]);
    expect(bound.every((cite) => cite.cardId === page)).toBe(true);

    state = deskReducer(state, {
      type: 'add-ai-turn',
      turn: {
        id: 'turn_1',
        prompt: 'explain',
        selectionCardIds: [page],
        answer: 'from the gathering',
        citations: bound,
        at: '2026-09-15T00:00:00.000Z',
      },
    });
    state = deskReducer(state, { type: 'focus-card', cardId: other, anchorId: undefined });
    expect(state.selection.cardIds).toEqual([page]);
    expect(state.focusCardId).toBe(other);
    expect(askContextMatchesChips(state)).toBe(true);
  });
});
