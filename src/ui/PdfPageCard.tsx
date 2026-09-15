import { useRef, useState, type Dispatch, type PointerEvent as ReactPointerEvent } from 'react';
import { clampRect, type Anchor, type PdfPageCard as PdfPage } from '../types/domain.ts';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { isCardVisible } from '../engine/selectors.ts';

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
  const imgRef = useRef<HTMLImageElement>(null);
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

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
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toNorm(e);
    origin.current = p;
    setDraft({ x: p.x, y: p.y, w: 0.02, h: 0.02 });
  }

  function onDrawMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!origin.current) return;
    const p = toNorm(e);
    const x = Math.min(origin.current.x, p.x);
    const y = Math.min(origin.current.y, p.y);
    setDraft({ x, y, w: Math.abs(p.x - origin.current.x), h: Math.abs(p.y - origin.current.y) });
  }

  function onDrawEnd() {
    if (!drawing || !draft || !state.document || !pinning) {
      origin.current = null;
      return;
    }
    const rect = clampRect(draft);
    const target = {
      kind: 'region' as const,
      documentId: state.document.id,
      pageIndex: page.pageIndex,
      rect,
    };
    if (pinning.suggestionId) {
      dispatch({ type: 'correct-match', suggestionId: pinning.suggestionId, target });
    } else {
      dispatch({ type: 'commit-anchor', cardId: pinning.noteId, target, source: 'manual' });
    }
    origin.current = null;
    setDraft(null);
  }

  return (
    <button
      type="button"
      data-card={page.id}
      className={`paper-card pdf ${selected ? 'selected' : ''} ${selected || hovered ? 'connector-affordance' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        select(e.shiftKey);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={() => dispatch({ type: 'set-hover', cardId: page.id })}
      onMouseLeave={() => dispatch({ type: 'set-hover', cardId: null })}
    >
      <div className="card-kicker">PDF · p{page.pageIndex + 1}</div>
      {visible ? (
        <div style={{ position: 'relative' }}>
          {page.imageUrl ? (
            <img ref={imgRef} src={page.imageUrl} alt={page.title} draggable={false} />
          ) : (
            <div className="ghost">Rendering page…</div>
          )}
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
              onPointerDown={onDrawStart}
              onPointerMove={onDrawMove}
              onPointerUp={onDrawEnd}
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
        <div className="ghost">PDF layer off — position kept</div>
      )}
      <div className="card-kicker" style={{ marginTop: '0.4rem' }}>
        {page.title}
      </div>
    </button>
  );
}
