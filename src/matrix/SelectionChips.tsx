import type { MaterialStub, PdfPageCard, SelectionSet } from '../types/matrix';

interface Props {
  selection: SelectionSet;
  pages: readonly PdfPageCard[];
  stubs: readonly MaterialStub[];
}

export function SelectionChips({ selection, pages, stubs }: Props) {
  if (selection.cardIds.length === 0) {
    return <div className="selection-chips empty">AI context: none selected</div>;
  }

  const labels = selection.cardIds.map((id) => {
    const page = pages.find((p) => p.id === id);
    if (page) return `PDF p${page.pageIndex + 1}`;
    const stub = stubs.find((s) => s.id === id);
    if (stub) return stub.kind;
    return id;
  });

  return (
    <div className="selection-chips" aria-label="AI context selection">
      <span className="chips-label">AI context:</span>
      {labels.map((label, i) => (
        <span key={`${label}-${i}`} className="chip">
          {label}
        </span>
      ))}
    </div>
  );
}
