import type {
  AiCitation,
  CardKind,
  LayerOrigin,
  LayerType,
  NormalizedRect,
} from '../types/domain.ts';

export type { AiCitation };

/** Pin evidence attached to a selected card so the tutor can cite a region. */
export interface PinSnapshot {
  anchorId: string;
  kind: 'page' | 'region';
  pageIndex: number;
  pageCardId: string;
  label: string;
  rect?: NormalizedRect;
}

/** Snapshot of a selected card passed to a pluggable AI client. */
export interface CardSnapshot {
  id: string;
  kind: CardKind;
  title: string;
  origin: LayerOrigin;
  type: LayerType;
  excerpt: string;
  pageIndex?: number;
  pins: readonly PinSnapshot[];
}

export interface AiRequest {
  prompt: string;
  selection: readonly CardSnapshot[];
}

export interface AiResponse {
  answer: string;
  citations: readonly AiCitation[];
}

export class EmptySelectionError extends Error {
  constructor() {
    super('AI only runs on an explicit selection set.');
    this.name = 'EmptySelectionError';
  }
}

/** Pluggable client. Implementations must refuse empty selection. */
export interface AiClient {
  complete(request: AiRequest): Promise<AiResponse>;
}

export function snapshotsFromCards(
  cards: readonly {
    id: string;
    kind: CardKind;
    title: string;
    origin: LayerOrigin;
    type: LayerType;
    excerpt?: string;
    caption?: string;
    body?: string;
    pageIndex?: number;
    pins?: readonly PinSnapshot[];
  }[],
): CardSnapshot[] {
  return cards.map((card) => ({
    id: card.id,
    kind: card.kind,
    title: card.title,
    origin: card.origin,
    type: card.type,
    excerpt: card.excerpt ?? card.caption ?? card.body ?? '',
    pageIndex: card.pageIndex,
    pins: card.pins ?? [],
  }));
}
