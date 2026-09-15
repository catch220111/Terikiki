import type { LayerOrigin, LayerType } from '../types/matrix';

export type TrailEventKind =
  | 'first_note'
  | 'question'
  | 'pdf_evidence'
  | 'correction'
  | 'ai_explanation'
  | 'latest_understanding';

export interface ThinkingTrailEvent {
  id: string;
  cardId: string;
  at: string; // ISO timestamp
  kind: TrailEventKind;
  layerOrigin: LayerOrigin;
  layerType: LayerType;
  /** Human-readable label; AI content must stay labeled as AI. */
  summary: string;
  fromAi: boolean;
}

/**
 * Lightweight thinking-trail boundary (Stage 1 stub).
 * Ordered events keyed to card ids + layer origin/type.
 */
export interface ThinkingTrail {
  listForCard(cardId: string): Promise<ThinkingTrailEvent[]>;
  append(event: Omit<ThinkingTrailEvent, 'id'>): Promise<ThinkingTrailEvent>;
}

export class StubThinkingTrail implements ThinkingTrail {
  private readonly byCard = new Map<string, ThinkingTrailEvent[]>();

  async listForCard(cardId: string): Promise<ThinkingTrailEvent[]> {
    return [...(this.byCard.get(cardId) ?? [])];
  }

  async append(event: Omit<ThinkingTrailEvent, 'id'>): Promise<ThinkingTrailEvent> {
    const full: ThinkingTrailEvent = { ...event, id: crypto.randomUUID() };
    const list = this.byCard.get(event.cardId) ?? [];
    list.push(full);
    list.sort((a, b) => a.at.localeCompare(b.at));
    this.byCard.set(event.cardId, list);
    return full;
  }
}
