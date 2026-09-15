import { useEffect, useState, type Dispatch } from 'react';
import type { AiClient } from '../ai/client.ts';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { cardById } from '../engine/selectors.ts';
import { TopRail } from './TopRail.tsx';
import { SelectionTray } from './SelectionTray.tsx';
import { TrailStrip } from './TrailStrip.tsx';
import { MatrixViewport } from './MatrixViewport.tsx';
import { ThumbnailRail, ZoomFitBar } from './PageStrip.tsx';
import { AskPanel } from './AskPanel.tsx';
import { PrintPreview } from './PrintPreview.tsx';
import { pinModeForTool, pinToolHint, type ViewerTool } from './viewerTool.ts';

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

function selectedNoteId(state: DeskState): string | undefined {
  for (let i = state.selection.cardIds.length - 1; i >= 0; i--) {
    const id = state.selection.cardIds[i];
    if (!id) continue;
    const card = cardById(state, id);
    if (card?.kind === 'note') return card.id;
  }
  return undefined;
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
  const [tool, setTool] = useState<ViewerTool>('select');
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const detectedCount = state.marks.filter((mark) => mark.status === 'detected').length;

  const selectionKey = state.selection.cardIds.join('|');

  useEffect(() => {
    if (detectedCount > 0) setInspectorOpen(true);
  }, [detectedCount]);

  useEffect(() => {
    const mode = pinModeForTool(tool);
    if (!mode) return;
    if (state.anchorDraft?.suggestionId) return;
    const noteId = selectedNoteId(state);
    if (!noteId) return;
    if (state.anchorDraft?.noteId === noteId && state.anchorDraft.mode === mode) return;
    dispatch({ type: 'begin-anchor', noteId, mode });
    // Arm on tool/selection changes only — a completed pin must not immediately re-draft.
  }, [dispatch, selectionKey, tool]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (printHtml) {
        onClosePrint();
        return;
      }
      if (state.anchorDraft) {
        dispatch({ type: 'cancel-anchor' });
        setTool('select');
        return;
      }
      if (state.askOpen) {
        dispatch({ type: 'open-ask', open: false });
        return;
      }
      if (inspectorOpen) setInspectorOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, inspectorOpen, onClosePrint, printHtml, state.anchorDraft, state.askOpen]);

  function chooseTool(next: ViewerTool) {
    setTool(next);
    if (next === 'select') dispatch({ type: 'cancel-anchor' });
  }

  function armPin(noteId: string, mode: 'page' | 'region', suggestionId?: string) {
    setTool(mode === 'page' ? 'pin-page' : 'pin-region');
    dispatch({ type: 'begin-anchor', noteId, mode, suggestionId });
  }

  function detectMarks() {
    onDetectMarks();
    setInspectorOpen(true);
  }

  return (
    <div className="desk">
      <TopRail
        state={state}
        dispatch={dispatch}
        inspectorOpen={inspectorOpen}
        onToggleInspector={() => setInspectorOpen((open) => !open)}
        onImportPdf={onImportPdf}
        onImportNotes={onImportNotes}
        onDetectMarks={detectMarks}
        onExport={onExport}
      />
      <SelectionTray state={state} dispatch={dispatch} tool={tool} onChooseTool={chooseTool} />
      <ThumbnailRail state={state} dispatch={dispatch} />
      <MatrixViewport
        state={state}
        dispatch={dispatch}
        onImportNotes={onImportNotes}
        onArmPin={armPin}
        toolHint={state.anchorDraft ? null : pinToolHint(tool, Boolean(selectedNoteId(state)))}
      />
      <ZoomFitBar state={state} dispatch={dispatch} />
      {inspectorOpen && (
        <TrailStrip state={state} dispatch={dispatch} onTuck={() => setInspectorOpen(false)} />
      )}
      <AskPanel state={state} dispatch={dispatch} ai={ai} />
      <div className="status-bar">{status}</div>
      {printHtml && <PrintPreview html={printHtml} onClose={onClosePrint} onPrint={onSendToPrinter} />}
    </div>
  );
}
