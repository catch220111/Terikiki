import type { Dispatch } from 'react';
import { isCardCited } from '../ai/context.ts';
import { isLayerVisible, type AiCard, type NoteCard as Note } from '../types/domain.ts';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { anchorsForCard, confirmedMarksFor, isCardVisible, pendingSuggestionsFor } from '../engine/selectors.ts';
import { describeTarget } from '../engine/anchors.ts';
import { formatConfidence } from '../matching/service.ts';
import { isAdditiveClick } from './pointer.ts';

interface NoteProps {
  note: Note;
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
  onArmPin: (noteId: string, mode: 'page' | 'region', suggestionId?: string) => void;
}

export function NoteCard({ note, state, dispatch, onArmPin }: NoteProps) {
  const selected = state.selection.cardIds.includes(note.id);
  const hovered = state.hoverCardId === note.id;
  const cited = isCardCited(state, note.id);
  const visible = isCardVisible(state, note);
  const showTranscript = isLayerVisible(state.layers, 'student', 'transcription');
  const showQuestions = isLayerVisible(state.layers, 'student', 'questions');
  const pending = pendingSuggestionsFor(state, note.id);
  const marks = confirmedMarksFor(state, note.id);
  const pins = anchorsForCard(state, note.id);

  return (
    <article
      data-card={note.id}
      data-testid={`note-card-${note.id}`}
      data-cited={cited ? 'true' : undefined}
      className={`paper-card note ${selected ? 'selected' : ''} ${cited ? 'cited' : ''} ${selected || hovered ? 'connector-affordance' : ''}`}
      onMouseEnter={() => dispatch({ type: 'set-hover', cardId: note.id })}
      onMouseLeave={() => dispatch({ type: 'set-hover', cardId: null })}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="note-face"
        onClick={(e) => dispatch({ type: 'select-card', cardId: note.id, additive: isAdditiveClick(e) })}
      >
        <div className="card-kicker">Handwriting</div>
        {visible ? (
          <img src={note.imageUrl} alt={note.title} draggable={false} />
        ) : (
          <div className="ghost">Handwriting layer off</div>
        )}
        <strong className="note-title">{note.title}</strong>
        {showTranscript && note.caption && (
          <div className="note-transcript">
            <div className="card-kicker transcript">Transcription</div>
            <div className="note-caption">{note.caption}</div>
          </div>
        )}
        {showQuestions && (
          <div className="note-marks">
            {marks.map((mark) => (
              <span key={mark.id} className="glyph">
                {mark.glyph}
              </span>
            ))}
          </div>
        )}
      </button>
      {pins.length > 0 && (
        <div className="note-pins">
          Pinned to {pins.map((pin) => describeTarget(pin.target)).join(' · ')}
        </div>
      )}
      {pending.length > 0 && (
        <div className="match-list">
          {pending.map((suggestion) => (
            <aside key={suggestion.id} className="match-slip" data-testid="match-slip">
              <div className="match-kicker">
                Stub suggestion · not pinned · {formatConfidence(suggestion.confidence)}
              </div>
              <p className="match-target">{describeTarget(suggestion.target)}</p>
              <p>{suggestion.rationale}</p>
              <menu>
                <button
                  type="button"
                  className="accept"
                  data-testid="match-accept"
                  onClick={() => dispatch({ type: 'accept-match', suggestionId: suggestion.id })}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="reject"
                  data-testid="match-reject"
                  onClick={() => dispatch({ type: 'reject-match', suggestionId: suggestion.id })}
                >
                  Reject
                </button>
                <button
                  type="button"
                  data-testid="match-correct"
                  onClick={() =>
                    onArmPin(note.id, suggestion.target.kind === 'region' ? 'region' : 'page', suggestion.id)
                  }
                >
                  Correct
                </button>
              </menu>
            </aside>
          ))}
        </div>
      )}
    </article>
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
  const cited = isCardCited(state, card.id);
  const visible = isCardVisible(state, card);
  return (
    <button
      type="button"
      data-card={card.id}
      data-cited={cited ? 'true' : undefined}
      className={`paper-card ai ${selected ? 'selected' : ''} ${cited ? 'cited' : ''} ${selected || hovered ? 'connector-affordance' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        dispatch({ type: 'select-card', cardId: card.id, additive: isAdditiveClick(e) });
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={() => dispatch({ type: 'set-hover', cardId: card.id })}
      onMouseLeave={() => dispatch({ type: 'set-hover', cardId: null })}
    >
      <div className="card-kicker">AI · labeled as AI</div>
      {visible ? <p className="ai-body">{card.body}</p> : <div className="ghost">AI layer off</div>}
    </button>
  );
}
