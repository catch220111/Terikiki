import { describe, expect, it } from 'vitest';
import { deskReducer, initialDeskState } from '../engine/deskState.ts';
import { makeNote, makePdfPage } from '../engine/selectors.ts';
import { orderedTrail, trailKindLabel, trailVoice } from './events.ts';
import {
  mislabeledStudentBeats,
  trailCardIds,
  trailIsKeyedToCards,
  trailKindSequence,
  trailVoiceViolations,
  unlabeledAiBeats,
} from './lock.ts';
import type { ThinkingTrailEvent } from '../types/domain.ts';

function page(index: number) {
  return makePdfPage({
    documentId: 'doc',
    pageIndex: index,
    title: `Page ${index + 1}`,
    excerpt: 'oscillator beating envelope',
  });
}

function hydrated() {
  return deskReducer(initialDeskState, {
    type: 'hydrate-document',
    document: { id: 'doc', title: 'Lecture', sourceUrl: '/x.pdf', pageCount: 2 },
    pages: [page(0), page(1)],
  });
}

describe('Stage 4 thinking trail', () => {
  it('stays append-only and keyed to card ids in thinking order', () => {
    let state = hydrated();
    const note = makeNote({
      title: 'Why beating?',
      caption: 'why beating',
      filename: 'n.svg',
      imageUrl: '',
    });
    const pageId = state.pages[0]!.id;

    state = deskReducer(state, { type: 'import-note', note });
    state = deskReducer(state, {
      type: 'commit-manual-anchor',
      cardId: note.id,
      target: { kind: 'page', documentId: 'doc', pageIndex: 0 },
    });
    state = deskReducer(state, {
      type: 'propose-marks',
      marks: [
        {
          id: 'mark_q',
          noteId: note.id,
          kind: 'question',
          glyph: '?',
          status: 'detected',
          rationale: 'why',
        },
      ],
    });
    state = deskReducer(state, { type: 'confirm-mark', markId: 'mark_q' });
    state = deskReducer(state, { type: 'select-card', cardId: pageId, additive: false });
    state = deskReducer(state, {
      type: 'add-ai-turn',
      turn: {
        id: 'turn_1',
        prompt: 'explain',
        selectionCardIds: [pageId],
        answer: 'from the gathering',
        citations: [],
        at: '2026-09-15T00:00:02.000Z',
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
        citationCardIds: [pageId],
        createdAt: '2026-09-15T00:00:03.000Z',
      },
    });

    const trail = orderedTrail(state.trail);
    expect(trailKindSequence(trail)).toEqual([
      'first_note',
      'pdf_evidence',
      'question',
      'ai_explanation',
      'latest_understanding',
    ]);
    expect(trailIsKeyedToCards(trail)).toBe(true);
    expect(trailCardIds(trail)).toEqual([note.id, note.id, note.id, pageId, 'ai_1']);
    expect(trailVoiceViolations(trail)).toEqual([]);
    expect(trail.filter((event) => event.fromAi).every((event) => trailVoice(event.fromAi) === 'ai')).toBe(
      true,
    );
    expect(trail.filter((event) => !event.fromAi).every((event) => trailVoice(event.fromAi) === 'ink')).toBe(
      true,
    );
    expect(trailKindLabel('pdf_evidence')).toBe('PDF evidence');
    expect(orderedTrail(trail).map((event) => event.id)).toEqual(trail.map((event) => event.id));
  });

  it('labels AI beats separately from student ink', () => {
    const mixed: ThinkingTrailEvent[] = [
      {
        id: 't1',
        cardId: 'note_1',
        at: '2026-09-15T00:00:00.000Z',
        kind: 'first_note',
        layerOrigin: 'student',
        layerType: 'handwriting',
        summary: 'ink',
        fromAi: false,
      },
      {
        id: 't2',
        cardId: 'page_1',
        at: '2026-09-15T00:00:01.000Z',
        kind: 'ai_explanation',
        layerOrigin: 'ai',
        layerType: 'ai',
        summary: 'tutor',
        fromAi: true,
      },
    ];
    expect(trailVoiceViolations(mixed)).toEqual([]);
    expect(unlabeledAiBeats(mixed)).toEqual([]);
    expect(mislabeledStudentBeats(mixed)).toEqual([]);
  });
});
