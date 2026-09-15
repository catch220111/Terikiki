import { cardLayer, isLayerVisible } from '../types/domain.ts';
import { allCards, labelForCard } from '../engine/selectors.ts';
import type { DeskState } from '../engine/deskState.ts';

export function buildPrintableHtml(state: DeskState): string {
  const title = state.document?.title ?? 'Untitled desk';
  const pageBlocks = state.pages
    .map((page) => {
      const hanging = state.anchors
        .filter((a) => a.target.pageIndex === page.pageIndex)
        .map((a) => allCards(state).find((c) => c.id === a.cardId))
        .filter((c) => c !== undefined)
        .filter((c) => {
          const layer = cardLayer(c);
          return isLayerVisible(state.layers, layer.origin, layer.type);
        });
      const notes = hanging
        .map((card) => {
          const marks = state.marks
            .filter((m) => m.noteId === card.id && m.status === 'confirmed')
            .map((m) => m.glyph)
            .join(' ');
          return `<article class="hang"><h3>${escapeHtml(labelForCard(card))}${marks ? ` <span class="marks">${escapeHtml(marks)}</span>` : ''}</h3><p>${escapeHtml(excerptOf(card))}</p></article>`;
        })
        .join('');
      const img = page.imageUrl ? `<img src="${page.imageUrl}" alt="${escapeHtml(page.title)}" />` : '';
      return `<section class="page"><h2>p${page.pageIndex + 1}. ${escapeHtml(page.title)}</h2>${img}<p class="excerpt">${escapeHtml(page.excerpt)}</p>${notes}</section>`;
    })
    .join('');

  const trail = state.trail
    .map((event) => {
      const ai = event.fromAi ? ' <em>(AI)</em>' : '';
      return `<li><time>${escapeHtml(event.at)}</time> ${escapeHtml(event.kind)}${ai} — ${escapeHtml(event.summary)}</li>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Terikiki — ${escapeHtml(title)}</title>
  <style>
    body { font-family: Palatino, "Iowan Old Style", serif; color: #1a1714; background: #f7f1e4; margin: 24px; }
    h1 { font-size: 1.4rem; letter-spacing: 0.08em; text-transform: lowercase; }
    h2 { font-size: 1.1rem; margin-top: 2rem; }
    img { max-width: 100%; border: 1px solid #cbbfa8; }
    .lede { color: #6b655c; }
    .hang { border-left: 3px solid #c23b22; padding-left: 12px; margin: 12px 0; }
    .marks { color: #c23b22; font-family: ui-monospace, monospace; }
    .trail { font-size: 0.9rem; }
    time { color: #6b655c; }
    @media print { body { background: white; } }
  </style>
</head>
<body>
  <h1>terikiki</h1>
  <p class="lede">Write on paper. Keep everything connected. — ${escapeHtml(title)}</p>
  ${pageBlocks || '<p>No PDF pages on this desk.</p>'}
  <h2>Thinking trail</h2>
  <ol class="trail">${trail || '<li>Empty trail.</li>'}</ol>
</body>
</html>`;
}

function excerptOf(card: ReturnType<typeof allCards>[number]): string {
  switch (card.kind) {
    case 'pdf-page':
      return card.excerpt;
    case 'note':
      return card.caption;
    case 'ai':
      return card.body;
    default: {
      const _never: never = card;
      return _never;
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Print without window.open (avoids popup blockers). */
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
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) {
    iframe.remove();
    return false;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const cleanup = () => iframe.remove();
  win.addEventListener('afterprint', cleanup);
  win.focus();
  win.print();
  return true;
}
