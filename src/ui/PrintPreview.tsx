interface Props {
  html: string;
  onClose: () => void;
  onPrint: () => void;
}

export function PrintPreview({ html, onClose, onPrint }: Props) {
  return (
    <div className="print-overlay" data-testid="print-preview" role="dialog" aria-label="Review packet">
      <div className="print-frame">
        <header className="print-toolbar">
          <div>
            <span className="print-wordmark">terikiki</span>
            <span className="print-toolbar-kicker">Review packet</span>
          </div>
          <div className="print-toolbar-actions">
            <button type="button" className="ink-btn" data-testid="send-to-printer" onClick={onPrint}>
              Send to printer
            </button>
            <button type="button" className="ink-btn" data-testid="close-print" onClick={onClose}>
              Close
            </button>
          </div>
        </header>
        <iframe className="print-sheet" title="Printable review packet" srcDoc={html} />
      </div>
    </div>
  );
}
