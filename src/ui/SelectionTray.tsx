import type { Dispatch } from 'react';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { cardById, labelForCard } from '../engine/selectors.ts';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
}

export function SelectionTray({ state, dispatch }: Props) {
  if (state.selection.cardIds.length === 0) {
    return (
      <div className="selection-tray empty">
        Gather cards for AI — click to select, Shift-click to add. Nothing is sent until you ask.
      </div>
    );
  }

  return (
    <div className="selection-tray" aria-label="AI context selection">
      <span className="chips-label">AI context</span>
      {state.selection.cardIds.map((id) => {
        const card = cardById(state, id);
        return (
          <button
            key={id}
            type="button"
            className="chip"
            onClick={() => dispatch({ type: 'remove-from-selection', cardId: id })}
          >
            {card ? labelForCard(card) : id}
          </button>
        );
      })}
    </div>
  );
}
