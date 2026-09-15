import type { Dispatch } from 'react';
import type { AiCard, NoteCard } from '../types/domain.ts';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { confirmedMarksFor, isCardVisible, pendingSuggestionsFor } from '../engine/selectors.ts';
import { isAdditiveClick } from './pointer.ts';

interface NoteProps {
  note: NoteCard;
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
}

export function NoteCard({ note, state, dispatch }: NoteProps) {
  const selected = state.selection.cardIds.includes(note.id);
  const hovered = state.hoverCardId === note.id;
  const visible = isCardVisible(state, note);
  const pending = pendingSuggestionsFor(state, note.id);
  const marks = confirmedMarksFor(state, note.id);
  const drafting = state.anchorDraft?.noteId === note.id;

  return (
    <div
      data-card={note.id}
      className={`paper-card note ${selected ? 'selected' : ''} ${selected || hovered ? 'connector-affordance' : ''}`}
      onMouseEnter={() => dispatch({ type: 'set-hover', cardId: note.id })}
      onMouseLeave={() => dispatch({ type: 'set-hover', cardId: null })}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        style={{ all: 'unset', display: 'block', cursor: 'pointer', width: '100%' }}
        onClick={(e) => dispatch({ type: 'select-card', cardId: note.id, additive: isAdditiveClick(e) })}
      >
        <div className="card-kicker">Handwriting</div>
        {visible ? (
          <img src={note.imageUrl} alt={note.title} draggable={false} />
        ) : (
          <div className="ghost">Handwriting layer off</div>
        )}
        <strong>{note.title}</strong>
        <div className="note-marks">
          {marks.map((mark) => (
            <span key={mark.id} className="glyph">
              {mark.glyph}
            </span>
          ))}
        </div>
      </button>
      <div className="pin-actions">
        <button type="button" onClick={() => dispatch({ type: 'begin-anchor', noteId: note.id, mode: 'page' })}>
          Pin to page
        </button>
        <button type="button" onClick={() => dispatch({ type: 'begin-anchor', noteId: note.id, mode: 'region' })}>
          Pin to region
        </button>
        {drafting && (
          <button type="button" onClick={() => dispatch({ type: 'cancel-anchor' })}>
            Cancel pin
          </button>
        )}
      </div>
      {pending.length > 0 && (
        <div className="match-list">
          {pending.map((suggestion) => (
            <div key={suggestion.id} className="match-item">
              <div>
                Suggested {suggestion.target.kind} p{suggestion.target.pageIndex + 1} ·{' '}
                {Math.round(suggestion.confidence * 100)}%
              </div>
              <div>{suggestion.rationale}</div>
              <menu>
                <button type="button" onClick={() => dispatch({ type: 'accept-match', suggestionId: suggestion.id })}>
                  Accept
                </button>
                <button
                  type="button"
                  className="reject"
                  onClick={() => dispatch({ type: 'reject-match', suggestionId: suggestion.id })}
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: 'begin-anchor',
                      noteId: note.id,
                      mode: suggestion.target.kind === 'region' ? 'region' : 'page',
                      suggestionId: suggestion.id,
                    })
                  }
                >
                  Correct
                </button>
              </menu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AiCardView({
  card,
  state,
  dispatch,
}: {
  card: AiCard;
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
}) {
  const selected = state.selection.cardIds.includes(card.id);
  const hovered = state.hoverCardId === card.id;
  const visible = isCardVisible(state, card);
  return (
    <button
      type="button"
      data-card={card.id}
      className={`paper-card ai ${selected ? 'selected' : ''} ${selected || hovered ? 'connector-affordance' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        dispatch({ type: 'select-card', cardId: card.id, additive: isAdditiveClick(e) });
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={() => dispatch({ type: 'set-hover', cardId: card.id })}
      onMouseLeave={() => dispatch({ type: 'set-hover', cardId: null })}
    >
      <div className="card-kicker">AI · labeled as AI</div>
      {visible ? <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.8rem' }}>{card.body}</p> : <div className="ghost">AI layer off</div>}
    </button>
  );
}
