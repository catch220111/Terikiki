import { useRef, useState, type Dispatch, type PointerEvent as ReactPointerEvent } from 'react';
import { type Anchor, type NormalizedRect, type PdfPageCard as PdfPage } from '../types/domain.ts';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { isCardVisible } from '../engine/selectors.ts';
import { isTinyRegion, regionTarget } from '../engine/anchors.ts';
import { isAdditiveClick } from './pointer.ts';

interface Props {
  page: PdfPage;
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
}

export function PdfPageCard({ page, state, dispatch }: Props) {
  const selected = state.selection.cardIds.includes(page.id);
  const hovered = state.hoverCardId === page.id;
  const visible = isCardVisible(state, page);
  const pinning = state.anchorDraft;
  const drawing = pinning?.mode === 'region' && pinning.pageIndex === page.pageIndex;
  const [draft, setDraft] = useState<NormalizedRect | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const draftRef = useRef<NormalizedRect | null>(null);

  const regions = state.anchors.filter(
    (anchor): anchor is Anchor & { target: Extract<Anchor['target'], { kind: 'region' }> } =>
      anchor.target.kind === 'region' && anchor.target.pageIndex === page.pageIndex,
  );

  function select(additive: boolean) {
    if (pinning?.mode === 'page' || (pinning?.mode === 'region' && pinning.pageIndex === undefined)) {
      dispatch({ type: 'set-anchor-page', pageIndex: page.pageIndex });
      return;
    }
    dispatch({ type: 'select-card', cardId: page.id, additive });
  }

  function toNorm(e: ReactPointerEvent<HTMLDivElement>): { x: number; y: number } {
    const box = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - box.left) / box.width,
      y: (e.clientY - box.top) / box.height,
    };
  }

  function onDrawStart(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drawing) return;
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toNorm(e);
    origin.current = p;
    const next = { x: p.x, y: p.y, w: 0.02, h: 0.02 };
    draftRef.current = next;
    setDraft(next);
  }

  function onDrawMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!origin.current) return;
    const p = toNorm(e);
    const next = {
      x: Math.min(origin.current.x, p.x),
      y: Math.min(origin.current.y, p.y),
      w: Math.abs(p.x - origin.current.x),
      h: Math.abs(p.y - origin.current.y),
    };
    draftRef.current = next;
    setDraft(next);
  }

  function onDrawEnd() {
    const current = draftRef.current;
    origin.current = null;
    draftRef.current = null;
    setDraft(null);
    if (!drawing || !current || !state.document || !pinning) return;
    if (isTinyRegion(current)) return;
    const target = regionTarget(state.document.id, page.pageIndex, current);
    if (pinning.suggestionId) {
      dispatch({ type: 'correct-match', suggestionId: pinning.suggestionId, target });
    } else {
      dispatch({ type: 'commit-manual-anchor', cardId: pinning.noteId, target });
    }
  }

  return (
    <article
      data-card={page.id}
      className={`paper-card pdf ${selected ? 'selected' : ''} ${selected || hovered ? 'connector-affordance' : ''}`}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={() => dispatch({ type: 'set-hover', cardId: page.id })}
      onMouseLeave={() => dispatch({ type: 'set-hover', cardId: null })}
    >
      <div className="card-kicker">Printed · p{page.pageIndex + 1}</div>
      {visible ? (
        <div className="pdf-figure">
          <button
            type="button"
            className="pdf-face"
            onClick={(e) => {
              e.stopPropagation();
              select(isAdditiveClick(e));
            }}
          >
            {page.imageUrl ? (
              <img src={page.imageUrl} alt={page.title} draggable={false} />
            ) : (
              <div className="ghost">Rendering page…</div>
            )}
          </button>
          {regions.map((anchor) => (
            <div
              key={anchor.id}
              data-region={anchor.id}
              className="region-hit"
              style={{
                left: `${anchor.target.rect.x * 100}%`,
                top: `${anchor.target.rect.y * 100}%`,
                width: `${anchor.target.rect.w * 100}%`,
                height: `${anchor.target.rect.h * 100}%`,
              }}
            />
          ))}
          {drawing && (
            <div
              className="draw-layer"
              data-testid="region-draw-layer"
              onPointerDown={onDrawStart}
              onPointerMove={onDrawMove}
              onPointerUp={onDrawEnd}
              onPointerCancel={onDrawEnd}
            >
              {draft && (
                <div
                  className="draft-rect"
                  style={{
                    left: `${draft.x * 100}%`,
                    top: `${draft.y * 100}%`,
                    width: `${draft.w * 100}%`,
                    height: `${draft.h * 100}%`,
                  }}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="pdf-face"
          onClick={(e) => {
            e.stopPropagation();
            select(isAdditiveClick(e));
          }}
        >
          <div className="ghost">PDF layer off — position kept</div>
        </button>
      )}
      <div className="card-kicker" style={{ marginTop: '0.4rem' }}>
        {page.title}
      </div>
    </article>
  );
}
