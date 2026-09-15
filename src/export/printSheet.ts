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
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif;
    color: #1d1d1f;
    background: #f5f5f7;
    margin: 0;
    letter-spacing: -0.011em;
  }
  .packet { padding: 32px 36px 52px; }
  .wordmark {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", system-ui, sans-serif;
    font-weight: 600;
    font-size: 1.45rem;
    letter-spacing: -0.04em;
    margin: 0;
    color: #1d1d1f;
  }
  .promise {
    margin: 0.2rem 0 0;
    font-size: 0.78rem;
    color: #6e6e73;
  }
  .sheet-kicker {
    margin: 0.95rem 0 0;
    font-size: 0.8rem;
    color: #86868b;
  }
  .sheet {
    margin-top: 1.7rem;
    padding-top: 1.15rem;
    border-top: 1px solid #e5e5ea;
    break-inside: avoid;
  }
  .page-sheet { break-inside: avoid; }
  .working { break-inside: avoid; }
  h2 {
    font-size: 1.05rem;
    margin: 0 0 0.9rem;
    font-weight: 600;
    letter-spacing: -0.03em;
  }
  .spread {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(12rem, 0.85fr);
    gap: 1.15rem;
    align-items: start;
  }
  .printed {
    background: #fff;
    border: 1px solid #e5e5ea;
    border-radius: 12px;
    padding: 0.75rem 0.8rem 0.9rem;
  }
  .printed img {
    width: 100%;
    max-height: 420px;
    object-fit: contain;
    background: #fff;
    border: 1px solid #ececec;
    border-radius: 8px;
  }
  .printed .excerpt {
    margin: 0.65rem 0 0;
    font-size: 0.9rem;
    line-height: 1.45;
    white-space: pre-wrap;
    color: #3a3a3c;
  }
  .kicker {
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #8e8e93;
    margin: 0 0 0.4rem;
    font-weight: 600;
  }
  .margin {
    min-height: 12rem;
    background: #f4fffc;
    border: 1px solid color-mix(in srgb, #32d4c8 22%, #e5e5ea);
    border-left: 3px solid #32d4c8;
    border-radius: 12px;
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
    letter-spacing: -0.02em;
  }
  .hang p { margin: 0.3rem 0 0; font-size: 0.86rem; color: #6e6e73; }
  .hang.ai { border-left: 2px solid #0a84ff; padding-left: 0.55rem; opacity: 0.92; }
  .hang.ai h3 { font-size: 0.88rem; }
  .marks { color: #ff453a; font-family: "Segoe Script", "Bradley Hand", "Apple Chancery", cursive; font-style: normal; }
  .blank { color: #8e8e93; font-size: 0.88rem; }
  .trail-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.28rem 0.55rem;
    list-style: none;
    margin: 1.15rem 0 0;
    padding: 0.55rem 0 0;
    border-top: 1px solid #e5e5ea;
    font-size: 0.76rem;
  }
  .trail-strip li {
    display: inline-flex;
    align-items: baseline;
    gap: 0.28rem;
    margin: 0;
    white-space: nowrap;
  }
  .trail-strip .idx { color: #8e8e93; font-size: 0.68rem; }
  .trail-kicker {
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #8e8e93;
    margin: 1.15rem 0 0;
    font-weight: 600;
  }
  .voice-ink { color: #0f766e; }
  .voice-ai { color: #0a84ff; }
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
      ${notes || '<p class="blank">Blank margin — pin a note to hang it here.</p>'}
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
      <h1 class="wordmark">Terikiki</h1>
      <p class="promise">Write on paper. Keep everything connected.</p>
      <p class="sheet-kicker">Print sheet · ${escapeHtml(title)}</p>
    </header>
    ${pageBlocks || '<p class="blank">No PDF pages on this desk.</p>'}
    <section class="sheet working">
      <p class="kicker">Unpinned notes</p>
      ${loose || '<p class="blank">No unpinned notes — every note is hanging in a printed margin.</p>'}
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
