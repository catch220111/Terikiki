import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { ConnectorLayer } from './ConnectorLayer.tsx';
import { PageCluster } from './PageCluster.tsx';
import { PageFilmstrip } from './PageStrip.tsx';
import { cameraFramingPage, lerpCamera, PAGE_GLIDE_MS, prefersReducedMotion } from './cameraGlide.ts';
import { instantPageJump } from './filmstripChrome.ts';
import { readingColumnCamera, READING_GUTTER_PX } from './cameraFit.ts';
import type { ViewerTool } from './viewerTool.ts';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
  onImportNotes: (files: readonly File[]) => void;
  onArmPin: (noteId: string, mode: 'page' | 'region', suggestionId?: string) => void;
  tool: ViewerTool;
  toolHint: string | null;
}

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('button, input, textarea, label, [data-card]'));
}

export function MatrixViewport({ state, dispatch, onImportNotes, onArmPin, tool, toolHint }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef(state.camera);
  cameraRef.current = state.camera;
  const framedDoc = useRef<string | null>(null);
  const glideGen = useRef(0);
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [dropOver, setDropOver] = useState(false);

  useEffect(() => {
    setSurface(surfaceRef.current);
  }, [state.pages.length, state.notes.length, state.aiCards.length, state.anchors.length]);

  useLayoutEffect(() => {
    // CLV: first-frame the PDF reading column, not an empty/scattered canvas.
    const docId = state.document?.id ?? null;
    if (!docId || state.pages.length === 0) return;
    if (framedDoc.current === docId) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const frame = () => {
      if (framedDoc.current === docId) return true;
      const view = viewport.getBoundingClientRect();
      if (view.width < 40) return false;
      framedDoc.current = docId;
      dispatch({ type: 'set-camera', camera: readingColumnCamera(view.width, view.height) });
      return true;
    };
    if (frame()) return;
    const ro = new ResizeObserver(() => {
      if (frame()) ro.disconnect();
    });
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [dispatch, state.document?.id, state.pages.length]);

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
    const view = viewport.getBoundingClientRect();
    const card = el.getBoundingClientRect();
    const target = cameraFramingPage(view, card, cameraRef.current, READING_GUTTER_PX);
    const gen = ++glideGen.current;
    if (instantPageJump(prefersReducedMotion())) {
      dispatch({ type: 'set-camera', camera: target });
      return;
    }
    const from = cameraRef.current;
    const started = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      if (glideGen.current !== gen) return;
      const t = Math.min(1, (now - started) / PAGE_GLIDE_MS);
      dispatch({ type: 'set-camera', camera: lerpCamera(from, target, t) });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (glideGen.current === gen) glideGen.current += 1;
    };
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

  const pinning = Boolean(state.anchorDraft);
  const panTool = tool === 'pan' && !pinning;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !panTool) return;
    const target: HTMLDivElement = viewport;
    function onPanDown(e: PointerEvent) {
      if (e.button !== 0) return;
      if (!(e.target instanceof Element)) return;
      if (e.target.closest('button, input, textarea, label')) return;
      e.preventDefault();
      e.stopPropagation();
      glideGen.current += 1;
      target.setPointerCapture(e.pointerId);
      const camera = cameraRef.current;
      setDrag({ x: e.clientX, y: e.clientY, panX: camera.x, panY: camera.y });
    }
    target.addEventListener('pointerdown', onPanDown, { capture: true });
    return () => target.removeEventListener('pointerdown', onPanDown, { capture: true });
  }, [panTool]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (panTool) return;
    if (e.button !== 0 || isInteractive(e.target)) return;
    glideGen.current += 1;
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
      data-testid="matrix-viewport"
      className={`matrix-viewport ${drag ? 'dragging' : ''} ${pinning ? 'pinning' : ''} ${panTool ? 'pan-tool' : ''} ${dropOver ? 'drop-over' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={(e) => {
        if (panTool) return;
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
      <PageFilmstrip state={state} dispatch={dispatch} />
    </div>
  );
}
