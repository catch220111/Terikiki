import {
  assertNever,
  type AiCard,
  type AiTurn,
  type Anchor,
  type AnchorDraft,
  type AnchorTarget,
  type Camera,
  type CommandMark,
  type LayerVisibility,
  type MatchSuggestion,
  type MatrixOrientation,
  type NoteCard,
  type PdfPageCard,
  type SelectionSet,
  type StudyDocument,
  type ThinkingTrailEvent,
  DEFAULT_LAYER_VISIBILITY,
} from '../types/domain.ts';
import { createId, nowIso } from './ids.ts';

export interface DeskState {
  document: StudyDocument | null;
  pages: PdfPageCard[];
  notes: NoteCard[];
  aiCards: AiCard[];
  anchors: Anchor[];
  suggestions: MatchSuggestion[];
  selection: SelectionSet;
  layers: LayerVisibility;
  orientation: MatrixOrientation;
  camera: Camera;
  trail: ThinkingTrailEvent[];
  marks: CommandMark[];
  aiTurns: AiTurn[];
  hoverCardId: string | null;
  focusCardId: string | null;
  revealNonce: number;
  askOpen: boolean;
  anchorDraft: AnchorDraft | null;
}

export const initialDeskState: DeskState = {
  document: null,
  pages: [],
  notes: [],
  aiCards: [],
  anchors: [],
  suggestions: [],
  selection: { cardIds: [] },
  layers: { ...DEFAULT_LAYER_VISIBILITY },
  orientation: 'vertical',
  camera: { x: 28, y: 18, zoom: 0.84 },
  trail: [],
  marks: [],
  aiTurns: [],
  hoverCardId: null,
  focusCardId: null,
  revealNonce: 0,
  askOpen: true,
  anchorDraft: null,
};

export type DeskAction =
  | { type: 'hydrate-document'; document: StudyDocument; pages: PdfPageCard[] }
  | { type: 'patch-page-image'; pageId: string; imageUrl: string; excerpt?: string; title?: string }
  | { type: 'set-orientation'; orientation: MatrixOrientation }
  | { type: 'set-camera'; camera: Camera }
  | { type: 'nudge-camera'; dx: number; dy: number }
  | { type: 'set-zoom'; zoom: number }
  | { type: 'toggle-layer'; key: string }
  | { type: 'select-card'; cardId: string; additive: boolean }
  | { type: 'clear-selection' }
  | { type: 'remove-from-selection'; cardId: string }
  | { type: 'set-hover'; cardId: string | null }
  | { type: 'focus-card'; cardId: string | null }
  | { type: 'import-note'; note: NoteCard }
  | { type: 'begin-anchor'; noteId: string; mode: 'page' | 'region'; suggestionId?: string }
  | { type: 'set-anchor-page'; pageIndex: number }
  | { type: 'cancel-anchor' }
  | { type: 'commit-anchor'; cardId: string; target: AnchorTarget; source: Anchor['source'] }
  | { type: 'propose-matches'; suggestions: MatchSuggestion[] }
  | { type: 'accept-match'; suggestionId: string }
  | { type: 'reject-match'; suggestionId: string }
  | { type: 'correct-match'; suggestionId: string; target: AnchorTarget }
  | { type: 'append-trail'; event: Omit<ThinkingTrailEvent, 'id'> }
  | { type: 'propose-marks'; marks: CommandMark[] }
  | { type: 'confirm-mark'; markId: string }
  | { type: 'dismiss-mark'; markId: string }
  | { type: 'add-ai-turn'; turn: AiTurn }
  | { type: 'pin-ai-card'; card: AiCard; attachToPageIndex?: number }
  | { type: 'open-ask'; open: boolean };

function toggleSelection(current: readonly string[], cardId: string, additive: boolean): string[] {
  if (additive) {
    return current.includes(cardId) ? current.filter((id) => id !== cardId) : [...current, cardId];
  }
  if (current.length === 1 && current[0] === cardId) return [];
  return [cardId];
}

function trailEvent(partial: Omit<ThinkingTrailEvent, 'id'>): ThinkingTrailEvent {
  return { ...partial, id: createId('trail') };
}

function makeAnchor(cardId: string, target: AnchorTarget, source: Anchor['source']): Anchor {
  return { id: createId('anchor'), cardId, target, source };
}

function cardTitle(state: DeskState, cardId: string): string {
  const note = state.notes.find((n) => n.id === cardId);
  if (note) return note.title;
  const ai = state.aiCards.find((c) => c.id === cardId);
  if (ai) return ai.title;
  const page = state.pages.find((p) => p.id === cardId);
  if (page) return page.title;
  return 'Card';
}

export function deskReducer(state: DeskState, action: DeskAction): DeskState {
  switch (action.type) {
    case 'hydrate-document':
      return {
        ...state,
        document: action.document,
        pages: action.pages,
        anchors: [],
        selection: { cardIds: [] },
        anchorDraft: null,
        focusCardId: null,
      };
    case 'patch-page-image':
      return {
        ...state,
        pages: state.pages.map((page) =>
          page.id === action.pageId
            ? {
                ...page,
                imageUrl: action.imageUrl,
                excerpt: action.excerpt ?? page.excerpt,
                title: action.title ?? page.title,
              }
            : page,
        ),
      };
    case 'set-orientation':
      return { ...state, orientation: action.orientation };
    case 'set-camera':
      return { ...state, camera: action.camera };
    case 'nudge-camera':
      return {
        ...state,
        camera: { ...state.camera, x: state.camera.x + action.dx, y: state.camera.y + action.dy },
      };
    case 'set-zoom':
      return {
        ...state,
        camera: { ...state.camera, zoom: Math.min(2.6, Math.max(0.35, action.zoom)) },
      };
    case 'toggle-layer':
      return {
        ...state,
        layers: { ...state.layers, [action.key]: state.layers[action.key] === false ? true : false },
      };
    case 'select-card':
      return {
        ...state,
        selection: { cardIds: toggleSelection(state.selection.cardIds, action.cardId, action.additive) },
        focusCardId: action.cardId,
      };
    case 'clear-selection':
      return { ...state, selection: { cardIds: [] } };
    case 'remove-from-selection':
      return {
        ...state,
        selection: { cardIds: state.selection.cardIds.filter((id) => id !== action.cardId) },
      };
    case 'set-hover':
      return { ...state, hoverCardId: action.cardId };
    case 'focus-card':
      return {
        ...state,
        focusCardId: action.cardId,
        revealNonce: action.cardId ? state.revealNonce + 1 : state.revealNonce,
        selection:
          action.cardId && !state.selection.cardIds.includes(action.cardId)
            ? { cardIds: [...state.selection.cardIds, action.cardId] }
            : state.selection,
      };
    case 'import-note': {
      const isFirst = state.notes.length === 0;
      const next: DeskState = { ...state, notes: [...state.notes, action.note] };
      if (!isFirst) return next;
      return {
        ...next,
        trail: [
          ...next.trail,
          trailEvent({
            cardId: action.note.id,
            at: action.note.createdAt,
            kind: 'first_note',
            layerOrigin: 'student',
            layerType: 'handwriting',
            summary: `First handwriting on the desk: ${action.note.title}`,
            fromAi: false,
          }),
        ],
      };
    }
    case 'begin-anchor':
      return {
        ...state,
        anchorDraft: { noteId: action.noteId, mode: action.mode, suggestionId: action.suggestionId },
      };
    case 'set-anchor-page': {
      if (!state.anchorDraft) return state;
      if (state.anchorDraft.mode === 'page' && state.document) {
        const target = {
          kind: 'page' as const,
          documentId: state.document.id,
          pageIndex: action.pageIndex,
        };
        if (state.anchorDraft.suggestionId) {
          return deskReducer(state, {
            type: 'correct-match',
            suggestionId: state.anchorDraft.suggestionId,
            target,
          });
        }
        return deskReducer(state, {
          type: 'commit-anchor',
          cardId: state.anchorDraft.noteId,
          target,
          source: 'manual',
        });
      }
      return { ...state, anchorDraft: { ...state.anchorDraft, pageIndex: action.pageIndex } };
    }
    case 'cancel-anchor':
      return { ...state, anchorDraft: null };
    case 'commit-anchor': {
      const anchor = makeAnchor(action.cardId, action.target, action.source);
      const pageCard = state.pages.find((p) => p.pageIndex === action.target.pageIndex);
      const evidence =
        action.target.kind === 'region'
          ? `region on p${action.target.pageIndex + 1}`
          : `page ${action.target.pageIndex + 1}`;
      const kind = action.source === 'corrected-match' ? 'correction' : 'pdf_evidence';
      return {
        ...state,
        anchors: [...state.anchors, anchor],
        anchorDraft: null,
        trail: [
          ...state.trail,
          trailEvent({
            cardId: action.cardId,
            at: nowIso(),
            kind,
            layerOrigin: 'student',
            layerType: 'handwriting',
            summary: `${cardTitle(state, action.cardId)} pinned to ${evidence}${pageCard ? ` (${pageCard.title})` : ''}`,
            fromAi: false,
          }),
        ],
      };
    }
    case 'propose-matches':
      return { ...state, suggestions: [...state.suggestions, ...action.suggestions] };
    case 'accept-match': {
      const suggestion = state.suggestions.find((s) => s.id === action.suggestionId);
      if (!suggestion || suggestion.status !== 'pending') return state;
      return deskReducer(
        {
          ...state,
          suggestions: state.suggestions.map((s) =>
            s.id === action.suggestionId ? { ...s, status: 'accepted' } : s,
          ),
        },
        {
          type: 'commit-anchor',
          cardId: suggestion.noteId,
          target: suggestion.target,
          source: 'accepted-match',
        },
      );
    }
    case 'reject-match':
      return {
        ...state,
        suggestions: state.suggestions.map((s) =>
          s.id === action.suggestionId && s.status === 'pending' ? { ...s, status: 'rejected' } : s,
        ),
      };
    case 'correct-match': {
      const suggestion = state.suggestions.find((s) => s.id === action.suggestionId);
      if (!suggestion || suggestion.status !== 'pending') return state;
      return deskReducer(
        {
          ...state,
          suggestions: state.suggestions.map((s) =>
            s.id === action.suggestionId ? { ...s, status: 'corrected', target: action.target } : s,
          ),
        },
        {
          type: 'commit-anchor',
          cardId: suggestion.noteId,
          target: action.target,
          source: 'corrected-match',
        },
      );
    }
    case 'append-trail':
      return { ...state, trail: [...state.trail, trailEvent(action.event)] };
    case 'propose-marks':
      return { ...state, marks: [...state.marks, ...action.marks] };
    case 'confirm-mark': {
      const mark = state.marks.find((m) => m.id === action.markId);
      if (!mark || mark.status !== 'detected') return state;
      const questionTrail: ThinkingTrailEvent[] =
        mark.kind === 'question' || mark.kind === 'explain'
          ? [
              trailEvent({
                cardId: mark.noteId,
                at: nowIso(),
                kind: mark.kind === 'question' ? 'question' : 'ai_explanation',
                layerOrigin: 'student',
                layerType: 'questions',
                summary: `Confirmed ${mark.glyph} on ${cardTitle(state, mark.noteId)}`,
                fromAi: false,
              }),
            ]
          : [];
      return {
        ...state,
        marks: state.marks.map((m) => (m.id === action.markId ? { ...m, status: 'confirmed' } : m)),
        trail: [...state.trail, ...questionTrail],
      };
    }
    case 'dismiss-mark':
      return {
        ...state,
        marks: state.marks.map((m) => (m.id === action.markId ? { ...m, status: 'dismissed' } : m)),
      };
    case 'add-ai-turn':
      return {
        ...state,
        aiTurns: [...state.aiTurns, action.turn],
        askOpen: true,
        trail: [
          ...state.trail,
          trailEvent({
            cardId: action.turn.selectionCardIds[0] ?? action.turn.id,
            at: action.turn.at,
            kind: 'ai_explanation',
            layerOrigin: 'ai',
            layerType: 'ai',
            summary: `AI answered from ${action.turn.selectionCardIds.length} selected card(s)`,
            fromAi: true,
          }),
        ],
      };
    case 'pin-ai-card': {
      const withCard: DeskState = {
        ...state,
        aiCards: [...state.aiCards, action.card],
        trail: [
          ...state.trail,
          trailEvent({
            cardId: action.card.id,
            at: action.card.createdAt,
            kind: 'latest_understanding',
            layerOrigin: 'ai',
            layerType: 'ai',
            summary: action.card.title,
            fromAi: true,
          }),
        ],
      };
      if (action.attachToPageIndex === undefined || !state.document) return withCard;
      return deskReducer(withCard, {
        type: 'commit-anchor',
        cardId: action.card.id,
        target: { kind: 'page', documentId: state.document.id, pageIndex: action.attachToPageIndex },
        source: 'manual',
      });
    }
    case 'open-ask':
      return { ...state, askOpen: action.open };
    default:
      return assertNever(action, 'Unhandled desk action');
  }
}
