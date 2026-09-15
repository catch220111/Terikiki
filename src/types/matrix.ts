/** Stage 1 matrix domain types — locked to UI/UX card/layer ids. */

export type LayerOrigin = 'student' | 'ai' | 'system';

export type LayerType =
  | 'pdf'
  | 'handwriting'
  | 'transcription'
  | 'questions'
  | 'ai'
  | 'student';

export type MaterialKind = 'handwriting' | 'transcription' | 'questions' | 'ai';

export interface LayerId {
  origin: LayerOrigin;
  type: LayerType;
}

export interface PdfPageCard {
  id: string;
  documentId: string;
  pageIndex: number;
  /** Primary-axis position in the matrix (page order). */
  axisIndex: number;
}

export interface MaterialStub {
  id: string;
  kind: MaterialKind;
  /** Pdf page (or other card) this stub hangs off. */
  parentCardId: string;
  /** Perpendicular-axis slot; stubs may be empty in Stage 1. */
  slotIndex: number;
  empty: boolean;
}

export interface SelectionSet {
  cardIds: readonly string[];
}

export type MatrixOrientation = 'vertical' | 'horizontal';

export interface LayerVisibility {
  /** Keyed as `${origin}:${type}` */
  [layerKey: string]: boolean;
}

export function layerKey(origin: LayerOrigin, type: LayerType): string {
  return `${origin}:${type}`;
}

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  [layerKey('system', 'pdf')]: true,
  [layerKey('student', 'handwriting')]: true,
  [layerKey('student', 'transcription')]: true,
  [layerKey('student', 'questions')]: true,
  [layerKey('student', 'student')]: true,
  [layerKey('ai', 'ai')]: true,
};
