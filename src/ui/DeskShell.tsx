import { useEffect, type Dispatch } from 'react';
import type { AiClient } from '../ai/client.ts';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { TopRail } from './TopRail.tsx';
import { SelectionTray } from './SelectionTray.tsx';
import { TrailStrip } from './TrailStrip.tsx';
import { MatrixViewport } from './MatrixViewport.tsx';
import { PageStrip } from './PageStrip.tsx';
import { AskPanel } from './AskPanel.tsx';
import { PrintPreview } from './PrintPreview.tsx';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
  ai: AiClient;
  onImportPdf: (file: File) => void;
  onImportNotes: (files: readonly File[]) => void;
  onDetectMarks: () => void;
  onExport: () => void;
  printHtml: string | null;
  onClosePrint: () => void;
  onSendToPrinter: (ok: boolean) => void;
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
  printHtml,
  onClosePrint,
  onSendToPrinter,
  status,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (printHtml) {
        onClosePrint();
        return;
      }
      if (state.anchorDraft) {
        dispatch({ type: 'cancel-anchor' });
        return;
      }
      if (state.askOpen) dispatch({ type: 'open-ask', open: false });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, onClosePrint, printHtml, state.anchorDraft, state.askOpen]);

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
      <PageStrip state={state} dispatch={dispatch} />
      <AskPanel state={state} dispatch={dispatch} ai={ai} />
      <div className="status-bar">{status}</div>
      {printHtml && <PrintPreview html={printHtml} onClose={onClosePrint} onPrint={onSendToPrinter} />}
    </div>
  );
}
