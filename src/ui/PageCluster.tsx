import type { Dispatch } from 'react';
import { assertNever, type AiCard, type NoteCard as Note } from '../types/domain.ts';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { cardsAnchoredToPage, looseCards } from '../engine/selectors.ts';
import { PdfPageCard } from './PdfPageCard.tsx';
import { AiCardView, NoteCard } from './NoteCard.tsx';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
}

function HangCard({
  card,
  state,
  dispatch,
}: {
  card: Note | AiCard;
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
}) {
  if (card.kind === 'note') return <NoteCard note={card} state={state} dispatch={dispatch} />;
  if (card.kind === 'ai') return <AiCardView card={card} state={state} dispatch={dispatch} />;
  return assertNever(card, 'Unhandled hanging card');
}

export function PageCluster({ state, dispatch }: Props) {
  const loose = looseCards(state);
  return (
    <>
      {loose.length > 0 && (
        <section className="cluster loose">
          <div className="cluster-label">Loose leaves</div>
          <div className="hang-axis">
            {loose.map((card) => (
              <HangCard key={card.id} card={card} state={state} dispatch={dispatch} />
            ))}
          </div>
        </section>
      )}
      {state.pages.map((page) => {
        const hanging = cardsAnchoredToPage(state, page.pageIndex).filter(
          (card): card is Note | AiCard => card.kind === 'note' || card.kind === 'ai',
        );
        return (
          <section key={page.id} className="cluster">
            <div className="cluster-label">p{page.pageIndex + 1}</div>
            <PdfPageCard page={page} state={state} dispatch={dispatch} />
            <div className="hang-axis">
              {hanging.map((card) => (
                <HangCard key={card.id} card={card} state={state} dispatch={dispatch} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
