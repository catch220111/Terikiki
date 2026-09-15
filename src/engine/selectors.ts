import type { AiCard, MatrixCard, NoteCard, PdfPageCard } from '../types/domain.ts';
import { cardLayer, isLayerVisible } from '../types/domain.ts';
import { createId, nowIso } from './ids.ts';
import type { DeskState } from './deskState.ts';

export function allCards(state: DeskState): MatrixCard[] {
  return [...state.pages, ...state.notes, ...state.aiCards];
}

export function cardById(state: DeskState, id: string): MatrixCard | undefined {
  return allCards(state).find((card) => card.id === id);
}

export function labelForCard(card: MatrixCard): string {
  switch (card.kind) {
    case 'pdf-page':
      return `PDF p${card.pageIndex + 1}`;
    case 'note':
      return card.title;
    case 'ai':
      return card.title;
    default: {
      const _never: never = card;
      return _never;
    }
  }
}

export function selectedCards(state: DeskState): MatrixCard[] {
  return state.selection.cardIds
    .map((id) => cardById(state, id))
    .filter((card): card is MatrixCard => card !== undefined);
}

export function pendingSuggestionsFor(state: DeskState, noteId: string) {
  return state.suggestions.filter((s) => s.noteId === noteId && s.status === 'pending');
}

export function confirmedMarksFor(state: DeskState, noteId: string) {
  return state.marks.filter((m) => m.noteId === noteId && m.status === 'confirmed');
}

export function detectedMarks(state: DeskState) {
  return state.marks.filter((m) => m.status === 'detected');
}

export function anchorsForCard(state: DeskState, cardId: string) {
  return state.anchors.filter((a) => a.cardId === cardId);
}

export function cardsAnchoredToPage(state: DeskState, pageIndex: number): MatrixCard[] {
  const ids = new Set(
    state.anchors.filter((a) => a.target.pageIndex === pageIndex).map((a) => a.cardId),
  );
  return allCards(state).filter((card) => ids.has(card.id));
}

export function looseCards(state: DeskState): Array<NoteCard | AiCard> {
  const anchored = new Set(state.anchors.map((a) => a.cardId));
  return [...state.notes, ...state.aiCards].filter((card) => !anchored.has(card.id));
}

export function isCardVisible(state: DeskState, card: MatrixCard): boolean {
  const layer = cardLayer(card);
  return isLayerVisible(state.layers, layer.origin, layer.type);
}

export function makeNote(input: {
  title: string;
  caption: string;
  filename: string;
  imageUrl: string;
  inkHints?: readonly string[];
}): NoteCard {
  return {
    id: createId('note'),
    kind: 'note',
    origin: 'student',
    type: 'handwriting',
    title: input.title,
    caption: input.caption,
    filename: input.filename,
    imageUrl: input.imageUrl,
    inkHints: input.inkHints ?? [],
    createdAt: nowIso(),
  };
}

export function makePdfPage(input: {
  documentId: string;
  pageIndex: number;
  title: string;
  excerpt: string;
}): PdfPageCard {
  return {
    id: `${input.documentId}:p${input.pageIndex}`,
    kind: 'pdf-page',
    origin: 'system',
    type: 'pdf',
    documentId: input.documentId,
    pageIndex: input.pageIndex,
    axisIndex: input.pageIndex,
    title: input.title,
    excerpt: input.excerpt,
  };
}
