import { describe, expect, it } from 'vitest';
import src from './printSheet.ts?raw';
import previewSrc from '../ui/PrintPreview.tsx?raw';
import { deskReducer, initialDeskState } from '../engine/deskState.ts';
import { makeNote, makePdfPage } from '../engine/selectors.ts';
import { buildPrintableHtml } from './printSheet.ts';
import {
  printPathUsesIframe,
  printPathUsesPopup,
  printSheetForcesSplitPages,
  printSheetHasSourceAndWorkingMargin,
  printSheetHasThinTrailStrip,
  printSheetOffersMarkConfirm,
  unlabeledAiOnPrintSheet,
  unlabeledStudentOnPrintSheet,
  unconfirmedGlyphsPrintedAsMarks,
} from './lock.ts';

function sheetState() {
  let state = deskReducer(initialDeskState, {
    type: 'hydrate-document',
    document: { id: 'doc', title: 'Coupled notes', sourceUrl: '/x.pdf', pageCount: 1 },
    pages: [
      makePdfPage({
        documentId: 'doc',
        pageIndex: 0,
        title: 'Setup',
        excerpt: 'two oscillators share energy when their frequencies nearly match',
      }),
    ],
  });
  const note = makeNote({
    title: 'Why beating?',
    caption: 'handwritten why',
    filename: 'n.svg',
    imageUrl: '',
  });
  const loose = makeNote({
    title: 'Box the envelope',
    caption: 'loose leaf',
    filename: 'e.svg',
    imageUrl: '',
  });
  state = deskReducer(state, { type: 'import-note', note });
  state = deskReducer(state, { type: 'import-note', note: loose });
  state = deskReducer(state, {
    type: 'commit-manual-anchor',
    cardId: note.id,
    target: { kind: 'page', documentId: 'doc', pageIndex: 0 },
  });
  state = deskReducer(state, {
    type: 'propose-marks',
    marks: [
      { id: 'm1', noteId: note.id, kind: 'question', glyph: '?', status: 'detected', rationale: 'x' },
      { id: 'm2', noteId: note.id, kind: 'star', glyph: '*', status: 'detected', rationale: 'y' },
    ],
  });
  state = deskReducer(state, { type: 'confirm-mark', markId: 'm1' });
  state = deskReducer(state, {
    type: 'add-ai-turn',
    turn: {
      id: 'turn_1',
      prompt: 'explain beating',
      selectionCardIds: [note.id],
      answer: 'because the frequencies are close',
      citations: [],
      at: '2026-09-15T00:00:00.000Z',
    },
  });
  state = deskReducer(state, {
    type: 'pin-ai-card',
    card: {
      id: 'ai_1',
      kind: 'ai',
      origin: 'ai',
      type: 'ai',
      title: 'Latest take',
      body: 'coupling term',
      citationCardIds: [note.id],
      createdAt: '2026-09-15T00:00:03.000Z',
    },
    attachToPageIndex: 0,
  });
  return state;
}

describe('Stage 4 print lock', () => {
  it('prints one coherent sheet: source excerpt + handwritten working margin, AI vs ink labeled', () => {
    const state = sheetState();
    const html = buildPrintableHtml(state);
    expect(printSheetHasSourceAndWorkingMargin(html)).toBe(true);
    expect(printSheetForcesSplitPages(html)).toBe(false);
    expect(printSheetHasThinTrailStrip(html)).toBe(true);
    expect(printSheetOffersMarkConfirm(html)).toBe(false);
    expect(unlabeledAiOnPrintSheet(html)).toEqual([]);
    expect(unlabeledStudentOnPrintSheet(html)).toEqual([]);
    expect(unconfirmedGlyphsPrintedAsMarks(html, state.marks)).toEqual([]);
    expect(html).toContain('print-sheet');
    expect(html).toContain('two oscillators share energy');
    expect(html).toContain('Why beating?');
    expect(html).toContain('handwritten why');
    expect(html).toContain('(ink)');
    expect(html).toContain('(AI)');
    expect(html).toContain('data-voice="ink"');
    expect(html).toContain('data-voice="ai"');
    expect(html).toContain('<span class="marks">?</span>');
    expect(html).not.toContain('<span class="marks">*</span>');
    expect(html).not.toContain('Continuation');
    expect(html).not.toContain('<time');
    expect(html).toContain('class="trail-strip"');
  });

  it('uses an iframe print path, never a popup, and never confirms marks from the sheet', () => {
    expect(printPathUsesPopup(src)).toBe(false);
    expect(printPathUsesIframe(src)).toBe(true);
    expect(printPathUsesPopup(previewSrc)).toBe(false);
    expect(printPathUsesIframe(previewSrc)).toBe(true);
    expect(src).toContain('printIframe');
    expect(src).not.toContain('confirm-mark');
    expect(src).not.toContain('dismiss-mark');
  });
});
