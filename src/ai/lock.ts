import type { DeskState } from '../engine/deskState.ts';
import type { AiCitation } from '../types/domain.ts';
import { snapshotsFromSelection } from './context.ts';

/**
 * Stage 3 lock: Ask prompt context is exactly the visible SelectionSet chips.
 * Adding or removing a card must change what the tutor sees — no silent desk search.
 */
export function liveAskCardIds(state: DeskState): readonly string[] {
  return snapshotsFromSelection(state).map((card) => card.id);
}

export function askContextMatchesChips(state: DeskState): boolean {
  const live = liveAskCardIds(state);
  const chips = state.selection.cardIds;
  return live.length === chips.length && live.every((id, index) => id === chips[index]);
}

/** Citations may only rest on cards that were in the gathering. */
export function citationIdsOutsideSelection(
  selectionIds: readonly string[],
  citations: readonly AiCitation[],
): string[] {
  const allowed = new Set(selectionIds);
  const leaked: string[] = [];
  for (const cite of citations) {
    if (allowed.has(cite.cardId) || leaked.includes(cite.cardId)) continue;
    leaked.push(cite.cardId);
  }
  return leaked;
}

/** Ask is a pulled overlay. It starts tucked; the matrix stays the spatial center. */
export function askStartsTucked(askOpen: boolean): boolean {
  return askOpen === false;
}
