import type { Dispatch } from 'react';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { InkBtn, LayerToggles, FileBtn } from './LayerToggles.tsx';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  onImportPdf: (file: File) => void;
  onImportNotes: (files: readonly File[]) => void;
}

export function TopRail({
  state,
  dispatch,
  inspectorOpen,
  onToggleInspector,
  onImportPdf,
  onImportNotes,
}: Props) {
  const vertical = state.orientation === 'vertical';
  const pageCount = state.document?.pageCount ?? state.pages.length;
  return (
    <header className="doc-toolbar" role="toolbar" aria-label="Document tools">
      <div className="brand">
        <span className="brand-mark">Terikiki</span>
      </div>
      <div className="doc-identity">
        <span className="doc-title">{state.document?.title ?? 'No document'}</span>
        <span className="doc-meta">
          {pageCount > 0 ? `${pageCount} ${pageCount === 1 ? 'page' : 'pages'}` : 'Open a PDF'}
          {state.notes.length > 0
            ? ` · ${state.notes.length} ${state.notes.length === 1 ? 'note' : 'notes'}`
            : ''}
        </span>
      </div>
      <div className="tool-group" role="group" aria-label="Files">
        <FileBtn quiet label="Open PDF" accept="application/pdf" onFile={onImportPdf} />
        <FileBtn
          quiet
          label="Import notes"
          accept="image/*,image/svg+xml,.png,.jpg,.jpeg,.webp,.gif,.svg"
          multiple
          testId="import-notes"
          onFiles={onImportNotes}
        />
      </div>
      <div className="tool-group" role="group" aria-label="View">
        <InkBtn
          active={!vertical}
          title={vertical ? 'Pages stack; notes hang beside' : 'Pages sit in a row; notes hang below'}
          onClick={() =>
            dispatch({ type: 'set-orientation', orientation: vertical ? 'horizontal' : 'vertical' })
          }
        >
          {vertical ? 'Pages ↓' : 'Pages →'}
        </InkBtn>
        <span className="tool-kicker">Layers</span>
        <LayerToggles layers={state.layers} dispatch={dispatch} />
      </div>
      <div className="tool-group tool-group-end" role="group" aria-label="Inspector">
        <InkBtn active={inspectorOpen} testId="toggle-trail" onClick={onToggleInspector}>
          Trail
        </InkBtn>
      </div>
    </header>
  );
}
