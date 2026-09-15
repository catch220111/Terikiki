import { describe, expect, it } from 'vitest';
import { EmptySelectionError } from './client.ts';
import { boundCitations, citationsFromSnapshots, lastTurnCitedIds, snapshotsFromSelection } from './context.ts';
import { MockAiClient } from './mockClient.ts';
import { deskReducer, initialDeskState } from '../engine/deskState.ts';
import { makeNote, makePdfPage } from '../engine/selectors.ts';

const pageSnap = {
  id: 'page_2',
  kind: 'pdf-page' as const,
  title: 'Energy sloshing',
  origin: 'system' as const,
  type: 'pdf' as const,
  excerpt: 'envelope period 2pi / |w+ - w-|',
  pageIndex: 1,
  pins: [],
};

const noteSnap = {
  id: 'note_1',
  kind: 'note' as const,
  title: 'Why beating?',
  origin: 'student' as const,
  type: 'handwriting' as const,
  excerpt: 'why does beating appear',
  pins: [
    {
      anchorId: 'anchor_region',
      kind: 'region' as const,
      pageIndex: 1,
      pageCardId: 'page_2',
      label: 'region on p2',
      rect: { x: 0.2, y: 0.3, w: 0.4, h: 0.2 },
    },
  ],
};

describe('MockAiClient', () => {
  it('refuses to run without an explicit selection', async () => {
    const client = new MockAiClient();
    await expect(client.complete({ prompt: 'hi', selection: [] })).rejects.toBeInstanceOf(EmptySelectionError);
  });

  it('cites only selected cards and their region pins', async () => {
    const client = new MockAiClient();
    const result = await client.complete({
      prompt: 'What is beating?',
      selection: [pageSnap, noteSnap],
    });
    expect(result.citations.map((c) => c.cardId)).toEqual(['page_2', 'note_1', 'note_1']);
    expect(result.citations.map((c) => c.kind)).toEqual(['pdf-page', 'note', 'region']);
    expect(result.citations[2]?.revealCardId).toBe('page_2');
    expect(result.citations[2]?.anchorId).toBe('anchor_region');
    expect(result.answer).toContain('Why beating?');
    expect(result.answer).toContain('Energy sloshing');
    expect(result.answer).toContain('region on p2');
    expect(result.answer).not.toContain('unselected');
  });
});

describe('Ask context', () => {
  it('builds snapshots from the live SelectionSet, including region pins', () => {
    let state = deskReducer(initialDeskState, {
      type: 'hydrate-document',
      document: { id: 'doc', title: 'Lecture', sourceUrl: '/x.pdf', pageCount: 2 },
      pages: [
        makePdfPage({ documentId: 'doc', pageIndex: 0, title: 'Setup', excerpt: 'oscillator' }),
        makePdfPage({ documentId: 'doc', pageIndex: 1, title: 'Energy sloshing', excerpt: 'envelope' }),
      ],
    });
    const note = makeNote({
      title: 'Why beating?',
      caption: 'why beating page 2',
      filename: 'note.svg',
      imageUrl: 'data:image/svg+xml,test',
    });
    state = deskReducer(state, { type: 'import-note', note });
    state = deskReducer(state, {
      type: 'commit-manual-anchor',
      cardId: note.id,
      target: { kind: 'region', documentId: 'doc', pageIndex: 1, rect: { x: 0.2, y: 0.3, w: 0.4, h: 0.2 } },
    });
    state = deskReducer(state, { type: 'select-card', cardId: state.pages[1]!.id, additive: false });
    state = deskReducer(state, { type: 'select-card', cardId: note.id, additive: true });

    const snapshots = snapshotsFromSelection(state);
    expect(snapshots.map((s) => s.id)).toEqual([state.pages[1]!.id, note.id]);
    expect(snapshots[0]?.pageIndex).toBe(1);
    expect(snapshots[1]?.pins).toHaveLength(1);
    expect(snapshots[1]?.pins[0]?.kind).toBe('region');
    expect(citationsFromSnapshots(snapshots).some((c) => c.kind === 'region')).toBe(true);
  });

  it('treats cited cards as visual links only while Ask is pulled', () => {
    let state = deskReducer(initialDeskState, {
      type: 'hydrate-document',
      document: { id: 'doc', title: 'Lecture', sourceUrl: '/x.pdf', pageCount: 1 },
      pages: [makePdfPage({ documentId: 'doc', pageIndex: 0, title: 'Setup', excerpt: 'oscillator' })],
    });
    const pageId = state.pages[0]!.id;
    state = deskReducer(state, {
      type: 'add-ai-turn',
      turn: {
        id: 'turn_1',
        prompt: 'explain',
        selectionCardIds: [pageId],
        answer: 'from the page',
        citations: [
          {
            cardId: pageId,
            quote: 'oscillator',
            kind: 'pdf-page',
            label: 'PDF p1 · Setup',
            pageIndex: 0,
            revealCardId: pageId,
          },
        ],
        at: '2026-09-15T00:00:00.000Z',
      },
    });
    expect(state.askOpen).toBe(true);
    expect(lastTurnCitedIds(state)).toEqual([pageId]);
    state = deskReducer(state, { type: 'open-ask', open: false });
    expect(lastTurnCitedIds(state)).toEqual([]);
  });

  it('drops citations that point outside the selection and fills thin replies', () => {
    const selection = [pageSnap];
    const dropped = boundCitations(selection, [
      { cardId: 'unselected', quote: 'nope', kind: 'note', label: 'nope', revealCardId: 'unselected' },
    ]);
    expect(dropped.map((c) => c.cardId)).toEqual(['page_2']);
    expect(dropped[0]?.label).toContain('PDF p2');

    const thin = boundCitations(selection, [
      { cardId: 'page_2', quote: 'envelope', kind: 'pdf-page', label: '', revealCardId: '' },
    ]);
    expect(thin[0]?.label).toContain('Energy sloshing');
    expect(thin[0]?.revealCardId).toBe('page_2');
  });
});
