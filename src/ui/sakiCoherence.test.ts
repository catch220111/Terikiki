import { describe, expect, it } from 'vitest';
import appSrc from '../App.tsx?raw';
import contextSrc from '../ai/context.ts?raw';
import { liveAskCardIds } from '../ai/lock.ts';
import { deskReducer, initialDeskState } from '../engine/deskState.ts';
import {
  cardsHangingOnPage,
  makeNote,
  makePdfPage,
  pendingSuggestionsFor,
  selectedCards,
} from '../engine/selectors.ts';
import { pendingSuggestionIdsOnGraph } from '../matching/lock.ts';
import type { MatchSuggestion } from '../types/domain.ts';
import { CONNECTED_GLANCE_WIDTH_PX } from './cameraFit.ts';
import noteSrc from './NoteCard.tsx?raw';
import viewportSrc from './MatrixViewport.tsx?raw';
import cameraSrc from './cameraFit.ts?raw';
import {
  CARD_WIDTH_PX,
  defaultGlanceIncludesHangingInk,
  demoPendingMatchesStayOffGraph,
  demoSelectionGathersInkAndPdf,
  handwritingIsOnlyWarmAccent,
  jamesLingxiCoherenceMissing,
  stageIsNearWhitePaper,
} from './lock.ts';

const { readFileSync } = await import('fs');
const { dirname, join } = await import('path');
const { fileURLToPath } = await import('url');
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles/desk.css'), 'utf8');

function page(index: number) {
  return makePdfPage({
    documentId: 'sample:coupled-notes',
    pageIndex: index,
    title: `Page ${index + 1}`,
    excerpt: 'beating envelope',
  });
}

function ink(title: string) {
  return makeNote({
    title,
    caption: `${title} page 2`,
    filename: 'note.svg',
    imageUrl: 'data:image/svg+xml,test',
    inkHints: ['?'],
  });
}

function pendingFor(noteId: string, id: string): MatchSuggestion {
  return {
    id,
    noteId,
    target: { kind: 'page', documentId: 'sample:coupled-notes', pageIndex: 1 },
    confidence: 0.7,
    rationale: 'stub',
    status: 'pending',
  };
}

describe('Saki James/Lingxi coherence bar', () => {
  it('locks source: connected glance, mixed SelectionSet, pending off the graph', () => {
    expect(defaultGlanceIncludesHangingInk(cameraSrc, viewportSrc, appSrc)).toBe(true);
    expect(demoSelectionGathersInkAndPdf(appSrc, contextSrc)).toBe(true);
    expect(demoPendingMatchesStayOffGraph(appSrc, noteSrc)).toBe(true);
    expect(handwritingIsOnlyWarmAccent(css)).toBe(true);
    expect(stageIsNearWhitePaper(css)).toBe(true);
    expect(
      jamesLingxiCoherenceMissing(css, cameraSrc, viewportSrc, appSrc, noteSrc, contextSrc),
    ).toEqual([]);
  });

  it('frames PDF + hanging handwriting wider than a PDF-only shell', () => {
    expect(CONNECTED_GLANCE_WIDTH_PX).toBeGreaterThan(CARD_WIDTH_PX.pdf);
    expect(CONNECTED_GLANCE_WIDTH_PX).toBe(CARD_WIDTH_PX.pdf + 18 + CARD_WIDTH_PX.note);
  });

  it('demo path: hanging ink shares the page, SelectionSet is ink+PDF, pending slips stay off the graph', () => {
    let state = deskReducer(initialDeskState, {
      type: 'hydrate-document',
      document: {
        id: 'sample:coupled-notes',
        title: 'Lecture',
        sourceUrl: '/x.pdf',
        pageCount: 3,
      },
      pages: [page(0), page(1), page(2)],
    });
    const hanging = ink('Why beating?');
    const other = ink('Box the envelope');
    state = deskReducer(state, { type: 'import-note', note: hanging });
    state = deskReducer(state, { type: 'import-note', note: other });
    state = deskReducer(state, {
      type: 'propose-matches',
      suggestions: [pendingFor(hanging.id, 'match_hang'), pendingFor(other.id, 'match_other')],
    });
    state = deskReducer(state, {
      type: 'commit-manual-anchor',
      cardId: hanging.id,
      target: { kind: 'page', documentId: 'sample:coupled-notes', pageIndex: 1 },
    });
    const pdfPage = state.pages.find((p) => p.pageIndex === 1);
    if (!pdfPage) throw new Error('missing p2');
    state = deskReducer(state, { type: 'select-card', cardId: hanging.id, additive: false });
    state = deskReducer(state, { type: 'select-card', cardId: pdfPage.id, additive: false });
    state = deskReducer(state, { type: 'focus-card', cardId: pdfPage.id });

    expect(cardsHangingOnPage(state, 1).map((card) => card.id)).toContain(hanging.id);
    expect(pendingSuggestionsFor(state, hanging.id)).toHaveLength(1);
    expect(pendingSuggestionsFor(state, other.id)).toHaveLength(1);
    expect(pendingSuggestionIdsOnGraph(state.suggestions, state.anchors)).toEqual([]);
    expect(state.anchors).toHaveLength(1);
    expect(state.anchors[0]?.source).toBe('manual');
    const kinds = selectedCards(state).map((card) => card.kind).sort();
    expect(kinds).toEqual(['note', 'pdf-page']);
    expect([...liveAskCardIds(state)].sort()).toEqual([hanging.id, pdfPage.id].sort());
  });
});
