import { useCallback, useEffect, useRef, useState, type Dispatch, type PointerEvent as ReactPointerEvent } from 'react';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { ConnectorLayer } from './ConnectorLayer.tsx';
import { PageCluster } from './PageCluster.tsx';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
}

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('button, input, textarea, label, [data-card]'));
}

export function MatrixViewport({ state, dispatch }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number; panX: number; panY: number } | null>(null);

  useEffect(() => {
    setSurface(surfaceRef.current);
  }, [state.pages.length, state.notes.length, state.aiCards.length]);

  const onWheel = useCallback(
    (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      dispatch({ type: 'set-zoom', zoom: state.camera.zoom - e.deltaY * 0.0015 });
    },
    [dispatch, state.camera.zoom],
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || isInteractive(e.target)) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDrag({ x: e.clientX, y: e.clientY, panX: state.camera.x, panY: state.camera.y });
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag) return;
    dispatch({
      type: 'set-camera',
      camera: {
        ...state.camera,
        x: drag.panX + (e.clientX - drag.x),
        y: drag.panY + (e.clientY - drag.y),
      },
    });
  }

  function onPointerUp() {
    setDrag(null);
  }

  const pinning = Boolean(state.anchorDraft);

  return (
    <div
      ref={viewportRef}
      className={`matrix-viewport ${drag ? 'dragging' : ''} ${pinning ? 'pinning' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => {
        if (!isInteractive(e.target) && !state.anchorDraft) dispatch({ type: 'clear-selection' });
      }}
    >
      {pinning && (
        <div className="banner">
          {state.anchorDraft?.mode === 'page'
            ? 'Click a PDF page to pin. Esc cancels.'
            : state.anchorDraft?.pageIndex === undefined
              ? 'Click a PDF page, then drag a rectangle.'
              : 'Drag a rectangle on the page. Esc cancels.'}
        </div>
      )}
      <div
        ref={surfaceRef}
        className={`matrix-surface orientation-${state.orientation}`}
        style={{ transform: `translate(${state.camera.x}px, ${state.camera.y}px) scale(${state.camera.zoom})` }}
      >
        <PageCluster state={state} dispatch={dispatch} />
        <ConnectorLayer state={state} surface={surface} />
        {state.pages.length === 0 && <div className="ghost">Open a PDF to populate the matrix.</div>}
      </div>
    </div>
  );
}
