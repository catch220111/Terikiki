import type { Dispatch } from 'react';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { InkBtn, LayerToggles, FileBtn } from './LayerToggles.tsx';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
  onImportPdf: (file: File) => void;
  onImportNotes: (files: readonly File[]) => void;
  onDetectMarks: () => void;
  onExport: () => void;
}

export function TopRail({ state, dispatch, onImportPdf, onImportNotes, onDetectMarks, onExport }: Props) {
  const vertical = state.orientation === 'vertical';
  return (
    <header className="top-rail">
      <div className="brand">
        <span className="brand-mark">terikiki</span>
        <span className="brand-promise">Write on paper. Keep everything connected.</span>
      </div>
      <div className="rail-tools">
        <InkBtn
          active={!vertical}
          onClick={() =>
            dispatch({ type: 'set-orientation', orientation: vertical ? 'horizontal' : 'vertical' })
          }
        >
          {vertical ? 'PDF ↓  notes →' : 'PDF →  notes ↓'}
        </InkBtn>
        <LayerToggles layers={state.layers} dispatch={dispatch} />
      </div>
      <div className="rail-files">
        <FileBtn label="Open PDF" accept="application/pdf" onFile={onImportPdf} />
        <FileBtn
          label="Import notes"
          accept="image/*,image/svg+xml,.png,.jpg,.jpeg,.webp,.gif,.svg"
          multiple
          testId="import-notes"
          onFiles={onImportNotes}
        />
        <InkBtn onClick={onDetectMarks}>Detect marks</InkBtn>
        <InkBtn onClick={onExport}>Print desk</InkBtn>
        <InkBtn active={state.askOpen} onClick={() => dispatch({ type: 'open-ask', open: !state.askOpen })}>
          {state.askOpen ? 'Tuck Ask' : 'Pull Ask'}
        </InkBtn>
      </div>
    </header>
  );
}
