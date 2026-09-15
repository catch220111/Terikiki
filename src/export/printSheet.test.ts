import { describe, expect, it } from 'vitest';
import { deskReducer, initialDeskState } from '../engine/deskState.ts';
import { makeNote, makePdfPage } from '../engine/selectors.ts';
import { buildPrintableHtml } from './printSheet.ts';

describe('buildPrintableHtml', () => {
  it('includes source excerpt, handwritten margin, trail, and confirmed marks only', () => {
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
    state = deskReducer(state, { type: 'import-note', note });
    state = deskReducer(state, {
      type: 'commit-manual-anchor',
      cardId: note.id,
      target: { kind: 'page', documentId: 'doc', pageIndex: 0 },
    });
    state = deskReducer(state, {
      type: 'propose-marks',
      marks: [{ id: 'm1', noteId: note.id, kind: 'question', glyph: '?', status: 'detected', rationale: 'x' }],
    });
    state = deskReducer(state, { type: 'confirm-mark', markId: 'm1' });

    const html = buildPrintableHtml(state);
    expect(html).toContain('Print sheet');
    expect(html).toContain('Printed evidence');
    expect(html).toContain('Handwritten margin');
    expect(html).toContain('two oscillators share energy');
    expect(html).toContain('Why beating?');
    expect(html).toContain('(ink)');
    expect(html).toContain('class="trail-strip"');
    expect(html).toContain('First note');
    expect(html).toContain('<span class="marks">?</span>');
    expect(html).not.toContain('<time');
  });
});
