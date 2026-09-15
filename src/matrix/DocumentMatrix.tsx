import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type {
  LayerVisibility,
  MaterialStub,
  MatrixOrientation,
  PdfPageCard,
  SelectionSet,
} from '../types/matrix';
import { DEFAULT_LAYER_VISIBILITY, layerKey } from '../types/matrix';
import type { LoadedPdf } from '../pdf/loadPdf';
import { LayerToggles } from '../layers/LayerToggles';
import { SelectionChips } from './SelectionChips';
import { PageCell } from './PageCell';

const MATERIAL_KINDS = ['handwriting', 'transcription', 'questions', 'ai'] as const;

function buildEmptyStubs(pages: readonly PdfPageCard[]): MaterialStub[] {
  return pages.flatMap((page) =>
    MATERIAL_KINDS.map((kind, slotIndex) => ({
      id: `${page.id}:${kind}`,
      kind,
      parentCardId: page.id,
      slotIndex,
      empty: true,
    })),
  );
}

interface Props {
  pdf: LoadedPdf | null;
}

export function DocumentMatrix({ pdf }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [orientation, setOrientation] = useState<MatrixOrientation>('vertical');
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState<{ x: number; y: number; panX: number; panY: number } | null>(
    null,
  );
  const [layers, setLayers] = useState<LayerVisibility>(DEFAULT_LAYER_VISIBILITY);
  const [selection, setSelection] = useState<SelectionSet>({ cardIds: [] });
  const [pageCanvases, setPageCanvases] = useState<Record<number, string>>({});

  const pages: PdfPageCard[] = useMemo(() => {
    if (!pdf) return [];
    return Array.from({ length: pdf.pageCount }, (_, pageIndex) => ({
      id: `${pdf.documentId}:p${pageIndex}`,
      documentId: pdf.documentId,
      pageIndex,
      axisIndex: pageIndex,
    }));
  }, [pdf]);

  const stubs = useMemo(() => buildEmptyStubs(pages), [pages]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!pdf) {
        setPageCanvases({});
        return;
      }
      const next: Record<number, string> = {};
      for (let i = 0; i < pdf.pageCount; i++) {
        const canvas = await pdf.getPageCanvas(i, 1.1);
        if (cancelled) return;
        next[i] = canvas.toDataURL('image/png');
      }
      if (!cancelled) setPageCanvases(next);
    })().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [pdf]);

  const onWheel = useCallback((e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    setZoom((z) => Math.min(2.5, Math.max(0.4, z - e.deltaY * 0.0015)));
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  function onPointerDown(e: ReactPointerEvent) {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!dragging) return;
    setPan({
      x: dragging.panX + (e.clientX - dragging.x),
      y: dragging.panY + (e.clientY - dragging.y),
    });
  }

  function onPointerUp() {
    setDragging(null);
  }

  function toggleSelect(cardId: string, additive: boolean) {
    setSelection((prev) => {
      if (additive) {
        const has = prev.cardIds.includes(cardId);
        return {
          cardIds: has ? prev.cardIds.filter((id) => id !== cardId) : [...prev.cardIds, cardId],
        };
      }
      return { cardIds: prev.cardIds.length === 1 && prev.cardIds[0] === cardId ? [] : [cardId] };
    });
  }

  const pdfVisible = layers[layerKey('system', 'pdf')] !== false;

  return (
    <div className="matrix-root">
      <header className="matrix-toolbar">
        <div className="brand">terikiki</div>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => setOrientation((o) => (o === 'vertical' ? 'horizontal' : 'vertical'))}
        >
          Orientation: {orientation === 'vertical' ? 'PDF ↓' : 'PDF →'}
        </button>
        <LayerToggles layers={layers} onChange={setLayers} />
        <SelectionChips selection={selection} pages={pages} stubs={stubs} />
      </header>

      <div
        ref={viewportRef}
        className={`matrix-viewport ${dragging ? 'dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className={`matrix-surface orientation-${orientation}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {pages.map((page) => (
            <PageCell
              key={page.id}
              page={page}
              stubs={stubs.filter((s) => s.parentCardId === page.id)}
              orientation={orientation}
              selected={selection.cardIds.includes(page.id)}
              pdfVisible={pdfVisible}
              layers={layers}
              pageImageUrl={pageCanvases[page.pageIndex]}
              onSelect={(additive) => toggleSelect(page.id, additive)}
              onSelectStub={(stubId, additive) => toggleSelect(stubId, additive)}
              selectedIds={selection.cardIds}
            />
          ))}
          {pages.length === 0 && (
            <div className="empty-hint">Drop or load a PDF to populate the matrix.</div>
          )}
        </div>
      </div>
    </div>
  );
}
