import { cardLayer, isLayerVisible } from '../types/domain.ts';
import { allCards, confirmedMarksFor, labelForCard, looseCards } from '../engine/selectors.ts';
import { orderedTrail, trailKindLabel, trailVoice } from '../trail/events.ts';
import type { DeskState } from '../engine/deskState.ts';
import type { MatrixCard } from '../types/domain.ts';

const PRINT_STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body {
    font-family: Palatino, "Iowan Old Style", "Palatino Linotype", Georgia, serif;
    color: #1a1714;
    background: #f4ead4;
    margin: 0;
  }
  .packet { padding: 28px 32px 48px; }
  .wordmark {
    font-family: Palatino, "Iowan Old Style", Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-size: 1.85rem;
    letter-spacing: 0.01em;
    margin: 0;
    color: #1a1714;
  }
  .promise {
    margin: 0.15rem 0 0;
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #8a6a28;
  }
  .sheet-kicker {
    margin: 0.85rem 0 0;
    font-size: 0.82rem;
    color: #6b655c;
  }
  .sheet {
    margin-top: 1.6rem;
    padding-top: 1.1rem;
    border-top: 1px dashed #cbbfa8;
    break-inside: avoid;
  }
  .page-sheet { break-inside: avoid; }
  .working { break-inside: avoid; }
  h2 {
    font-size: 1.05rem;
    margin: 0 0 0.85rem;
    font-weight: 600;
  }
  .spread {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(12rem, 0.85fr);
    gap: 1.1rem;
    align-items: start;
  }
  .printed {
    background: #efe6d2;
    border: 1px solid #d7cbb3;
    padding: 0.7rem 0.75rem 0.85rem;
  }
  .printed img {
    width: 100%;
    max-height: 420px;
    object-fit: contain;
    background: #fffdf6;
    border: 1px solid #cbbfa8;
  }
  .printed .excerpt {
    margin: 0.65rem 0 0;
    font-size: 0.92rem;
    line-height: 1.45;
    white-space: pre-wrap;
  }
  .kicker {
    font-size: 0.64rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #7a6a55;
    margin: 0 0 0.4rem;
  }
  .margin {
    min-height: 12rem;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.45), transparent 24%),
      repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(90,70,40,0.14) 28px),
      #f7f1e4;
    border-left: 3px solid #27563b;
    padding: 0.75rem 0.8rem 1rem;
  }
  .hang {
    margin: 0 0 0.95rem;
    padding: 0;
    background: transparent;
    border: 0;
  }
  .hang h3 {
    margin: 0;
    font-size: 1rem;
  }
  .hang p { margin: 0.3rem 0 0; font-style: italic; font-size: 0.88rem; color: #5c4c3c; }
  .hang.ai { border-left: 2px solid #24356b; padding-left: 0.55rem; opacity: 0.9; }
  .hang.ai h3 { font-size: 0.88rem; }
  .marks { color: #c23b22; font-family: "Segoe Script", "Bradley Hand", "Apple Chancery", cursive; font-style: normal; }
  .blank { color: #8a7b66; font-style: italic; font-size: 0.9rem; }
  .trail-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.28rem 0.55rem;
    list-style: none;
    margin: 1.15rem 0 0;
    padding: 0.55rem 0 0;
    border-top: 1px dashed #cbbfa8;
    font-size: 0.78rem;
  }
  .trail-strip li {
    display: inline-flex;
    align-items: baseline;
    gap: 0.28rem;
    margin: 0;
    white-space: nowrap;
  }
  .trail-strip .idx { color: #8a6a28; font-size: 0.68rem; }
  .trail-kicker {
    font-size: 0.64rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #7a6a55;
    margin: 1.15rem 0 0;
  }
  .voice-ink { color: #27563b; font-style: italic; }
  .voice-ai { color: #24356b; font-style: italic; }
  @media print {
    body { background: white; }
    .packet { padding: 0; }
  }
`;

export function buildPrintableHtml(state: DeskState): string {
  const title = state.document?.title ?? 'Untitled desk';
  const pageBlocks = state.pages
    .map((page) => {
      const hanging = state.anchors
        .filter((a) => a.target.pageIndex === page.pageIndex)
        .map((a) => allCards(state).find((c) => c.id === a.cardId))
        .filter((c): c is MatrixCard => c !== undefined)
        .filter((c, index, list) => list.findIndex((other) => other.id === c.id) === index)
        .filter((c) => {
          const layer = cardLayer(c);
          return isLayerVisible(state.layers, layer.origin, layer.type);
        });
      const notes = hanging.map((card) => hangArticle(state, card)).join('');
      const img = page.imageUrl ? `<img src="${page.imageUrl}" alt="${escapeHtml(page.title)}" />` : '';
      const excerpt = clip(page.excerpt);
      return `<section class="sheet page-sheet" data-print-page="${page.pageIndex}">
  <h2>p${page.pageIndex + 1}. ${escapeHtml(page.title)}</h2>
  <div class="spread">
    <div class="printed">
      <p class="kicker">Printed evidence</p>
      ${img}
      <p class="excerpt">${excerpt ? escapeHtml(excerpt) : 'No extracted excerpt on this page.'}</p>
    </div>
    <aside class="margin">
      <p class="kicker">Handwritten margin</p>
      ${notes || '<p class="blank">Blank margin — pin a leaf to hang notes here.</p>'}
    </aside>
  </div>
</section>`;
    })
    .join('');

  const loose = looseCards(state)
    .filter((card) => {
      const layer = cardLayer(card);
      return isLayerVisible(state.layers, layer.origin, layer.type);
    })
    .map((card) => hangArticle(state, card))
    .join('');

  const trail = orderedTrail(state.trail);
  const strip = trail
    .map((event, index) => {
      const voice = trailVoice(event.fromAi);
      return `<li data-trail-kind="${escapeHtml(event.kind)}" data-from-ai="${event.fromAi ? 'true' : 'false'}" data-card="${escapeHtml(event.cardId)}"><span class="idx">${index + 1}.</span> ${escapeHtml(trailKindLabel(event.kind))} <em class="voice-${voice}">(${voice === 'ai' ? 'AI' : 'ink'})</em></li>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Terikiki — ${escapeHtml(title)}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <article class="packet" data-testid="print-sheet">
    <header>
      <h1 class="wordmark">terikiki</h1>
      <p class="promise">Write on paper. Keep everything connected.</p>
      <p class="sheet-kicker">Print sheet · ${escapeHtml(title)}</p>
    </header>
    ${pageBlocks || '<p class="blank">No PDF pages on this desk.</p>'}
    <section class="sheet working">
      <p class="kicker">Loose leaves</p>
      ${loose || '<p class="blank">No loose leaves — every note is hanging in a printed margin.</p>'}
    </section>
    ${
      strip
        ? `<p class="trail-kicker">Thinking trail</p><ol class="trail-strip">${strip}</ol>`
        : ''
    }
  </article>
</body>
</html>`;
}

function hangArticle(state: DeskState, card: MatrixCard): string {
  const marks = confirmedMarksFor(state, card.id)
    .map((m) => m.glyph)
    .join(' ');
  const voice = card.kind === 'ai' ? 'ai' : 'ink';
  return `<article class="hang${voice === 'ai' ? ' ai' : ''}" data-voice="${voice}" data-card="${escapeHtml(card.id)}"><h3>${escapeHtml(labelForCard(card))}${marks ? ` <span class="marks">${escapeHtml(marks)}</span>` : ''} <em class="voice-${voice}">(${voice === 'ai' ? 'AI' : 'ink'})</em></h3><p>${escapeHtml(excerptOf(card))}</p></article>`;
}

function excerptOf(card: MatrixCard): string {
  switch (card.kind) {
    case 'pdf-page':
      return clip(card.excerpt);
    case 'note':
      return clip(card.caption);
    case 'ai':
      return clip(card.body);
    default: {
      const _never: never = card;
      return _never;
    }
  }
}

function clip(value: string, max = 720): string {
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Print the given iframe. Never window.open. */
export function printIframe(iframe: HTMLIFrameElement | null): boolean {
  const win = iframe?.contentWindow;
  if (!win) return false;
  win.focus();
  win.print();
  return true;
}

/** Hidden iframe print path (no popup). Prefer printing a visible preview iframe when one exists. */
export function printHtml(html: string): boolean {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    return false;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const cleanup = () => iframe.remove();
  iframe.contentWindow?.addEventListener('afterprint', cleanup);
  return printIframe(iframe);
}
