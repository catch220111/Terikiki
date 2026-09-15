import { useCallback, useEffect, useRef, useState, type Dispatch, type DragEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { ConnectorLayer } from './ConnectorLayer.tsx';
import { PageCluster } from './PageCluster.tsx';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
  onImportNotes: (files: readonly File[]) => void;
  onArmPin: (noteId: string, mode: 'page' | 'region', suggestionId?: string) => void;
  toolHint: string | null;
}

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('button, input, textarea, label, [data-card]'));
}

export function MatrixViewport({ state, dispatch, onImportNotes, onArmPin, toolHint }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [dropOver, setDropOver] = useState(false);

  useEffect(() => {
    setSurface(surfaceRef.current);
  }, [state.pages.length, state.notes.length, state.aiCards.length, state.anchors.length]);

  useEffect(() => {
    if (!state.focusCardId || state.revealNonce === 0) return;
    const viewport = viewportRef.current;
    const surfaceEl = surfaceRef.current;
    if (!viewport || !surfaceEl) return;
    const regionEl = state.citedAnchorId
      ? surfaceEl.querySelector(`[data-region="${state.citedAnchorId}"]`)
      : null;
    const el = regionEl ?? surfaceEl.querySelector(`[data-card="${state.focusCardId}"]`);
    if (!el) return;
    const card = el.getBoundingClientRect();
    const view = viewport.getBoundingClientRect();
    dispatch({
      type: 'nudge-camera',
      dx: view.left + view.width / 2 - (card.left + card.width / 2),
      dy: view.top + view.height / 2 - (card.top + card.height / 2),
    });
  }, [dispatch, state.citedAnchorId, state.focusCardId, state.revealNonce]);

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

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    if (![...e.dataTransfer.types].includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDropOver(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDropOver(false);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDropOver(false);
    const files = [...e.dataTransfer.files];
    if (files.length > 0) onImportNotes(files);
  }

  return (
    <div
      ref={viewportRef}
      className={`matrix-viewport ${drag ? 'dragging' : ''} ${pinning ? 'pinning' : ''} ${dropOver ? 'drop-over' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={(e) => {
        if (!isInteractive(e.target) && !state.anchorDraft) dispatch({ type: 'clear-selection' });
      }}
    >
      {pinning && (
        <div className="banner">
          {state.anchorDraft?.suggestionId ? 'Correcting a stub guess. ' : ''}
          {state.anchorDraft?.mode === 'page'
            ? 'Click a printed page to pin. Esc cancels.'
            : state.anchorDraft?.pageIndex === undefined
              ? 'Click a printed page, then drag a rectangle.'
              : 'Drag a rectangle on the page. Esc cancels.'}
        </div>
      )}
      {!pinning && toolHint && <div className="banner">{toolHint}</div>}
      {dropOver && !pinning && (
        <div className="banner">Drop photographed or scanned notes onto the desk.</div>
      )}
      <div
        ref={surfaceRef}
        className={`matrix-surface orientation-${state.orientation}`}
        style={{ transform: `translate(${state.camera.x}px, ${state.camera.y}px) scale(${state.camera.zoom})` }}
      >
        <PageCluster state={state} dispatch={dispatch} onArmPin={onArmPin} />
        <ConnectorLayer state={state} surface={surface} />
        {state.pages.length === 0 && <div className="ghost">Open a PDF to populate the matrix.</div>}
      </div>
    </div>
  );
}
