import { useEffect, useState } from 'react';
import { DocumentMatrix } from './matrix/DocumentMatrix';
import { loadPdfFromUrl, type LoadedPdf } from './pdf/loadPdf';
import { StubMatchingService } from './services/matching';
import { StubThinkingTrail } from './services/thinkingTrail';

/** Stage 1 wires stubs so boundaries exist; no UI for matching/trail yet. */
const matching = new StubMatchingService();
const trail = new StubThinkingTrail();
void matching;
void trail;

export function App() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Tiny public sample PDF (1 page) for Stage 1 boot demo.
        const loaded = await loadPdfFromUrl(
          'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
          'sample:tracemonkey',
        );
        if (!cancelled) setPdf(loaded);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load PDF');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app">
      {error && <div className="banner error">{error}</div>}
      {loading && !pdf && <div className="banner">Loading sample PDF…</div>}
      <DocumentMatrix pdf={pdf} />
    </div>
  );
}
