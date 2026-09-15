import { useState, type Dispatch, type FormEvent } from 'react';
import type { AiClient } from '../ai/client.ts';
import {
  boundCitations,
  chipKindClass,
  chipKindVoice,
  citeStampClass,
  gatheringEqualsSelection,
  snapshotsFromSelection,
} from '../ai/context.ts';
import { createId, nowIso } from '../engine/ids.ts';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { cardById, labelForCard, selectedCards } from '../engine/selectors.ts';
import type { AiCitation, MatrixCard } from '../types/domain.ts';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
  ai: AiClient;
}

function revealCitation(dispatch: Dispatch<DeskAction>, cite: AiCitation) {
  dispatch({
    type: 'focus-card',
    cardId: cite.revealCardId,
    anchorId: cite.anchorId,
  });
}

function AskContextChips({
  cards,
  dispatch,
}: {
  cards: readonly MatrixCard[];
  dispatch: Dispatch<DeskAction>;
}) {
  return (
    <div className="ask-context" data-testid="ask-context" aria-label="Ask sees this selection">
      <span className="chips-label">Ask sees</span>
      {cards.map((card) => (
        <span key={card.id} className={chipKindClass(card.kind)} data-testid="ask-context-chip">
          <button
            type="button"
            className="chip-jump"
            title={`Jump to ${chipKindVoice(card.kind)}`}
            onClick={() => dispatch({ type: 'focus-card', cardId: card.id })}
          >
            <span className="chip-kind">{chipKindVoice(card.kind)}</span>
            {labelForCard(card)}
          </button>
          <button
            type="button"
            className="chip-drop"
            aria-label={`Drop ${labelForCard(card)} from Ask`}
            onClick={() => dispatch({ type: 'remove-from-selection', cardId: card.id })}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

function CitationStamps({
  citations,
  dispatch,
}: {
  citations: readonly AiCitation[];
  dispatch: Dispatch<DeskAction>;
}) {
  return (
    <div className="cite-row" data-testid="citation-stamps">
      {citations.map((cite, index) => (
        <button
          key={`${cite.cardId}:${cite.kind}:${cite.anchorId ?? index}`}
          type="button"
          className={citeStampClass(cite.kind)}
          data-testid="citation-stamp"
          data-cite-kind={cite.kind}
          onClick={() => revealCitation(dispatch, cite)}
        >
          {cite.label}
        </button>
      ))}
    </div>
  );
}

export function AskPanel({ state, dispatch, ai }: Props) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gathered = selectedCards(state);
  const last = state.aiTurns.at(-1);
  const lastGatheringMatchesLive = last
    ? gatheringEqualsSelection(last.selectionCardIds, state.selection.cardIds)
    : true;

  async function onAsk(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (gathered.length === 0) {
      setError('Gather cards first. The tutor will not search the rest of the desk.');
      return;
    }
    setBusy(true);
    try {
      const selection = snapshotsFromSelection(state);
      const result = await ai.complete({
        prompt,
        selection,
      });
      dispatch({
        type: 'add-ai-turn',
        turn: {
          id: createId('turn'),
          prompt: prompt.trim() || 'What should I notice in this selection?',
          selectionCardIds: gathered.map((card) => card.id),
          answer: result.answer,
          citations: boundCitations(selection, result.citations),
          at: nowIso(),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ask failed');
    } finally {
      setBusy(false);
    }
  }

  function pinLast() {
    if (!last) return;
    const page = gathered.find((card) => card.kind === 'pdf-page');
    dispatch({
      type: 'pin-ai-card',
      card: {
        id: createId('ai'),
        kind: 'ai',
        origin: 'ai',
        type: 'ai',
        title: last.prompt,
        body: last.answer,
        citationCardIds: last.selectionCardIds,
        createdAt: nowIso(),
      },
      attachToPageIndex: page && page.kind === 'pdf-page' ? page.pageIndex : undefined,
    });
  }

  if (!state.askOpen) return null;

  return (
    <aside className="ask-panel" data-testid="ask-tray" aria-label="Ask tray">
      <div className="ask-head">
        <h2>Ask only what you gathered</h2>
        <button
          type="button"
          className="tiny"
          onClick={() => dispatch({ type: 'open-ask', open: false })}
        >
          Tuck
        </button>
      </div>
      <div className="ask-body">
        {gathered.length === 0 ? (
          <p className="ask-empty">
            Gather pages and notes first. The tutor is blind to everything else — no silent corpus
            search.
          </p>
        ) : (
          <AskContextChips cards={gathered} dispatch={dispatch} />
        )}
        <form className="ask-form" onSubmit={onAsk}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What is the handwriting trying to settle?"
          />
          <div className="row">
            <button type="submit" className="ink-btn" disabled={busy || gathered.length === 0}>
              {busy ? 'Reading…' : 'Ask'}
            </button>
            {last && (
              <button type="button" className="ink-btn" onClick={pinLast}>
                Pin answer on desk
              </button>
            )}
          </div>
        </form>
        {error && <p className="ask-empty">{error}</p>}
        {state.aiTurns.slice(-3).map((turn) => {
          const isLatest = turn.id === last?.id;
          return (
            <article key={turn.id} className="turn" data-testid={isLatest ? 'ask-answer' : undefined}>
              <p className="turn-prompt">{turn.prompt}</p>
              {turn.answer}
              <div className="cite-label">Cited from this gathering</div>
              <div className="ask-frozen" aria-label="Cards used for this answer">
                {turn.selectionCardIds.map((id) => {
                  const card = cardById(state, id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className={card ? chipKindClass(card.kind) : 'chip'}
                      onClick={() => dispatch({ type: 'focus-card', cardId: id })}
                    >
                      {card ? labelForCard(card) : id}
                    </button>
                  );
                })}
              </div>
              <CitationStamps citations={turn.citations} dispatch={dispatch} />
              {isLatest && !lastGatheringMatchesLive && (
                <p className="ask-empty">The live gathering changed. Ask again to cite the new chips.</p>
              )}
            </article>
          );
        })}
      </div>
    </aside>
  );
}
