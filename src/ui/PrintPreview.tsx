import { useRef } from 'react';
import { printIframe } from '../export/printSheet.ts';

interface Props {
  html: string;
  onClose: () => void;
  onPrint: (ok: boolean) => void;
}

export function PrintPreview({ html, onClose, onPrint }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  return (
    <div className="print-overlay" data-testid="print-preview" role="dialog" aria-label="Print sheet">
      <div className="print-frame">
        <header className="print-toolbar">
          <div>
            <span className="print-wordmark">terikiki</span>
            <span className="print-toolbar-kicker">Print sheet</span>
          </div>
          <div className="print-toolbar-actions">
            <button
              type="button"
              className="ink-btn"
              data-testid="send-to-printer"
              onClick={() => onPrint(printIframe(frameRef.current))}
            >
              Send to printer
            </button>
            <button type="button" className="ink-btn" data-testid="close-print" onClick={onClose}>
              Close
            </button>
          </div>
        </header>
        <iframe
          ref={frameRef}
          className="print-sheet"
          title="Print sheet"
          srcDoc={html}
        />
      </div>
    </div>
  );
}
