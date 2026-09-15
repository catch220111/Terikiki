import type { CardKind, LayerOrigin, LayerType } from '../types/domain.ts';

/** Snapshot of a selected card passed to a pluggable AI client. */
export interface CardSnapshot {
  id: string;
  kind: CardKind;
  title: string;
  origin: LayerOrigin;
  type: LayerType;
  excerpt: string;
}

export interface AiRequest {
  prompt: string;
  selection: readonly CardSnapshot[];
}

export interface AiCitation {
  cardId: string;
  quote: string;
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
  }[],
): CardSnapshot[] {
  return cards.map((card) => ({
    id: card.id,
    kind: card.kind,
    title: card.title,
    origin: card.origin,
    type: card.type,
    excerpt: card.excerpt ?? card.caption ?? card.body ?? '',
  }));
}
