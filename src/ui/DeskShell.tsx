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
  onImportNote: (file: File) => void;
  onDetectMarks: () => void;
  onExport: () => void;
  status: string;
}

export function DeskShell({
  state,
  dispatch,
  ai,
  onImportPdf,
  onImportNote,
  onDetectMarks,
  onExport,
  status,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dispatch({ type: 'cancel-anchor' });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  return (
    <div className="desk">
      <TopRail
        state={state}
        dispatch={dispatch}
        onImportPdf={onImportPdf}
        onImportNote={onImportNote}
        onDetectMarks={onDetectMarks}
        onExport={onExport}
      />
      <TrailStrip state={state} dispatch={dispatch} />
      <SelectionTray state={state} dispatch={dispatch} />
      <MatrixViewport state={state} dispatch={dispatch} />
      <AskPanel state={state} dispatch={dispatch} ai={ai} />
      <div className="status-bar">{status}</div>
    </div>
  );
}
