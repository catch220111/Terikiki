import { useEffect, useState } from 'react';
import { DeskProvider, useDesk } from './engine/DeskContext.tsx';
import { makeNote, makePdfPage } from './engine/selectors.ts';
import { loadPdfFromFile, loadPdfFromUrl, type LoadedPdf } from './pdf/loadPdf.ts';
import { detectMarks } from './marks/detectMarks.ts';
import { buildPrintableHtml, printHtml } from './export/printSheet.ts';
import { SAMPLE_DOCUMENT_ID, SAMPLE_DOCUMENT_TITLE, SAMPLE_NOTES, SAMPLE_PDF_URL } from './demo/bootstrap.ts';
import { DeskShell } from './ui/DeskShell.tsx';
import type { DeskAction } from './engine/deskState.ts';
import type { MatchingService } from './matching/service.ts';
import type { NoteCard, PdfPageCard } from './types/domain.ts';
import { fileToDataUrl, noteFromImage, partitionDroppedFiles } from './notes/importImage.ts';

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

function ingestHandwriting(
  note: NoteCard,
  pages: readonly PdfPageCard[],
  dispatch: (action: DeskAction) => void,
  matcher: MatchingService,
) {
  dispatch({ type: 'import-note', note });
  dispatch({ type: 'propose-matches', suggestions: [...matcher.suggestForNote(note, pages)] });
  dispatch({ type: 'propose-marks', marks: detectMarks(note) });
}

function DeskApp() {
  const { state, dispatch, ai, matcher } = useDesk();
  const [status, setStatus] = useState('Laying out the sample lecture…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdf = await loadPdfFromUrl(SAMPLE_PDF_URL, SAMPLE_DOCUMENT_ID, SAMPLE_DOCUMENT_TITLE);
        if (cancelled) return;
        await ingestPdf(pdf, dispatch, SAMPLE_PDF_URL);
        if (!cancelled) setStatus(`${SAMPLE_DOCUMENT_TITLE} · import a scan, then accept / reject / correct`);
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
      ingestHandwriting(note, state.pages, dispatch, matcher);
    }
  }, [dispatch, matcher, state.document, state.notes.length, state.pages]);

  async function onImportPdf(file: File) {
    setStatus(`Opening ${file.name}…`);
    const pdf = await loadPdfFromFile(file);
    await ingestPdf(pdf, dispatch, file.name);
    setStatus(`${pdf.title} on the desk`);
  }

  async function onImportNotes(files: readonly File[]) {
    const { notes, pdfs, skipped } = partitionDroppedFiles(files);
    if (pdfs[0] && notes.length === 0) {
      await onImportPdf(pdfs[0]);
      return;
    }
    let imported = 0;
    try {
      for (const file of notes) {
        const imageUrl = await fileToDataUrl(file);
        ingestHandwriting(noteFromImage(file, imageUrl), state.pages, dispatch, matcher);
        imported += 1;
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not read that note image.');
      return;
    }
    if (imported > 0) {
      setStatus(
        `Imported ${imported} handwritten ${imported === 1 ? 'leaf' : 'leaves'} — stub suggestions stay pending until you accept, reject, or correct.`,
      );
    } else if (skipped.length > 0 && !pdfs[0]) {
      setStatus('Drop a photographed or scanned note image (PNG, JPG, WebP, SVG).');
    }
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
      onImportNotes={onImportNotes}
      onDetectMarks={onDetectMarks}
      onExport={onExport}
      status={status}
    />
  );
}

export function App() {
  return (
    <DeskProvider>
      <DeskApp />
    </DeskProvider>
  );
}
