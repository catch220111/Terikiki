/**
 * Stage 4 lock: one coherent print sheet (source excerpt + handwritten working margin).
 * Print goes through an iframe, never window.open. AI vs student must be labeled.
 */
export function printSheetHasSourceAndWorkingMargin(html: string): boolean {
  return (
    html.includes('Printed evidence') &&
    html.includes('Handwritten margin') &&
    html.includes('class="spread"') &&
    html.includes('class="excerpt"') &&
    html.includes('class="margin"')
  );
}

/** Forced extra pages split the packet; the lock wants one sheet. */
export function printSheetForcesSplitPages(html: string): boolean {
  return (
    /page-break-after:\s*always/.test(html) ||
    /break-after:\s*page/.test(html) ||
    /page-break-before:\s*always/.test(html) ||
    /break-before:\s*page/.test(html)
  );
}

export function unlabeledAiOnPrintSheet(html: string): string[] {
  const leaked: string[] = [];
  if (html.includes('data-from-ai="true"') && !html.includes('(AI)')) leaked.push('trail-ai');
  if (html.includes('data-voice="ai"') && !html.includes('voice-ai')) leaked.push('card-ai');
  return leaked;
}

export function unlabeledStudentOnPrintSheet(html: string): string[] {
  const leaked: string[] = [];
  if (html.includes('data-from-ai="false"') && !html.includes('(ink)')) leaked.push('trail-ink');
  if (html.includes('data-voice="ink"') && !html.includes('voice-ink')) leaked.push('card-ink');
  return leaked;
}

export function printPathUsesPopup(source: string): boolean {
  return /\bwindow\.open\s*\(/.test(source);
}

export function printPathUsesIframe(source: string): boolean {
  return /createElement\(\s*['"]iframe['"]\s*\)/.test(source) || /<iframe\b/.test(source);
}
