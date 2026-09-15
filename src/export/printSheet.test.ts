import { describe, expect, it } from 'vitest';
import { deskReducer, initialDeskState } from '../engine/deskState.ts';
import { makeNote, makePdfPage } from '../engine/selectors.ts';
import { buildPrintableHtml } from './printSheet.ts';

describe('buildPrintableHtml', () => {
  it('prints a review packet with source excerpt, handwritten margin, trail, and confirmed marks only', () => {
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

    const html = buildPrintableHtml(state);
    expect(html).toContain('review-packet');
    expect(html).toContain('Review packet');
    expect(html).toContain('Coupled notes');
    expect(html).toContain('Printed evidence');
    expect(html).toContain('Handwritten margin');
    expect(html).toContain('two oscillators share energy');
    expect(html).toContain('Why beating?');
    expect(html).toContain('handwritten why');
    expect(html).toContain('Continuation');
    expect(html).toContain('Box the envelope');
    expect(html).toContain('Thinking trail');
    expect(html).toContain('First note');
    expect(html).toContain('(ink)');
    expect(html).toContain('(AI)');
    expect(html).toContain('<span class="marks">?</span>');
    expect(html).not.toContain('<span class="marks">*</span>');
    expect(html).toContain('font-style: italic');
    expect(html).toContain('Segoe Script');
    expect(html).toContain('@media print');
    expect(html).toContain('wordmark');
  });
});
