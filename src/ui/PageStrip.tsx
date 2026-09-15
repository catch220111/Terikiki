import type { Dispatch } from 'react';
import type { DeskAction, DeskState } from '../engine/deskState.ts';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
}

function zoomLabel(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

export function PageStrip({ state, dispatch }: Props) {
  const pages = state.pages;
  return (
    <nav className="page-strip" data-testid="page-strip" aria-label="Page navigator">
      <div className="page-strip-meta">
        <span className="page-strip-kicker">Pages</span>
        <span className="page-strip-count">
          {pages.length === 0 ? 'None' : `${pages.length} ${pages.length === 1 ? 'page' : 'pages'}`}
        </span>
      </div>
      <div className="page-thumbs">
        {pages.length === 0 && <span className="page-strip-empty">Open a PDF to read pages here.</span>}
        {pages.map((page) => {
          const selected = state.selection.cardIds.includes(page.id);
          const focused = state.focusCardId === page.id;
          return (
            <button
              key={page.id}
              type="button"
              className={`page-thumb ${selected ? 'selected' : ''} ${focused ? 'focused' : ''}`}
              data-testid="page-thumb"
              data-page-index={page.pageIndex}
              aria-current={focused || selected ? 'page' : undefined}
              title={`Jump to page ${page.pageIndex + 1}${page.title ? ` · ${page.title}` : ''}`}
              onClick={() => dispatch({ type: 'focus-card', cardId: page.id })}
            >
              {page.imageUrl ? (
                <img src={page.imageUrl} alt="" draggable={false} />
              ) : (
                <span className="page-thumb-ghost">…</span>
              )}
              <span className="page-thumb-index">p{page.pageIndex + 1}</span>
            </button>
          );
        })}
      </div>
      <div className="page-strip-view" role="group" aria-label="Zoom">
        <button
          type="button"
          className="tool-btn"
          data-testid="zoom-out"
          aria-label="Zoom out"
          onClick={() => dispatch({ type: 'set-zoom', zoom: state.camera.zoom - 0.1 })}
        >
          −
        </button>
        <span className="zoom-readout" data-testid="zoom-readout">
          {zoomLabel(state.camera.zoom)}
        </span>
        <button
          type="button"
          className="tool-btn"
          data-testid="zoom-in"
          aria-label="Zoom in"
          onClick={() => dispatch({ type: 'set-zoom', zoom: state.camera.zoom + 0.1 })}
        >
          +
        </button>
      </div>
    </nav>
  );
}
