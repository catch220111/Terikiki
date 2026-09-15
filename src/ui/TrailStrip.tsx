import type { Dispatch } from 'react';
import type { DeskAction, DeskState } from '../engine/deskState.ts';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
}

export function TrailStrip({ state, dispatch }: Props) {
  const detected = state.marks.filter((m) => m.status === 'detected');
  return (
    <aside className="margin-trail">
      <h2>Thinking trail</h2>
      <ol className="trail-list">
        {state.trail.length === 0 && <li className="trail-item">Empty. Import a note to start.</li>}
        {[...state.trail].reverse().map((event) => (
          <li key={event.id} className={`trail-item ${event.fromAi ? 'ai' : ''}`}>
            <button type="button" className="tiny" onClick={() => dispatch({ type: 'focus-card', cardId: event.cardId })}>
              {event.fromAi ? 'AI' : 'ink'}
            </button>{' '}
            <span className="kind">{event.kind.replaceAll('_', ' ')}</span>
            <div>{event.summary}</div>
          </li>
        ))}
      </ol>
      {detected.length > 0 && (
        <div className="mark-inbox">
          <h2>Marks to confirm</h2>
          {detected.map((mark) => (
            <div key={mark.id} className="mark-item">
              <strong>{mark.glyph}</strong> — {mark.rationale}
              <menu>
                <button type="button" className="tiny" onClick={() => dispatch({ type: 'confirm-mark', markId: mark.id })}>
                  Confirm
                </button>
                <button type="button" className="tiny" onClick={() => dispatch({ type: 'dismiss-mark', markId: mark.id })}>
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
