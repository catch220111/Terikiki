import { useState, type Dispatch, type FormEvent } from 'react';
import type { AiClient } from '../ai/client.ts';
import { snapshotsFromCards } from '../ai/client.ts';
import { createId, nowIso } from '../engine/ids.ts';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { selectedCards } from '../engine/selectors.ts';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
  ai: AiClient;
}

export function AskPanel({ state, dispatch, ai }: Props) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gathered = selectedCards(state);
  const last = state.aiTurns.at(-1);

  async function onAsk(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (gathered.length === 0) {
      setError('Gather cards first. The tutor will not search the rest of the desk.');
      return;
    }
    setBusy(true);
    try {
      const result = await ai.complete({
        prompt,
        selection: snapshotsFromCards(gathered),
      });
      dispatch({
        type: 'add-ai-turn',
        turn: {
          id: createId('turn'),
          prompt: prompt.trim() || 'What should I notice in this selection?',
          selectionCardIds: gathered.map((card) => card.id),
          answer: result.answer,
          citations: result.citations,
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

  if (!state.askOpen) {
    return (
      <aside className="ask-panel">
        <div className="ask-body">
          <h2>Ask</h2>
          <p className="ask-empty">Closed. Open Ask from the rail when you have gathered paper.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="ask-panel">
      <div className="ask-body">
        <h2>Ask only what you gathered</h2>
        {gathered.length === 0 ? (
          <p className="ask-empty">
            Shift-select pages and notes. The tutor is blind to everything else — no silent corpus search.
          </p>
        ) : (
          <p className="ask-empty">{gathered.length} card(s) in context. Citations will jump back to those cards.</p>
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
        {last && (
          <article className="turn">
            {last.answer}
            <div>
              {last.citations.map((cite) => (
                <button
                  key={cite.cardId}
                  type="button"
                  className="cite"
                  onClick={() => dispatch({ type: 'focus-card', cardId: cite.cardId })}
                >
                  {cite.quote.slice(0, 48)}
                </button>
              ))}
            </div>
          </article>
        )}
      </div>
    </aside>
  );
}
