import type { Dispatch } from 'react';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { orderedTrail, trailKindLabel, trailVoice } from '../trail/events.ts';
import { COMMAND_MARK_IF_CONFIRMED, COMMAND_MARK_MEANING } from '../types/domain.ts';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
  onTuck: () => void;
}

export function TrailStrip({ state, dispatch, onTuck }: Props) {
  const detected = state.marks.filter((m) => m.status === 'detected');
  const trail = orderedTrail(state.trail);
  return (
    <aside className="trail-drawer" data-testid="thinking-trail" aria-label="Thinking trail">
      <div className="ask-head">
        <h2>Thinking trail</h2>
        <button type="button" className="tiny" onClick={onTuck}>
          Tuck
        </button>
      </div>
      <ol className="trail-list">
        {trail.length === 0 && <li className="trail-item">Empty. Import a note to start.</li>}
        {trail.map((event) => {
          const voice = trailVoice(event.fromAi);
          return (
            <li
              key={event.id}
              className={`trail-item ${voice}`}
              data-testid="trail-event"
              data-kind={event.kind}
              data-from-ai={event.fromAi ? 'true' : 'false'}
              data-card={event.cardId}
            >
              <button
                type="button"
                className={`tiny voice-${voice}`}
                onClick={() => dispatch({ type: 'focus-card', cardId: event.cardId })}
              >
                {voice === 'ai' ? 'AI' : 'ink'}
              </button>{' '}
              <span className="kind">{trailKindLabel(event.kind)}</span>
              <div>{event.summary}</div>
            </li>
          );
        })}
      </ol>
      {detected.length > 0 && (
        <div className="mark-inbox" data-testid="mark-inbox">
          <h2>Marks to confirm</h2>
          {detected.map((mark) => (
            <div key={mark.id} className="mark-item" data-testid="mark-proposal" data-mark-kind={mark.kind}>
              <strong className="glyph">{mark.glyph}</strong>
              <div className="mark-meaning">{COMMAND_MARK_MEANING[mark.kind]}</div>
              <p>{mark.rationale}</p>
              <p className="mark-action">{COMMAND_MARK_IF_CONFIRMED[mark.kind]}</p>
              <menu>
                <button
                  type="button"
                  className="tiny"
                  data-testid="mark-confirm"
                  onClick={() => dispatch({ type: 'confirm-mark', markId: mark.id })}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  className="tiny"
                  data-testid="mark-dismiss"
                  onClick={() => dispatch({ type: 'dismiss-mark', markId: mark.id })}
                >
                  Dismiss
                </button>
              </menu>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
