import type { MaterialStub, PdfPageCard } from '../types/matrix';

/** Suggested link from a handwritten note to a PDF region — never auto-committed. */
export interface MatchSuggestion {
  id: string;
  noteId: string;
  target: {
    documentId: string;
    pageIndex: number;
    /** Optional normalized rect 0–1 on the page; omit for whole-page. */
    region?: { x: number; y: number; w: number; h: number };
  };
  confidence: number;
  rationale: string;
}

export type MatchDecision = 'accepted' | 'rejected' | 'corrected';

/**
 * Matching service boundary (Stage 1 stub).
 * Implementations may suggest; callers must accept/reject/correct explicitly.
 */
export interface MatchingService {
  suggestForNote(note: MaterialStub, pages: readonly PdfPageCard[]): Promise<MatchSuggestion[]>;
  accept(suggestionId: string): Promise<void>;
  reject(suggestionId: string): Promise<void>;
  correct(suggestionId: string, target: MatchSuggestion['target']): Promise<void>;
}

/** No-op stub — returns empty suggestions until Stage 2. */
export class StubMatchingService implements MatchingService {
  async suggestForNote(): Promise<MatchSuggestion[]> {
    return [];
  }
  async accept(): Promise<void> {}
  async reject(): Promise<void> {}
  async correct(): Promise<void> {}
}
