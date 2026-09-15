/** Matrix-first domain types. Handwriting is the primary intellectual artifact. */

export type LayerOrigin = 'student' | 'ai' | 'system';

export type LayerType = 'pdf' | 'handwriting' | 'transcription' | 'questions' | 'ai' | 'student';

export type CardKind = 'pdf-page' | 'note' | 'ai';

/** Visual jump target for an Ask citation. Regions are pins, not cards. */
export type CitationKind = CardKind | 'region';

export type MatrixOrientation = 'vertical' | 'horizontal';

/** How an anchor entered the graph. Pending suggestions are not a source. */
export type AnchorSource = 'manual' | 'accepted-match' | 'corrected-match';

/** Student decision on a stub guess. Reject is not a commit path. */
export type MatchDecision = 'accepted' | 'rejected' | 'corrected';

/** Decisions that may write an anchor. */
export type MatchCommitDecision = Exclude<MatchDecision, 'rejected'>;

/** Explicit paths onto the anchor graph. */
export type AnchorCommitPath = 'accept' | 'correct' | 'manual';

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

interface AnchorBase {
  id: string;
  /** Card hanging off the PDF page/region (note or pinned AI). */
  cardId: string;
  target: AnchorTarget;
}

/** Committed pin. Pending match suggestions never inhabit this shape. */
export type Anchor =
  | (AnchorBase & { source: 'manual' })
  | (AnchorBase & { source: 'accepted-match'; suggestionId: string })
  | (AnchorBase & { source: 'corrected-match'; suggestionId: string });

interface MatchSuggestionBase {
  id: string;
  noteId: string;
  target: AnchorTarget;
  confidence: number;
  rationale: string;
}

/** Matcher output. Must not be copied into the anchor graph. */
export interface PendingMatchSuggestion extends MatchSuggestionBase {
  status: 'pending';
}

export interface AcceptedMatchSuggestion extends MatchSuggestionBase {
  status: 'accepted';
}

export interface RejectedMatchSuggestion extends MatchSuggestionBase {
  status: 'rejected';
}

export interface CorrectedMatchSuggestion extends MatchSuggestionBase {
  status: 'corrected';
}

export type MatchSuggestion =
  | PendingMatchSuggestion
  | AcceptedMatchSuggestion
  | RejectedMatchSuggestion
  | CorrectedMatchSuggestion;

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
  /** Selected card this citation is allowed to rest on. */
  cardId: string;
  quote: string;
  kind: CitationKind;
  /** Stamp label in the Ask tray, e.g. "PDF p2 · Energy sloshing". */
  label: string;
  pageIndex?: number;
  region?: NormalizedRect;
  /** Matrix card the camera should jump to (page for a region pin). */
  revealCardId: string;
  /** Region pin to highlight when this citation is a region. */
  anchorId?: string;
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

/** Student-facing meaning. Confirming records the mark; it never silent-fires the implied action. */
export const COMMAND_MARK_MEANING: Record<CommandMarkKind, string> = {
  question: 'Unresolved question',
  star: 'Important',
  box: 'Box → study card',
  circle: 'Circle → verify equation',
  arrow: 'Arrow → relationship / anchor',
  recall: 'Review',
  explain: 'Request explanation',
};

export const COMMAND_MARK_IF_CONFIRMED: Record<CommandMarkKind, string> = {
  question: 'Stay an open question — Ask does not fire.',
  star: 'Flag as important — nothing else is created.',
  box: 'Remember as a study-card mark — no card is minted.',
  circle: 'Mark to verify — no solver runs.',
  arrow: 'Propose a relationship — no pin is written.',
  recall: 'Mark for review — this is not a revision history.',
  explain: 'Record the request — the tutor stays quiet until you Ask.',
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

export function isPendingSuggestion(
  suggestion: MatchSuggestion,
): suggestion is PendingMatchSuggestion {
  return suggestion.status === 'pending';
}

export function matchSuggestionId(anchor: Anchor): string | undefined {
  switch (anchor.source) {
    case 'manual':
      return undefined;
    case 'accepted-match':
    case 'corrected-match':
      return anchor.suggestionId;
    default: {
      const _never: never = anchor;
      return _never;
    }
  }
}

export function citationKindVoice(kind: CitationKind): string {
  switch (kind) {
    case 'pdf-page':
      return 'Printed page';
    case 'note':
      return 'Handwriting';
    case 'ai':
      return 'AI card';
    case 'region':
      return 'Pinned region';
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

export function sourceForCommitPath(path: AnchorCommitPath): AnchorSource {
  switch (path) {
    case 'accept':
      return 'accepted-match';
    case 'correct':
      return 'corrected-match';
    case 'manual':
      return 'manual';
    default: {
      const _never: never = path;
      return _never;
    }
  }
}

export function clampRect(rect: NormalizedRect): NormalizedRect {
  const x = Math.min(1, Math.max(0, rect.x));
  const y = Math.min(1, Math.max(0, rect.y));
  const w = Math.min(1 - x, Math.max(0.02, rect.w));
  const h = Math.min(1 - y, Math.max(0.02, rect.h));
  return { x, y, w, h };
}
