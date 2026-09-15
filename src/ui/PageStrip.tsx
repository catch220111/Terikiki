import { useEffect, useRef, useState, type Dispatch } from 'react';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { fitPageCamera, fitWidthCamera, matrixViewportSize, READING_GUTTER_PX } from './cameraFit.ts';
import {
  currentPageId,
  FILMSTRIP_IDLE_MS,
  prefersReducedMotion,
} from './cameraGlide.ts';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
}

function zoomLabel(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

function focusedPageIndex(state: DeskState): number {
  return state.pages.find((page) => page.id === state.focusCardId)?.pageIndex ?? 0;
}

function readingPageId(state: DeskState): string | null {
  const viewport = document.querySelector('[data-testid="matrix-viewport"]');
  if (!(viewport instanceof HTMLElement)) return state.focusCardId;
  const view = viewport.getBoundingClientRect();
  const pages = [...viewport.querySelectorAll('.paper-card.pdf')].flatMap((el) => {
    const id = el.getAttribute('data-card');
    if (!id) return [];
    return [{ id, top: el.getBoundingClientRect().top }];
  });
  return currentPageId(pages, view.top, READING_GUTTER_PX) ?? state.focusCardId;
}

export function PageFilmstrip({ state, dispatch }: Props) {
  const reduced = prefersReducedMotion();
  const [revealed, setRevealed] = useState(true);
  const [currentId, setCurrentId] = useState<string | null>(state.focusCardId);
  const idleRef = useRef(0);

  const pagesReady = state.pages.length > 0 && state.pages.every((page) => Boolean(page.imageUrl));

  useEffect(() => {
    setCurrentId(readingPageId(state));
  }, [state.camera, state.focusCardId, state.pages, state.revealNonce]);

  useEffect(() => {
    if (reduced) {
      setRevealed(true);
      return;
    }
    function bump() {
      setRevealed(true);
      window.clearTimeout(idleRef.current);
      idleRef.current = window.setTimeout(() => setRevealed(false), FILMSTRIP_IDLE_MS);
    }
    bump();
    window.addEventListener('pointermove', bump);
    window.addEventListener('mousemove', bump);
    return () => {
      window.removeEventListener('pointermove', bump);
      window.removeEventListener('mousemove', bump);
      window.clearTimeout(idleRef.current);
    };
  }, [reduced, pagesReady]);

  const pages = state.pages;
  return (
    <nav
      className={`page-filmstrip ${revealed || reduced ? 'revealed' : ''} ${reduced ? 'static' : ''}`}
      data-testid="page-strip"
      data-reduced-motion={reduced ? 'true' : undefined}
      aria-label="Page filmstrip"
      onPointerEnter={() => {
        if (reduced) return;
        setRevealed(true);
        window.clearTimeout(idleRef.current);
      }}
      onPointerLeave={() => {
        if (reduced) return;
        window.clearTimeout(idleRef.current);
        idleRef.current = window.setTimeout(() => setRevealed(false), FILMSTRIP_IDLE_MS);
      }}
    >
      {pages.length === 0 && <span className="page-strip-empty">Open a PDF</span>}
      {pages.map((page) => {
        const selected = state.selection.cardIds.includes(page.id);
        const focused = state.focusCardId === page.id;
        const current = currentId === page.id || focused;
        return (
          <button
            key={page.id}
            type="button"
            className={`page-thumb ${selected ? 'selected' : ''} ${focused ? 'focused' : ''} ${current ? 'current' : ''}`}
            data-testid="page-thumb"
            data-page-index={page.pageIndex}
            aria-current={current ? 'page' : undefined}
            title={`Jump to page ${page.pageIndex + 1}${page.title ? ` · ${page.title}` : ''}`}
            onClick={() => {
              window.clearTimeout(idleRef.current);
              if (!reduced) {
                setRevealed(true);
                idleRef.current = window.setTimeout(() => setRevealed(false), FILMSTRIP_IDLE_MS);
              }
              dispatch({ type: 'focus-card', cardId: page.id });
            }}
          >
            {page.imageUrl ? (
              <img src={page.imageUrl} alt="" draggable={false} />
            ) : (
              <span className="page-thumb-ghost" />
            )}
            <span className="page-thumb-index">{page.pageIndex + 1}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function ZoomFitBar({ state, dispatch }: Props) {
  const pageIndex = focusedPageIndex(state);
  return (
    <div className="zoom-fit-bar" data-testid="zoom-fit-bar" role="group" aria-label="Zoom and fit">
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
      <button
        type="button"
        className="ink-btn"
        data-testid="zoom-fit-width"
        onClick={() =>
          dispatch({ type: 'set-camera', camera: fitWidthCamera(matrixViewportSize().width, pageIndex) })
        }
      >
        Fit width
      </button>
      <button
        type="button"
        className="ink-btn"
        data-testid="zoom-fit-page"
        onClick={() => {
          const view = matrixViewportSize();
          dispatch({ type: 'set-camera', camera: fitPageCamera(view.width, view.height, pageIndex) });
        }}
      >
        Fit page
      </button>
    </div>
  );
}
