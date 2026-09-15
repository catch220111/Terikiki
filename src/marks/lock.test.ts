import { describe, expect, it } from 'vitest';
import { detectMarks } from './detectMarks.ts';
import { canTransitionMark, confirmedMarks, detectedOnly, detectorSilentConfirmed, silentFireOnConfirm } from './lock.ts';
import { deskReducer, initialDeskState } from '../engine/deskState.ts';
import { makeNote, makePdfPage } from '../engine/selectors.ts';
import { COMMAND_MARK_GLYPH, COMMAND_MARK_MEANING, type CommandMark } from '../types/domain.ts';

function hydrated() {
  return deskReducer(initialDeskState, {
    type: 'hydrate-document',
    document: { id: 'doc', title: 'Lecture', sourceUrl: '/x.pdf', pageCount: 1 },
    pages: [makePdfPage({ documentId: 'doc', pageIndex: 0, title: 'Setup', excerpt: 'oscillator' })],
  });
}

function proposal(noteId: string, overrides: Partial<CommandMark> = {}): CommandMark {
  return {
    id: 'mark_1',
    noteId,
    kind: 'explain',
    glyph: COMMAND_MARK_GLYPH.explain,
    status: 'detected',
    rationale: 'EXPLAIN in the ink',
    ...overrides,
  };
}

describe('Stage 4 command-mark lock', () => {
  it('keeps detector output as proposals until confirm or dismiss', () => {
    expect(canTransitionMark('detected', 'confirmed')).toBe(true);
    expect(canTransitionMark('detected', 'dismissed')).toBe(true);
    expect(canTransitionMark('confirmed', 'dismissed')).toBe(false);
    expect(canTransitionMark('dismissed', 'confirmed')).toBe(false);

    let state = hydrated();
    const note = makeNote({
      title: 'Box the envelope',
      caption: 'box EXPLAIN',
      filename: 'n.svg',
      imageUrl: '',
      inkHints: ['?', 'box', 'EXPLAIN'],
    });
    state = deskReducer(state, { type: 'import-note', note });
    const found = detectMarks(note);
    expect(detectorSilentConfirmed(found)).toEqual([]);
    expect(found.every((mark) => mark.status === 'detected')).toBe(true);
    state = deskReducer(state, { type: 'propose-marks', marks: found });
    expect(detectedOnly(state.marks)).toHaveLength(found.length);
    expect(confirmedMarks(state.marks)).toHaveLength(0);

    const before = {
      anchors: state.anchors,
      aiTurns: state.aiTurns,
      askOpen: state.askOpen,
      aiCardCount: state.aiCards.length,
    };
    const explain = state.marks.find((mark) => mark.kind === 'explain');
    expect(explain).toBeDefined();
    state = deskReducer(state, { type: 'confirm-mark', markId: explain!.id });
    expect(state.marks.find((mark) => mark.id === explain!.id)?.status).toBe('confirmed');
    expect(
      silentFireOnConfirm(before, {
        anchors: state.anchors,
        aiTurns: state.aiTurns,
        askOpen: state.askOpen,
        aiCardCount: state.aiCards.length,
      }),
    ).toEqual([]);
    expect(COMMAND_MARK_MEANING.explain).toMatch(/explanation/i);
  });

  it('does not confirm a mark by proposing it, and does not dismiss a confirmed mark', () => {
    let state = hydrated();
    const note = makeNote({
      title: 'Why beating?',
      caption: 'why',
      filename: 'n.svg',
      imageUrl: '',
    });
    state = deskReducer(state, { type: 'import-note', note });
    state = deskReducer(state, {
      type: 'propose-marks',
      marks: [proposal(note.id, { status: 'confirmed' })],
    });
    expect(state.marks).toHaveLength(0);

    state = deskReducer(state, { type: 'propose-marks', marks: [proposal(note.id)] });
    state = deskReducer(state, { type: 'confirm-mark', markId: 'mark_1' });
    const afterConfirm = state;
    state = deskReducer(state, { type: 'dismiss-mark', markId: 'mark_1' });
    expect(state.marks[0]?.status).toBe('confirmed');
    expect(state.anchors).toEqual(afterConfirm.anchors);
    expect(state.aiTurns).toEqual(afterConfirm.aiTurns);
    expect(state.aiCards).toEqual(afterConfirm.aiCards);
    expect(state.askOpen).toBe(false);
  });

  it('confirming box / arrow / EXPLAIN never writes anchors or Ask', () => {
    let state = hydrated();
    const note = makeNote({
      title: 'Box the envelope',
      caption: 'box arrow EXPLAIN',
      filename: 'n.svg',
      imageUrl: '',
    });
    state = deskReducer(state, { type: 'import-note', note });
    state = deskReducer(state, {
      type: 'propose-marks',
      marks: [
        proposal(note.id, { id: 'm_box', kind: 'box', glyph: 'box' }),
        proposal(note.id, { id: 'm_arrow', kind: 'arrow', glyph: 'arrow' }),
        proposal(note.id, { id: 'm_explain', kind: 'explain', glyph: 'EXPLAIN' }),
      ],
    });
    const before = {
      anchors: state.anchors,
      aiTurns: state.aiTurns,
      askOpen: state.askOpen,
      aiCardCount: state.aiCards.length,
    };
    state = deskReducer(state, { type: 'confirm-mark', markId: 'm_box' });
    state = deskReducer(state, { type: 'confirm-mark', markId: 'm_arrow' });
    state = deskReducer(state, { type: 'confirm-mark', markId: 'm_explain' });
    expect(state.marks.filter((m) => m.status === 'confirmed')).toHaveLength(3);
    expect(
      silentFireOnConfirm(before, {
        anchors: state.anchors,
        aiTurns: state.aiTurns,
        askOpen: state.askOpen,
        aiCardCount: state.aiCards.length,
      }),
    ).toEqual([]);
  });
});
