import { useEffect, type Dispatch } from 'react';
import type { AiClient } from '../ai/client.ts';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { detectMarks } from '../marks/detectMarks.ts';
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
  onExport: () => void;
  status: string;
}

export function DeskShell({ state, dispatch, ai, onImportPdf, onImportNote, onExport, status }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dispatch({ type: 'cancel-anchor' });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  function onDetectMarks() {
    for (const note of state.notes) {
      const existing = new Set(state.marks.filter((m) => m.noteId === note.id).map((m) => m.kind));
      const fresh = detectMarks(note).filter((m) => !existing.has(m.kind));
      if (fresh.length > 0) dispatch({ type: 'propose-marks', marks: fresh });
    }
  }

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
