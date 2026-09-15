import { useEffect, useRef, useState, type Dispatch } from 'react';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { fitPageCamera, fitWidthCamera, matrixViewportSize, READING_GUTTER_PX } from './cameraFit.ts';
import { currentPageId, prefersReducedMotion } from './cameraGlide.ts';
import {
  createFilmstripIdle,
  filmstripClassName,
  subscribePrefersReducedMotion,
  type FilmstripIdle,
} from './filmstripChrome.ts';

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
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const [revealed, setRevealed] = useState(true);
  const [currentId, setCurrentId] = useState<string | null>(state.focusCardId);
  const idleRef = useRef<FilmstripIdle | null>(null);

  const pagesReady = state.pages.length > 0 && state.pages.every((page) => Boolean(page.imageUrl));

  useEffect(() => subscribePrefersReducedMotion(setReduced), []);

  useEffect(() => {
    setCurrentId(readingPageId(state));
  }, [state.camera, state.focusCardId, state.pages, state.revealNonce]);

  useEffect(() => {
    const idle = createFilmstripIdle({
      reducedMotion: () => reduced,
      onChange: setRevealed,
    });
    idleRef.current = idle;
    setRevealed(reduced ? true : idle.revealed);
    if (!reduced) idle.bump();
    function onPointer() {
      idle.bump();
    }
    window.addEventListener('pointermove', onPointer);
    window.addEventListener('mousemove', onPointer);
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('mousemove', onPointer);
      idle.dispose();
      idleRef.current = null;
    };
  }, [reduced, pagesReady]);

  const pages = state.pages;
  return (
    <nav
      className={filmstripClassName(revealed, reduced)}
      data-testid="page-strip"
      data-reduced-motion={reduced ? 'true' : undefined}
      data-revealed={revealed || reduced ? 'true' : 'false'}
      aria-label="Page filmstrip"
      onPointerEnter={() => idleRef.current?.hold()}
      onPointerLeave={() => idleRef.current?.armIdle()}
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
              idleRef.current?.bump();
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
