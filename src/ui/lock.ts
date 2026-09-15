/**
 * VL v1.2 Chromium-reader (Galvez IA + Valentina VL). Tokens and shell only —
 * Stage 1–4 behavior stays. Soft residuals stay backlog.
 *
 * - Keep v1 tokens + v1.1 PDF-editor tools; no craft regress.
 * - Document-first centered continuous PDF reading column on quiet gutter.
 * - `--stage` nearer white page paper; default camera frames the reading column.
 * - Horizontal bottom page filmstrip (silhouettes, restrained `--accent`).
 * - Thumb click glides 180–280ms ease-out, no bounce.
 * - Filmstrip idle fade 1.2–2s; prefers-reduced-motion: instant jump, static strip, no animated highlight.
 * - Valentina: filmstrip is the only saturated navigator; anonymous quiet page stage; handwriting is the only warm accent; no SaaS chrome.
 * - Handwriting size primacy unchanged. Ask stays Pull/Tuck.
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

/** Document toolbar groups quieter files, view, and Trail — not a marketing masthead. */
export function toolbarIsDocumentApp(railSrc: string): boolean {
  return (
    railSrc.includes('doc-toolbar') &&
    railSrc.includes('tool-group') &&
    railSrc.includes('Open PDF') &&
    railSrc.includes('Import notes') &&
    railSrc.includes('quiet') &&
    railSrc.includes('LayerToggles') &&
    railSrc.includes('set-orientation') &&
    railSrc.includes('Trail') &&
    !railSrc.includes('Detect marks') &&
    !railSrc.includes('Print') &&
    !railSrc.includes('Pull Ask') &&
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
    (stripSrc.includes('page-filmstrip') || stripSrc.includes('filmstripClassName')) &&
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
  'page-filmstrip',
  'zoom-fit-bar',
  'trail-drawer',
  'ask-panel',
  'annotation-strip',
] as const;

/**
 * VL v1.1 dual surface: tool chrome uses `--surface`;
 * light page paper uses `--stage`. `--stage` is not a v1 token.
 */
export function dualSurfaceRoles(css: string): boolean {
  if ((VL_V1_TOKENS as readonly string[]).includes('--stage')) return false;
  if (!/--stage:\s*#/.test(css) || /#f4ead4|#f3ead6|#1b1410/.test(css)) return false;
  for (const name of TOOL_CHROME_SURFACES) {
    if (!ruleBodyContaining(css, name).includes('var(--surface)')) return false;
  }
  return ruleBodyContaining(css, 'matrix-viewport').includes('var(--stage)');
}

/** Compact zoom/fit bar: − / % / + / Fit width / Fit page — no page-count chrome. */
export function zoomFitBarIsCompact(css: string, stripSrc: string): boolean {
  const body = ruleBodyContaining(css, 'zoom-fit-bar');
  const min = body.match(/min-height:\s*(\d+)px/);
  const max = body.match(/max-height:\s*(\d+)px/);
  return (
    stripSrc.includes('data-testid="zoom-fit-bar"') &&
    stripSrc.includes('Fit width') &&
    stripSrc.includes('Fit page') &&
    stripSrc.includes('zoom-fit-width') &&
    stripSrc.includes('zoom-fit-page') &&
    !stripSrc.includes('page-strip-count') &&
    Boolean(min && Number(min[1]) <= 32) &&
    Boolean(max && Number(max[1]) <= 32)
  );
}

/** VL v1.1 layout: thumbnail navigator, compact zoom/fit, segmented annotation strip, collapsed trail, Ask sheet. */
export function vlV11LayoutMissing(
  css: string,
  stripSrc: string,
  traySrc: string,
  shellSrc: string,
): string[] {
  const missing: string[] = [];
  if (
    !css.includes('.page-filmstrip') ||
    !(stripSrc.includes('page-filmstrip') || stripSrc.includes('filmstripClassName'))
  ) {
    missing.push('thumbnail-rail');
  }
  if (!zoomFitBarIsCompact(css, stripSrc)) missing.push('compact-zoom-fit-bar');
  if (!css.includes('.segmented') || !traySrc.includes('annotation-strip') || !traySrc.includes('segmented')) {
    missing.push('segmented-annotation-strip');
  }
  if (!trailIsCollapsedInspector(css, shellSrc)) missing.push('collapsed-inspector-drawer');
  if (!askPanelIsFlatSheet(css) || !askRemainsMatrixOverlay(css)) missing.push('ask-pull-tuck-sheet');
  return missing;
}

/** Trail is a collapsed inspector drawer, not a permanent notes column. */
export function trailIsCollapsedInspector(css: string, shellSrc: string): boolean {
  const desk = css.match(/\.desk\s*\{([^}]+)\}/);
  return (
    Boolean(desk?.[1]?.includes('matrix')) &&
    !/grid-template-areas:[\s\S]*notes/.test(desk?.[1] ?? '') &&
    css.includes('.trail-drawer') &&
    /grid-area:\s*matrix/.test(css.match(/\.trail-drawer\s*\{([^}]+)\}/)?.[1] ?? '') &&
    shellSrc.includes('inspectorOpen') &&
    shellSrc.includes('TrailStrip')
  );
}

/** Manual pin is an active viewer tool — not a form on every note leaf. */
export function pinChromeIsNotOnLeaves(noteSrc: string): boolean {
  return (
    !noteSrc.includes('pin-to-page') &&
    !noteSrc.includes('pin-to-region') &&
    !noteSrc.includes('pin-actions') &&
    !/Pin to page|Pin to region|Cancel pin/.test(noteSrc) &&
    !noteSrc.includes("type: 'begin-anchor'")
  );
}

export function pinDrivenByActiveTool(stripSrc: string, shellSrc: string): boolean {
  return (
    stripSrc.includes('pin-to-page') &&
    stripSrc.includes('pin-region') &&
    stripSrc.includes('segmented') &&
    stripSrc.includes('ViewerTool') &&
    shellSrc.includes('chooseTool') &&
    shellSrc.includes('ViewerTool') &&
    shellSrc.includes("type: 'begin-anchor'")
  );
}

/** Eng thin-review: pin via active tool; no per-leaf pin/form chrome. */
export function engThinReviewMissing(
  noteSrc: string,
  traySrc: string,
  shellSrc: string,
  css: string,
): string[] {
  const missing: string[] = [];
  if (!pinChromeIsNotOnLeaves(noteSrc)) missing.push('pin-form-on-leaves');
  if (!pinDrivenByActiveTool(traySrc, shellSrc)) missing.push('pin-via-active-tool');
  if (css.includes('.pin-actions') || css.includes('note-draft-hint')) missing.push('leaf-pin-css');
  return missing;
}

/** Galvez/James: Pan on the strip, Fit width + Fit page, Detect/Print/Ask with tools, quieter files. */
export function galvezJamesMissing(
  traySrc: string,
  railSrc: string,
  stripSrc: string,
  viewportSrc: string,
  css: string,
): string[] {
  const missing: string[] = [];
  if (!traySrc.includes("'pan'") || !traySrc.includes('Pan') || !traySrc.includes('tool-pan')) {
    missing.push('pan-on-segmented-strip');
  }
  if (
    !viewportSrc.includes("tool === 'pan'") ||
    !viewportSrc.includes('capture: true') ||
    !viewportSrc.includes('data-testid="matrix-viewport"')
  ) {
    missing.push('pan-capture-on-matrix');
  }
  if (!zoomFitBarIsCompact(css, stripSrc)) missing.push('fit-width-and-fit-page');
  if (!traySrc.includes('Detect marks') || !traySrc.includes('Print') || !traySrc.includes('Pull Ask')) {
    missing.push('detect-print-ask-on-strip');
  }
  if (railSrc.includes('Detect marks') || railSrc.includes('Pull Ask') || railSrc.includes('print-desk')) {
    missing.push('actions-still-on-rail');
  }
  if (!railSrc.includes('quiet') || !css.includes('.file-btn.quiet')) missing.push('quiet-file-actions');
  return missing;
}

function hexChannels(css: string, token: string): { r: number; g: number; b: number } | null {
  const match = css.match(new RegExp(`${token}:\\s*#([0-9a-fA-F]{6})`));
  if (!match?.[1]) return null;
  const n = Number.parseInt(match[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** VL v1.2: `--stage` is nearer white page paper than cool gray, still a quiet gutter. */
export function stageIsNearWhitePaper(css: string): boolean {
  const stage = hexChannels(css, '--stage');
  if (!stage) return false;
  const min = Math.min(stage.r, stage.g, stage.b);
  const max = Math.max(stage.r, stage.g, stage.b);
  return min >= 0xe8 && max < 0xff && !/#f4ead4|#f3ead6|#1b1410/.test(css);
}

/** Valentina: filmstrip carries --accent; the reading column stays quiet paper, not --hand. */
export function filmstripIsOnlySaturatedNavigator(css: string): boolean {
  return (
    /page-thumb\.current[\s\S]{0,400}var\(--accent\)/.test(css) &&
    css.includes('.reading-column .paper-card.pdf') &&
    !/\.reading-column[\s\S]{0,500}var\(--hand\)/.test(css) &&
    !/\.reading-column[\s\S]{0,500}var\(--accent\)/.test(css)
  );
}

export function readingColumnIsDefault(
  css: string,
  clusterSrc: string,
  viewportSrc: string,
  cameraSrc: string,
): boolean {
  return (
    css.includes('.reading-column') &&
    clusterSrc.includes('reading-column') &&
    clusterSrc.includes('data-testid="reading-column"') &&
    /background:\s*var\(--stage\)/.test(ruleBodyContaining(css, 'matrix-viewport')) &&
    !/radial-gradient/.test(ruleBodyContaining(css, 'matrix-viewport')) &&
    viewportSrc.includes('readingColumnCamera') &&
    cameraSrc.includes('readingColumnCamera') &&
    cameraSrc.includes('CONNECTED_GLANCE_WIDTH_PX') &&
    cameraSrc.includes('viewWidth * (1 - zoom) / 2')
  );
}

export function filmstripIsBottomWayfinding(css: string, stripSrc: string): boolean {
  const body = ruleBodyContaining(css, 'page-filmstrip');
  return (
    (stripSrc.includes('page-filmstrip') || stripSrc.includes('filmstripClassName')) &&
    stripSrc.includes('data-testid="page-strip"') &&
    stripSrc.includes('page-thumb') &&
    /position:\s*absolute/.test(body) &&
    /bottom:\s*0/.test(body) &&
    /flex-direction:\s*row/.test(body) &&
    css.includes('.page-thumb.current') &&
    css.includes('var(--accent)') &&
    !stripSrc.includes("type: 'select-card'")
  );
}

export function pageGlideIsEaseOut(glideSrc: string, viewportSrc: string): boolean {
  return (
    glideSrc.includes('PAGE_GLIDE_MS') &&
    glideSrc.includes('easeOutCubic') &&
    glideSrc.includes('lerpCamera') &&
    !/easeOutBack|elastic|cubic-bezier\(/.test(glideSrc) &&
    viewportSrc.includes('PAGE_GLIDE_MS') &&
    viewportSrc.includes('lerpCamera') &&
    viewportSrc.includes('prefersReducedMotion')
  );
}

export function filmstripAutoHide(css: string, stripSrc: string, chromeSrc: string): boolean {
  const body = ruleBodyContaining(css, 'page-filmstrip');
  return (
    chromeSrc.includes('FILMSTRIP_IDLE_MS') &&
    chromeSrc.includes('createFilmstripIdle') &&
    stripSrc.includes('createFilmstripIdle') &&
    stripSrc.includes('pointermove') &&
    stripSrc.includes('mousemove') &&
    stripSrc.includes('filmstripClassName') &&
    chromeSrc.includes('filmstripChromeHonorsThesis') &&
    /opacity:\s*0/.test(body) &&
    /translateY\(8px\)/.test(body) &&
    css.includes('150ms') &&
    css.includes('@media (prefers-reduced-motion: reduce)')
  );
}

export function reducedMotionReader(
  css: string,
  glideSrc: string,
  viewportSrc: string,
  chromeSrc: string,
  stripSrc: string,
): boolean {
  return (
    chromeSrc.includes('instantPageJump') &&
    chromeSrc.includes('filmstripHighlightAnimates') &&
    chromeSrc.includes('filmstripStaysVisible') &&
    stripSrc.includes('subscribePrefersReducedMotion') &&
    stripSrc.includes('data-reduced-motion') &&
    glideSrc.includes('prefersReducedMotion') &&
    viewportSrc.includes('prefersReducedMotion') &&
    viewportSrc.includes('instantPageJump') &&
    css.includes('.page-filmstrip.static') &&
    css.includes('@media (prefers-reduced-motion: reduce)') &&
    /prefers-reduced-motion: reduce\)[\s\S]*transition:\s*none/.test(css) &&
    /prefers-reduced-motion: reduce\)[\s\S]*opacity:\s*1/.test(css) &&
    /prefers-reduced-motion: reduce\)[\s\S]*\.page-thumb[\s\S]*transition:\s*none/.test(css)
  );
}

/** Galvez IA + Valentina VL v1.2 Chromium-reader shell. */
export function vlV12ChromiumReaderMissing(
  css: string,
  stripSrc: string,
  clusterSrc: string,
  viewportSrc: string,
  cameraSrc: string,
  glideSrc: string,
  chromeSrc: string,
): string[] {
  const missing: string[] = [];
  if (!readingColumnIsDefault(css, clusterSrc, viewportSrc, cameraSrc) || !stageIsNearWhitePaper(css)) {
    missing.push('reading-column-default');
  }
  if (!filmstripIsOnlySaturatedNavigator(css)) missing.push('filmstrip-only-saturated-navigator');
  if (!filmstripIsBottomWayfinding(css, stripSrc) || !viewportSrc.includes('PageFilmstrip')) {
    missing.push('bottom-filmstrip');
  }
  if (!pageGlideIsEaseOut(glideSrc, viewportSrc) || !glideSrc.includes('pageGlideInBand')) {
    missing.push('page-glide-ease-out');
  }
  if (!filmstripAutoHide(css, stripSrc, chromeSrc)) missing.push('filmstrip-idle-reveal');
  if (!reducedMotionReader(css, glideSrc, viewportSrc, chromeSrc, stripSrc)) {
    missing.push('reduced-motion-static-strip');
  }
  return missing;
}

/** James/Lingxi: default glance is PDF page + hanging handwriting, not a PDF-only shell. */
export function defaultGlanceIncludesHangingInk(
  cameraSrc: string,
  viewportSrc: string,
  appSrc: string,
): boolean {
  return (
    cameraSrc.includes('CONNECTED_GLANCE_WIDTH_PX') &&
    cameraSrc.includes('CARD_WIDTH_PX.note') &&
    cameraSrc.includes('HANG_GAP_PX') &&
    viewportSrc.includes('hangingPage') &&
    viewportSrc.includes('state.anchors') &&
    viewportSrc.includes('readingColumnCamera') &&
    appSrc.includes('commit-manual-anchor') &&
    appSrc.includes('pageIndex: 1') &&
    appSrc.includes('hanging ink')
  );
}

/** Demo SelectionSet gathers handwriting + PDF together so Ask is not PDF-only. */
export function demoSelectionGathersInkAndPdf(appSrc: string, contextSrc: string): boolean {
  return (
    appSrc.includes("type: 'select-card'") &&
    appSrc.includes('hanging.id') &&
    appSrc.includes('page.id') &&
    contextSrc.includes('snapshotsFromSelection') &&
    contextSrc.includes('selectedCards')
  );
}

/** Demo hang is a manual pin; pending match slips stay on the note, off the graph. */
export function demoPendingMatchesStayOffGraph(appSrc: string, noteSrc: string): boolean {
  return (
    appSrc.includes('commit-manual-anchor') &&
    appSrc.includes('propose-matches') &&
    appSrc.includes('Pending match slips stay suggestions') &&
    !appSrc.includes("type: 'accept-match'") &&
    noteSrc.includes('match-slip') &&
    noteSrc.includes('pendingSuggestionsFor') &&
    noteSrc.includes('not pinned')
  );
}

/** Valentina: --hand warms handwriting only; filmstrip keeps --accent; stage stays paper. */
export function handwritingIsOnlyWarmAccent(css: string): boolean {
  return (
    /border-left:\s*3px solid var\(--hand\)/.test(css) &&
    /\.paper-card\.note[\s\S]{0,280}var\(--hand\)/.test(css) &&
    !/\.page-filmstrip[\s\S]{0,3200}var\(--hand\)/.test(css) &&
    filmstripIsOnlySaturatedNavigator(css)
  );
}

export function jamesLingxiCoherenceMissing(
  css: string,
  cameraSrc: string,
  viewportSrc: string,
  appSrc: string,
  noteSrc: string,
  contextSrc: string,
): string[] {
  const missing: string[] = [];
  if (!defaultGlanceIncludesHangingInk(cameraSrc, viewportSrc, appSrc)) {
    missing.push('connected-pdf-ink-glance');
  }
  if (!demoSelectionGathersInkAndPdf(appSrc, contextSrc)) {
    missing.push('demo-ink-pdf-selection');
  }
  if (!demoPendingMatchesStayOffGraph(appSrc, noteSrc)) {
    missing.push('pending-matches-off-graph');
  }
  if (!handwritingIsOnlyWarmAccent(css) || !stageIsNearWhitePaper(css)) {
    missing.push('valentina-thesis-chrome');
  }
  return missing;
}

