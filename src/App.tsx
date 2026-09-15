import { useEffect, useState } from 'react';
import { DeskProvider, useDesk } from './engine/DeskContext.tsx';
import { makeNote, makePdfPage } from './engine/selectors.ts';
import { loadPdfFromFile, loadPdfFromUrl, type LoadedPdf } from './pdf/loadPdf.ts';
import { suggestMatches } from './matching/stubMatcher.ts';
import { detectMarks } from './marks/detectMarks.ts';
import { buildPrintableHtml, printHtml } from './export/printSheet.ts';
import { SAMPLE_DOCUMENT_ID, SAMPLE_DOCUMENT_TITLE, SAMPLE_NOTES, SAMPLE_PDF_URL } from './demo/bootstrap.ts';
import { DeskShell } from './ui/DeskShell.tsx';
import type { DeskAction } from './engine/deskState.ts';

async function ingestPdf(pdf: LoadedPdf, dispatch: (action: DeskAction) => void, sourceUrl: string) {
  dispatch({
    type: 'hydrate-document',
    document: {
      id: pdf.documentId,
      title: pdf.title,
      sourceUrl,
      pageCount: pdf.pageCount,
    },
    pages: Array.from({ length: pdf.pageCount }, (_, pageIndex) =>
      makePdfPage({
        documentId: pdf.documentId,
        pageIndex,
        title: `Page ${pageIndex + 1}`,
        excerpt: '',
      }),
    ),
  });
  for (let pageIndex = 0; pageIndex < pdf.pageCount; pageIndex++) {
    const [canvas, text] = await Promise.all([pdf.getPageCanvas(pageIndex, 1.2), pdf.getPageText(pageIndex)]);
    const title = text.split(/[.!?]/)[0]?.trim().slice(0, 48) || `Page ${pageIndex + 1}`;
    dispatch({
      type: 'patch-page-image',
      pageId: `${pdf.documentId}:p${pageIndex}`,
      imageUrl: canvas.toDataURL('image/png'),
      excerpt: text,
      title,
    });
  }
}

function DeskApp() {
  const { state, dispatch, ai } = useDesk();
  const [status, setStatus] = useState('Laying out the sample lecture…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdf = await loadPdfFromUrl(SAMPLE_PDF_URL, SAMPLE_DOCUMENT_ID, SAMPLE_DOCUMENT_TITLE);
        if (cancelled) return;
        await ingestPdf(pdf, dispatch, SAMPLE_PDF_URL);
        if (!cancelled) setStatus(`${SAMPLE_DOCUMENT_TITLE} · pan the desk · Shift-select · accept matches yourself`);
      } catch (e) {
        if (!cancelled) setStatus(e instanceof Error ? e.message : 'Failed to load sample PDF');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!state.document || state.document.id !== SAMPLE_DOCUMENT_ID) return;
    if (state.notes.length > 0) return;
    if (state.pages.length === 0 || state.pages.some((page) => !page.excerpt)) return;
    for (const sample of SAMPLE_NOTES) {
      const note = makeNote({
        title: sample.title,
        caption: sample.caption,
        filename: sample.filename,
        imageUrl: sample.url,
        inkHints: sample.inkHints,
      });
      dispatch({ type: 'import-note', note });
      dispatch({ type: 'propose-matches', suggestions: suggestMatches(note, state.pages) });
      dispatch({ type: 'propose-marks', marks: detectMarks(note) });
    }
  }, [dispatch, state.document, state.notes.length, state.pages]);

  async function onImportPdf(file: File) {
    setStatus(`Opening ${file.name}…`);
    const pdf = await loadPdfFromFile(file);
    await ingestPdf(pdf, dispatch, file.name);
    setStatus(`${pdf.title} on the desk`);
  }

  async function onImportNote(file: File) {
    const imageUrl = await fileToDataUrl(file);
    const note = makeNote({
      title: file.name.replace(/\.[^.]+$/, ''),
      caption: file.name,
      filename: file.name,
      imageUrl,
    });
    dispatch({ type: 'import-note', note });
    dispatch({ type: 'propose-matches', suggestions: suggestMatches(note, state.pages) });
    dispatch({ type: 'propose-marks', marks: detectMarks(note) });
    setStatus(`Imported handwriting “${note.title}” — suggestions stay pending until you accept.`);
  }

  function onDetectMarks() {
    let added = 0;
    for (const note of state.notes) {
      const existing = new Set(state.marks.filter((m) => m.noteId === note.id).map((m) => m.kind));
      const fresh = detectMarks(note).filter((m) => !existing.has(m.kind));
      if (fresh.length === 0) continue;
      added += fresh.length;
      dispatch({ type: 'propose-marks', marks: fresh });
    }
    setStatus(
      added > 0
        ? `Detected ${added} mark(s). Confirm or dismiss them in the trail — nothing is committed yet.`
        : 'No new marks. Confirm or dismiss the pending ones in the trail.',
    );
  }

  function onExport() {
    const html = buildPrintableHtml(state);
    if (!printHtml(html)) setStatus('Could not open the print sheet.');
    else setStatus('Print dialog opened for the desk sheet.');
  }

  return (
    <DeskShell
      state={state}
      dispatch={dispatch}
      ai={ai}
      onImportPdf={onImportPdf}
      onImportNote={onImportNote}
      onDetectMarks={onDetectMarks}
      onExport={onExport}
      status={status}
    />
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read note image'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function App() {
  return (
    <DeskProvider>
      <DeskApp />
    </DeskProvider>
  );
}
