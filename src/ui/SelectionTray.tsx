import type { Dispatch } from 'react';
import { chipKindClass, chipKindVoice } from '../ai/context.ts';
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
        No selection — click a page or note. Shift adds. Ask only sees this gathering.
      </div>
    );
  }

  return (
    <div className="selection-tray" aria-label="Ask sees this selection">
      <span className="chips-label">Ask sees</span>
      {state.selection.cardIds.map((id) => {
        const card = cardById(state, id);
        return (
          <button
            key={id}
            type="button"
            className={card ? chipKindClass(card.kind) : 'chip'}
            title={card ? `Drop ${chipKindVoice(card.kind)} from Ask` : 'Drop from Ask'}
            onClick={() => dispatch({ type: 'remove-from-selection', cardId: id })}
          >
            {card ? labelForCard(card) : id}
          </button>
        );
      })}
      <button
        type="button"
        className="ink-btn"
        data-testid="pull-ask"
        onClick={() => dispatch({ type: 'open-ask', open: !state.askOpen })}
      >
        {state.askOpen ? 'Tuck Ask' : 'Pull Ask'}
      </button>
    </div>
  );
}
