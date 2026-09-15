/** Matrix-first domain types. Handwriting is the primary intellectual artifact. */

export type LayerOrigin = 'student' | 'ai' | 'system';

export type LayerType = 'pdf' | 'handwriting' | 'transcription' | 'questions' | 'ai' | 'student';

export type CardKind = 'pdf-page' | 'note' | 'ai';

export type MatrixOrientation = 'vertical' | 'horizontal';

export type AnchorSource = 'manual' | 'accepted-match' | 'corrected-match';

export type MatchDecision = 'accepted' | 'rejected' | 'corrected';

export type TrailEventKind =
  | 'first_note'
  | 'question'
  | 'pdf_evidence'
  | 'correction'
  | 'ai_explanation'
  | 'latest_understanding';

export type CommandMarkKind = 'question' | 'star' | 'box' | 'circle' | 'arrow' | 'recall' | 'explain';

export type CommandMarkStatus = 'detected' | 'confirmed' | 'dismissed';

export type MatchSuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'corrected';

export interface NormalizedRect {
  /** 0–1, origin top-left of the page. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export type AnchorTarget =
  | { kind: 'page'; documentId: string; pageIndex: number }
  | { kind: 'region'; documentId: string; pageIndex: number; rect: NormalizedRect };

export interface LayerId {
  origin: LayerOrigin;
  type: LayerType;
}

export interface LayerVisibility {
  /** Keyed as `${origin}:${type}` */
  [layerKey: string]: boolean;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface SelectionSet {
  cardIds: readonly string[];
}

export interface PdfPageCard {
  id: string;
  kind: 'pdf-page';
  origin: 'system';
  type: 'pdf';
  documentId: string;
  pageIndex: number;
  axisIndex: number;
  title: string;
  excerpt: string;
  imageUrl?: string;
}

export interface NoteCard {
  id: string;
  kind: 'note';
  origin: 'student';
  type: 'handwriting';
  title: string;
  caption: string;
  filename: string;
  imageUrl: string;
  /** Stub detector hints planted on demo notes; never treated as committed marks. */
  inkHints: readonly string[];
  createdAt: string;
}

export interface AiCard {
  id: string;
  kind: 'ai';
  origin: 'ai';
  type: 'ai';
  title: string;
  body: string;
  citationCardIds: readonly string[];
  createdAt: string;
}

export type MatrixCard = PdfPageCard | NoteCard | AiCard;

export interface Anchor {
  id: string;
  /** Card hanging off the PDF page/region (note or pinned AI). */
  cardId: string;
  target: AnchorTarget;
  source: AnchorSource;
}

export interface MatchSuggestion {
  id: string;
  noteId: string;
  target: AnchorTarget;
  confidence: number;
  rationale: string;
  status: MatchSuggestionStatus;
}

export interface ThinkingTrailEvent {
  id: string;
  cardId: string;
  at: string;
  kind: TrailEventKind;
  layerOrigin: LayerOrigin;
  layerType: LayerType;
  summary: string;
  fromAi: boolean;
}

export interface CommandMark {
  id: string;
  noteId: string;
  kind: CommandMarkKind;
  glyph: string;
  status: CommandMarkStatus;
  rationale: string;
}

export interface AiCitation {
  cardId: string;
  quote: string;
}

export interface AiTurn {
  id: string;
  prompt: string;
  selectionCardIds: readonly string[];
  answer: string;
  citations: readonly AiCitation[];
  at: string;
}

export interface StudyDocument {
  id: string;
  title: string;
  sourceUrl: string;
  pageCount: number;
}

export interface AnchorDraft {
  noteId: string;
  mode: 'page' | 'region';
  pageIndex?: number;
  /** When set, the next pin is a correction of this pending suggestion. */
  suggestionId?: string;
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

export const COMMAND_MARK_GLYPH: Record<CommandMarkKind, string> = {
  question: '?',
  star: '*',
  box: 'box',
  circle: 'circle',
  arrow: 'arrow',
  recall: 'R',
  explain: 'EXPLAIN',
};

export const LAYER_TOGGLE_SPEC: readonly {
  origin: LayerOrigin;
  type: LayerType;
  label: string;
}[] = [
  { origin: 'system', type: 'pdf', label: 'PDF' },
  { origin: 'student', type: 'handwriting', label: 'Handwriting' },
  { origin: 'student', type: 'transcription', label: 'Transcription' },
  { origin: 'student', type: 'questions', label: 'Questions' },
  { origin: 'ai', type: 'ai', label: 'AI' },
];

export function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${String(value)}`);
}

export function cardLayer(card: MatrixCard): LayerId {
  switch (card.kind) {
    case 'pdf-page':
      return { origin: 'system', type: 'pdf' };
    case 'note':
      return { origin: 'student', type: 'handwriting' };
    case 'ai':
      return { origin: 'ai', type: 'ai' };
    default:
      return assertNever(card, 'Unhandled card kind');
  }
}

export function isLayerVisible(layers: LayerVisibility, origin: LayerOrigin, type: LayerType): boolean {
  return layers[layerKey(origin, type)] !== false;
}

export function clampRect(rect: NormalizedRect): NormalizedRect {
  const x = Math.min(1, Math.max(0, rect.x));
  const y = Math.min(1, Math.max(0, rect.y));
  const w = Math.min(1 - x, Math.max(0.02, rect.w));
  const h = Math.min(1 - y, Math.max(0.02, rect.h));
  return { x, y, w, h };
}
