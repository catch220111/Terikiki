import { describe, expect, it } from 'vitest';
import { deskReducer, initialDeskState } from '../engine/deskState.ts';
import { makeNote, makePdfPage } from '../engine/selectors.ts';
import { buildPrintableHtml } from './printSheet.ts';

describe('buildPrintableHtml', () => {
  it('includes pages, anchored handwriting, trail, and confirmed marks', () => {
    let state = deskReducer(initialDeskState, {
      type: 'hydrate-document',
      document: { id: 'doc', title: 'Coupled notes', sourceUrl: '/x.pdf', pageCount: 1 },
      pages: [makePdfPage({ documentId: 'doc', pageIndex: 0, title: 'Setup', excerpt: 'two oscillators' })],
    });
    const note = makeNote({
      title: 'Why beating?',
      caption: 'handwritten why',
      filename: 'n.svg',
      imageUrl: '',
    });
    state = deskReducer(state, { type: 'import-note', note });
    state = deskReducer(state, {
      type: 'commit-anchor',
      cardId: note.id,
      target: { kind: 'page', documentId: 'doc', pageIndex: 0 },
      source: 'manual',
    });
    state = deskReducer(state, {
      type: 'propose-marks',
      marks: [{ id: 'm1', noteId: note.id, kind: 'question', glyph: '?', status: 'detected', rationale: 'x' }],
    });
    state = deskReducer(state, { type: 'confirm-mark', markId: 'm1' });

    const html = buildPrintableHtml(state);
    expect(html).toContain('Coupled notes');
    expect(html).toContain('Why beating?');
    expect(html).toContain('Thinking trail');
    expect(html).toContain('first_note');
    expect(html).toContain('?');
  });
});
