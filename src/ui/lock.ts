/**
 * VL v1 + v1.1 chrome lock. Tokens and shell only — Stage 1–4 behavior stays.
 * Walnut / cream / gold / vermillion craft desk stays retired.
 * Ask stays a Pull/Tuck overlay; the matrix stays the spatial center.
 *
 * v1 named tokens are the closed set below. `--stage` is the v1.1 page-paper
 * role, not a v1 token.
 */
export const VL_V1_TOKENS = [
  '--bg',
  '--surface',
  '--border',
  '--text',
  '--muted',
  '--accent',
  '--hand',
  '--ai',
  '--pdf',
  '--danger',
] as const;

export const CARD_WIDTH_PX = {
  note: 312,
  pdf: 204,
  ai: 168,
} as const;

export const CARD_RADIUS_PX = {
  note: 12,
  pdf: 8,
  ai: 8,
} as const;

const CRAFT_CHROME = /Palatino|walnut|washi|--vermillion|#c23b22|#c4a35a|#1b1410|#f4ead4|#f3ead6|note-tape|--rot\b|rotate\(/;

export function missingVlV1Tokens(css: string): string[] {
  return VL_V1_TOKENS.filter((token) => !css.includes(`${token}:`));
}

export function craftChromeLeaks(css: string, noteSrc: string, printSrc: string): string[] {
  const leaked: string[] = [];
  if (CRAFT_CHROME.test(css)) leaked.push('desk.css');
  if (noteSrc.includes('note-tape')) leaked.push('note-tape');
  if (/Palatino|#f4ead4|#f3ead6/.test(printSrc)) leaked.push('print-sheet');
  return leaked;
}

export function cardWidthPx(css: string, kind: 'note' | 'pdf' | 'ai'): number | null {
  const match = css.match(new RegExp(`\\.paper-card\\.${kind}\\s*\\{[^}]*width:\\s*(\\d+)px`, 's'));
  if (!match?.[1]) return null;
  return Number(match[1]);
}

export function cardRadiusPx(css: string, kind: 'note' | 'pdf' | 'ai'): number | null {
  const kindMatch = css.match(new RegExp(`\\.paper-card\\.${kind}\\s*\\{[^}]*border-radius:\\s*(\\d+)px`, 's'));
  if (kindMatch?.[1]) return Number(kindMatch[1]);
  const token = css.match(/--radius:\s*(\d+)px/);
  if (!token?.[1]) return null;
  return Number(token[1]);
}

export function cardRadiusInBand(css: string): boolean {
  for (const kind of ['note', 'pdf', 'ai'] as const) {
    const radius = cardRadiusPx(css, kind);
    if (radius === null || radius < 8 || radius > 12) return false;
  }
  return true;
}

/** Handwriting tiles must dominate PDF and AI in the matrix. */
export function handwritingHasSizePrimacy(css: string): boolean {
  const note = cardWidthPx(css, 'note');
  const pdf = cardWidthPx(css, 'pdf');
  const ai = cardWidthPx(css, 'ai');
  if (note === null || pdf === null || ai === null) return false;
  return note > pdf && note > ai;
}

/** Script faces are for command-mark glyphs only, not chrome or the wordmark. */
export function scriptUsedOutsideGlyphs(css: string): string[] {
  const leaked: string[] = [];
  const re = /([^{}]+)\{[^{}]*font-family:\s*var\(--script\)[^{}]*\}/g;
  for (const match of css.matchAll(re)) {
    const selector = (match[1] ?? '').trim();
    if (!selector.split(',').every((part) => part.trim().includes('.glyph'))) leaked.push(selector);
  }
  return leaked;
}

export function brandMarkIsCraftScript(css: string): boolean {
  const block = css.match(/\.brand-mark\s*\{([^}]+)\}/);
  if (!block?.[1]) return true;
  const body = block[1];
  return /font-style:\s*italic/.test(body) || /var\(--script\)/.test(body) || /Palatino/.test(body);
}

export function askPanelIsFlatSheet(css: string): boolean {
  const block = css.match(/\.ask-panel\s*\{([^}]+)\}/);
  if (!block?.[1]) return false;
  const body = block[1];
  return (
    body.includes('var(--surface)') &&
    !/backdrop-filter/.test(body) &&
    !/rotate\(/.test(body) &&
    !/var\(--paper\)/.test(body)
  );
}

/** Ask overlays the matrix. It is not a dedicated chat-rail column. */
export function askRemainsMatrixOverlay(css: string): boolean {
  const ask = css.match(/\.ask-panel\s*\{([^}]+)\}/);
  const desk = css.match(/\.desk\s*\{([^}]+)\}/);
  if (!ask?.[1] || !desk?.[1]) return false;
  return (
    /grid-area:\s*matrix/.test(ask[1]) &&
    /thumbs/.test(desk[1]) &&
    /matrix/.test(desk[1]) &&
    /zoom/.test(desk[1]) &&
    !/ask-rail|chat-rail/.test(css)
  );
}

/** Connectors are a thin solid stroke at ~30–40% opacity. */
export function connectorStrokeOutsideBand(css: string): boolean {
  const mix = css.match(/\.connectors\s+path\s*\{[^}]*color-mix\(in srgb,\s*var\(--accent\)\s+(\d+)%/s);
  if (!mix?.[1]) return true;
  const pct = Number(mix[1]);
  return pct < 30 || pct > 40;
}

/** Lines appear for selection and hover only — not citation auto-drive. */
export function connectorsAreSelectHoverOnly(connectorSrc: string): boolean {
  return (
    connectorSrc.includes('state.selection.cardIds') &&
    connectorSrc.includes('state.hoverCardId') &&
    !connectorSrc.includes('lastTurnCitedIds')
  );
}

/** Document toolbar groups files, view, and actions — not a marketing masthead. */
export function toolbarIsDocumentApp(railSrc: string): boolean {
  return (
    railSrc.includes('doc-toolbar') &&
    railSrc.includes('tool-group') &&
    railSrc.includes('Open PDF') &&
    railSrc.includes('Import notes') &&
    railSrc.includes('Detect marks') &&
    railSrc.includes('Print') &&
    railSrc.includes('Pull Ask') &&
    railSrc.includes('LayerToggles') &&
    railSrc.includes('set-orientation') &&
    !railSrc.includes('brand-promise')
  );
}

/** Page strip is a notebook navigator: jump via focus, zoom via camera. It does not gather Ask. */
export function pageStripIsReadingChrome(stripSrc: string): boolean {
  return (
    stripSrc.includes("type: 'focus-card'") &&
    stripSrc.includes("type: 'set-zoom'") &&
    stripSrc.includes("type: 'set-camera'") &&
    stripSrc.includes('data-testid="page-strip"') &&
    stripSrc.includes('data-testid="zoom-fit-bar"') &&
    !stripSrc.includes("type: 'select-card'") &&
    !stripSrc.includes("type: 'open-ask'")
  );
}

function ruleBodyContaining(css: string, className: string): string {
  const match = css.match(new RegExp(`[^#{]*\\.${className}\\b[^{]*\\{([^}]+)\\}`));
  return match?.[1] ?? '';
}

const TOOL_CHROME_SURFACES = [
  'doc-toolbar',
  'thumb-rail',
  'zoom-fit-bar',
  'trail-drawer',
  'ask-panel',
  'annotation-strip',
] as const;

/**
 * VL v1.1 dual surface: toolbar / rails / inspectors use `--surface`.
 * The page stage uses a lighter `--stage` paper. `--stage` is not a v1 token.
 */
export function dualSurfaceRoles(css: string): boolean {
  if ((VL_V1_TOKENS as readonly string[]).includes('--stage')) return false;
  if (!/--stage:\s*#/.test(css) || /#f4ead4|#f3ead6|#1b1410/.test(css)) return false;
  for (const name of TOOL_CHROME_SURFACES) {
    if (!ruleBodyContaining(css, name).includes('var(--surface)')) return false;
  }
  return ruleBodyContaining(css, 'matrix-viewport').includes('var(--stage)');
}

/** VL v1.1 layout: thumbnail rail, zoom/fit bar, segmented strip, collapsed trail. */
export function vlV11LayoutMissing(
  css: string,
  stripSrc: string,
  traySrc: string,
  shellSrc: string,
): string[] {
  const missing: string[] = [];
  if (!css.includes('.thumb-rail') || !stripSrc.includes('thumb-rail')) missing.push('thumbnail-rail');
  if (!css.includes('.zoom-fit-bar') || !stripSrc.includes('zoom-fit-bar')) missing.push('zoom-fit-bar');
  if (!css.includes('.segmented') || !traySrc.includes('segmented')) missing.push('segmented-tool-strip');
  if (!trailIsCollapsedInspector(css, shellSrc)) missing.push('collapsed-inspector');
  return missing;
}

/** Trail/marks live in a tucked overlay drawer, not a permanent notes column. */
export function trailIsCollapsedInspector(css: string, shellSrc: string): boolean {
  const desk = css.match(/\.desk\s*\{([^}]+)\}/);
  return (
    Boolean(desk?.[1]?.includes('thumbs')) &&
    !/grid-template-areas:[\s\S]*notes/.test(desk?.[1] ?? '') &&
    css.includes('.trail-drawer') &&
    /grid-area:\s*matrix/.test(css.match(/\.trail-drawer\s*\{([^}]+)\}/)?.[1] ?? '') &&
    shellSrc.includes('inspectorOpen') &&
    shellSrc.includes('TrailStrip')
  );
}

/** Manual pin is an active viewer tool — not a form on every note leaf. */
export function pinChromeIsNotOnLeaves(noteSrc: string): boolean {
  return !noteSrc.includes('pin-to-page') && !noteSrc.includes('pin-to-region') && !noteSrc.includes('pin-actions');
}

export function pinDrivenByActiveTool(stripSrc: string): boolean {
  return (
    stripSrc.includes('pin-to-page') &&
    stripSrc.includes('pin-region') &&
    stripSrc.includes('segmented') &&
    stripSrc.includes('ViewerTool')
  );
}
