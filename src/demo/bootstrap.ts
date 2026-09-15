/** Resolve a file under `public/` against Vite `base` (GitHub Pages `/Terikiki/`). */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\//, '')}`;
}

export const SAMPLE_PDF_URL = publicUrl('samples/lecture-coupled-notes.pdf');
export const SAMPLE_DOCUMENT_ID = 'sample:coupled-notes';
export const SAMPLE_DOCUMENT_TITLE = 'Paper Mechanics 01 — Coupled notes';

export const SAMPLE_NOTES = [
  {
    filename: 'note-beating.svg',
    url: publicUrl('samples/note-beating.svg'),
    title: 'Why beating?',
    caption: 'why does beating appear only when ω+ ≈ ω- ?  page 2',
    inkHints: ['?', 'why', 'page 2'],
  },
  {
    filename: 'note-envelope.svg',
    url: publicUrl('samples/note-envelope.svg'),
    title: 'Box the envelope',
    caption: 'box the envelope formula — EXPLAIN the coupling term. page 2 region',
    inkHints: ['box', 'EXPLAIN', 'region', 'page 2'],
  },
] as const;
