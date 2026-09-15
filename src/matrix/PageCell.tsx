import type { LayerVisibility, MaterialStub, MatrixOrientation, PdfPageCard } from '../types/matrix';
import { layerKey } from '../types/matrix';

interface Props {
  page: PdfPageCard;
  stubs: MaterialStub[];
  orientation: MatrixOrientation;
  selected: boolean;
  pdfVisible: boolean;
  layers: LayerVisibility;
  pageImageUrl?: string;
  selectedIds: readonly string[];
  onSelect: (additive: boolean) => void;
  onSelectStub: (stubId: string, additive: boolean) => void;
}

function stubVisible(stub: MaterialStub, layers: LayerVisibility): boolean {
  const origin = stub.kind === 'ai' ? 'ai' : 'student';
  const type = stub.kind === 'ai' ? 'ai' : stub.kind;
  return layers[layerKey(origin, type)] !== false;
}

export function PageCell({
  page,
  stubs,
  orientation,
  selected,
  pdfVisible,
  layers,
  pageImageUrl,
  selectedIds,
  onSelect,
  onSelectStub,
}: Props) {
  return (
    <div className={`page-row orientation-${orientation}`}>
      <button
        type="button"
        className={`card pdf-card ${selected ? 'selected' : ''} ${selected ? 'connector-affordance' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(e.shiftKey);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="card-label">PDF p{page.pageIndex + 1}</div>
        {pdfVisible ? (
          pageImageUrl ? (
            <img src={pageImageUrl} alt={`Page ${page.pageIndex + 1}`} draggable={false} />
          ) : (
            <div className="card-placeholder">Rendering…</div>
          )
        ) : (
          <div className="card-placeholder muted">PDF layer off</div>
        )}
      </button>

      <div className="stub-axis">
        {stubs.map((stub) => {
          if (!stubVisible(stub, layers)) return null;
          const stubSelected = selectedIds.includes(stub.id);
          return (
            <button
              key={stub.id}
              type="button"
              className={`card stub-card kind-${stub.kind} ${stubSelected ? 'selected' : ''} ${
                selected || stubSelected ? 'connector-affordance' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectStub(stub.id, e.shiftKey);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="card-label">{stub.kind}</div>
              <div className="card-placeholder muted">{stub.empty ? 'empty stub' : 'content'}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
