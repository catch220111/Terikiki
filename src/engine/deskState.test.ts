import { describe, expect, it } from 'vitest';
import { deskReducer, initialDeskState } from './deskState.ts';
import { makeNote, makePdfPage, pendingSuggestionsFor, selectedCards } from './selectors.ts';
import { matchAnchorsCiteDecidedSuggestions, pendingSuggestionIdsOnGraph } from '../matching/lock.ts';
import { trailIsKeyedToCards, trailVoiceViolations } from '../trail/lock.ts';
import type { MatchSuggestion } from '../types/domain.ts';

function page(index: number) {
  return makePdfPage({
    documentId: 'doc',
    pageIndex: index,
    title: `Page ${index + 1}`,
    excerpt: 'oscillator beating envelope',
  });
}

function note(title = 'Why beating?') {
  return makeNote({
    title,
    caption: 'why beating page 2',
    filename: 'note.svg',
    imageUrl: 'data:image/svg+xml,test',
    inkHints: ['?'],
  });
}

function suggestion(noteId: string, overrides: Partial<MatchSuggestion> = {}): MatchSuggestion {
  return {
    id: 'match_1',
    noteId,
    target: { kind: 'page', documentId: 'doc', pageIndex: 1 },
    confidence: 0.8,
    rationale: 'test',
    status: 'pending',
    ...overrides,
  };
}

function lockHolds(state: ReturnType<typeof hydrated>) {
  expect(pendingSuggestionIdsOnGraph(state.suggestions, state.anchors)).toEqual([]);
  expect(matchAnchorsCiteDecidedSuggestions(state.suggestions, state.anchors)).toBe(true);
  expect(trailVoiceViolations(state.trail)).toEqual([]);
  expect(trailIsKeyedToCards(state.trail)).toBe(true);
}

function hydrated() {
  return deskReducer(initialDeskState, {
    type: 'hydrate-document',
    document: { id: 'doc', title: 'Lecture', sourceUrl: '/x.pdf', pageCount: 2 },
    pages: [page(0), page(1)],
  });
}

describe('deskReducer', () => {
  it('starts with Ask tucked so the matrix is the spatial center', () => {
    expect(initialDeskState.askOpen).toBe(false);
    const opened = deskReducer(initialDeskState, { type: 'open-ask', open: true });
    expect(opened.askOpen).toBe(true);
    const tucked = deskReducer(opened, { type: 'open-ask', open: false });
    expect(tucked.askOpen).toBe(false);
  });

  it('clicking another card gathers it instead of replacing the set', () => {
    let state = hydrated();
    const a = state.pages[0]!.id;
    const b = state.pages[1]!.id;
    state = deskReducer(state, { type: 'select-card', cardId: a, additive: false });
    state = deskReducer(state, { type: 'select-card', cardId: b, additive: false });
    expect(state.selection.cardIds).toEqual([a, b]);
    expect(selectedCards(state).map((c) => c.id)).toEqual([a, b]);
    state = deskReducer(state, { type: 'select-card', cardId: a, additive: true });
    expect(state.selection.cardIds).toEqual([b]);
  });

  it('hides a layer without deleting cards', () => {
    let state = hydrated();
    const key = 'system:pdf';
    state = deskReducer(state, { type: 'toggle-layer', key });
    expect(state.layers[key]).toBe(false);
    expect(state.pages).toHaveLength(2);
  });

  it('never auto-commits match suggestions', () => {
    let state = hydrated();
    const n = note();
    state = deskReducer(state, { type: 'import-note', note: n });
    state = deskReducer(state, { type: 'propose-matches', suggestions: [suggestion(n.id)] });
    expect(state.anchors).toHaveLength(0);
    expect(pendingSuggestionsFor(state, n.id)).toHaveLength(1);
    expect(state.trail.some((e) => e.kind === 'first_note')).toBe(true);
    lockHolds(state);
  });

  it('accept / reject / correct are the only commit paths', () => {
    let state = hydrated();
    const n = note();
    state = deskReducer(state, { type: 'import-note', note: n });
    state = deskReducer(state, { type: 'propose-matches', suggestions: [suggestion(n.id)] });
    state = deskReducer(state, { type: 'reject-match', suggestionId: 'match_1' });
    expect(state.anchors).toHaveLength(0);

    state = deskReducer(state, {
      type: 'propose-matches',
      suggestions: [suggestion(n.id, { id: 'match_2' })],
    });
    state = deskReducer(state, { type: 'accept-match', suggestionId: 'match_2' });
    expect(state.anchors).toHaveLength(1);
    const accepted = state.anchors[0];
    expect(accepted?.source).toBe('accepted-match');
    if (accepted?.source === 'accepted-match') {
      expect(accepted.suggestionId).toBe('match_2');
    }
    lockHolds(state);

    state = deskReducer(state, {
      type: 'propose-matches',
      suggestions: [suggestion(n.id, { id: 'match_3' })],
    });
    state = deskReducer(state, {
      type: 'correct-match',
      suggestionId: 'match_3',
      target: { kind: 'page', documentId: 'doc', pageIndex: 0 },
    });
    expect(state.anchors[1]?.source).toBe('corrected-match');
    expect(state.anchors[1]?.target).toMatchObject({ pageIndex: 0 });
    expect(state.trail.some((e) => e.kind === 'correction')).toBe(true);
    lockHolds(state);
  });

  it('lets one note pin to multiple targets without duplicating the same pin', () => {
    let state = hydrated();
    const n = note();
    state = deskReducer(state, { type: 'import-note', note: n });
    state = deskReducer(state, {
      type: 'commit-manual-anchor',
      cardId: n.id,
      target: { kind: 'page', documentId: 'doc', pageIndex: 1 },
    });
    state = deskReducer(state, {
      type: 'commit-manual-anchor',
      cardId: n.id,
      target: { kind: 'region', documentId: 'doc', pageIndex: 0, rect: { x: 0.1, y: 0.2, w: 0.4, h: 0.3 } },
    });
    expect(state.anchors).toHaveLength(2);
    state = deskReducer(state, {
      type: 'commit-manual-anchor',
      cardId: n.id,
      target: { kind: 'page', documentId: 'doc', pageIndex: 1 },
    });
    expect(state.anchors).toHaveLength(2);
  });

  it('corrects a pending suggestion by clicking a page', () => {
    let state = hydrated();
    const n = note();
    state = deskReducer(state, { type: 'import-note', note: n });
    state = deskReducer(state, { type: 'propose-matches', suggestions: [suggestion(n.id)] });
    state = deskReducer(state, { type: 'begin-anchor', noteId: n.id, mode: 'page', suggestionId: 'match_1' });
    state = deskReducer(state, { type: 'set-anchor-page', pageIndex: 0 });
    expect(state.suggestions[0]?.status).toBe('corrected');
    expect(state.anchors[0]?.source).toBe('corrected-match');
    expect(state.anchors[0]?.target).toMatchObject({ kind: 'page', pageIndex: 0 });
    expect(state.anchorDraft).toBeNull();
    lockHolds(state);
  });

  it('ignores matcher output that is not pending', () => {
    let state = hydrated();
    const n = note();
    state = deskReducer(state, { type: 'import-note', note: n });
    state = deskReducer(state, {
      type: 'propose-matches',
      suggestions: [suggestion(n.id, { status: 'accepted' })],
    });
    expect(state.suggestions).toHaveLength(0);
    expect(state.anchors).toHaveLength(0);
    lockHolds(state);
  });

  it('manual page anchor commits only after an explicit pin', () => {
    let state = hydrated();
    const n = note();
    state = deskReducer(state, { type: 'import-note', note: n });
    state = deskReducer(state, { type: 'begin-anchor', noteId: n.id, mode: 'page' });
    expect(state.anchors).toHaveLength(0);
    state = deskReducer(state, { type: 'set-anchor-page', pageIndex: 0 });
    expect(state.anchors).toHaveLength(1);
    expect(state.anchors[0]?.source).toBe('manual');
    expect(state.anchorDraft).toBeNull();
    lockHolds(state);
  });

  it('region draft waits for a later rect commit', () => {
    let state = hydrated();
    const n = note();
    state = deskReducer(state, { type: 'import-note', note: n });
    state = deskReducer(state, { type: 'begin-anchor', noteId: n.id, mode: 'region' });
    state = deskReducer(state, { type: 'set-anchor-page', pageIndex: 1 });
    expect(state.anchorDraft?.pageIndex).toBe(1);
    expect(state.anchors).toHaveLength(0);
    state = deskReducer(state, {
      type: 'commit-manual-anchor',
      cardId: n.id,
      target: { kind: 'region', documentId: 'doc', pageIndex: 1, rect: { x: 0.1, y: 0.1, w: 0.4, h: 0.2 } },
    });
    expect(state.anchors[0]?.target.kind).toBe('region');
    lockHolds(state);
  });

  it('focus-card reveals without changing the Ask selection set', () => {
    let state = hydrated();
    const a = state.pages[0]!.id;
    const b = state.pages[1]!.id;
    state = deskReducer(state, { type: 'select-card', cardId: a, additive: false });
    state = deskReducer(state, { type: 'focus-card', cardId: b, anchorId: 'region_1' });
    expect(state.selection.cardIds).toEqual([a]);
    expect(state.revealNonce).toBe(1);
    expect(state.focusCardId).toBe(b);
    expect(state.citedAnchorId).toBe('region_1');
  });

  it('AI turns record the selection snapshot, not the whole desk', () => {
    let state = hydrated();
    const a = state.pages[0]!.id;
    state = deskReducer(state, { type: 'select-card', cardId: a, additive: false });
    state = deskReducer(state, {
      type: 'add-ai-turn',
      turn: {
        id: 'turn_1',
        prompt: 'explain',
        selectionCardIds: [a],
        answer: 'because you selected this page',
        citations: [
          {
            cardId: a,
            quote: 'oscillator',
            kind: 'pdf-page',
            label: 'PDF p1 · Page 1',
            pageIndex: 0,
            revealCardId: a,
          },
        ],
        at: '2026-09-15T00:00:00.000Z',
      },
    });
    expect(state.aiTurns[0]?.selectionCardIds).toEqual([a]);
    expect(state.askOpen).toBe(true);
    expect(state.trail.some((e) => e.fromAi && e.kind === 'ai_explanation')).toBe(true);
    lockHolds(state);
  });

  it('confirming a detected mark does not happen implicitly', () => {
    let state = hydrated();
    const n = note();
    state = deskReducer(state, { type: 'import-note', note: n });
    state = deskReducer(state, {
      type: 'propose-marks',
      marks: [
        {
          id: 'mark_1',
          noteId: n.id,
          kind: 'question',
          glyph: '?',
          status: 'detected',
          rationale: 'test',
        },
      ],
    });
    expect(state.marks[0]?.status).toBe('detected');
    state = deskReducer(state, { type: 'confirm-mark', markId: 'mark_1' });
    expect(state.marks[0]?.status).toBe('confirmed');
    expect(state.trail.some((e) => e.kind === 'question')).toBe(true);
    lockHolds(state);
  });

  it('Stage 2 lock: pending stays off the graph; reject writes nothing; manual pin needs no suggestion', () => {
    let state = hydrated();
    const n = note();
    state = deskReducer(state, { type: 'import-note', note: n });
    expect(state.anchors).toHaveLength(0);
    state = deskReducer(state, { type: 'propose-matches', suggestions: [suggestion(n.id)] });
    expect(state.anchors).toHaveLength(0);
    lockHolds(state);

    state = deskReducer(state, { type: 'reject-match', suggestionId: 'match_1' });
    expect(state.anchors).toHaveLength(0);
    expect(state.suggestions[0]?.status).toBe('rejected');
    lockHolds(state);

    state = deskReducer(state, { type: 'begin-anchor', noteId: n.id, mode: 'page' });
    state = deskReducer(state, { type: 'set-anchor-page', pageIndex: 0 });
    expect(state.anchors).toHaveLength(1);
    expect(state.anchors[0]?.source).toBe('manual');
    expect(state.anchors[0] && 'suggestionId' in state.anchors[0]).toBe(false);
    lockHolds(state);
  });
});
