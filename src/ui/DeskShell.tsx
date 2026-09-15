import { useEffect, type Dispatch } from 'react';
import type { AiClient } from '../ai/client.ts';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { TopRail } from './TopRail.tsx';
import { SelectionTray } from './SelectionTray.tsx';
import { TrailStrip } from './TrailStrip.tsx';
import { MatrixViewport } from './MatrixViewport.tsx';
import { AskPanel } from './AskPanel.tsx';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
  ai: AiClient;
  onImportPdf: (file: File) => void;
  onImportNotes: (files: readonly File[]) => void;
  onDetectMarks: () => void;
  onExport: () => void;
  status: string;
}

export function DeskShell({
  state,
  dispatch,
  ai,
  onImportPdf,
  onImportNotes,
  onDetectMarks,
  onExport,
  status,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (state.anchorDraft) {
        dispatch({ type: 'cancel-anchor' });
        return;
      }
      if (state.askOpen) dispatch({ type: 'open-ask', open: false });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, state.anchorDraft, state.askOpen]);

  return (
    <div className="desk">
      <TopRail
        state={state}
        dispatch={dispatch}
        onImportPdf={onImportPdf}
        onImportNotes={onImportNotes}
        onDetectMarks={onDetectMarks}
        onExport={onExport}
      />
      <TrailStrip state={state} dispatch={dispatch} />
      <SelectionTray state={state} dispatch={dispatch} />
      <MatrixViewport state={state} dispatch={dispatch} onImportNotes={onImportNotes} />
      <AskPanel state={state} dispatch={dispatch} ai={ai} />
      <div className="status-bar">{status}</div>
    </div>
  );
}
