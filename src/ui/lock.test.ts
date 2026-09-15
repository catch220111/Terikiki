import { describe, expect, it } from 'vitest';
import printSrc from '../export/printSheet.ts?raw';
import noteSrc from './NoteCard.tsx?raw';
import connectorSrc from './ConnectorLayer.tsx?raw';
import railSrc from './TopRail.tsx?raw';
import stripSrc from './PageStrip.tsx?raw';
import traySrc from './SelectionTray.tsx?raw';
import shellSrc from './DeskShell.tsx?raw';
import {
  askPanelIsFlatSheet,
  askRemainsMatrixOverlay,
  brandMarkIsCraftScript,
  CARD_RADIUS_PX,
  CARD_WIDTH_PX,
  cardRadiusInBand,
  cardRadiusPx,
  cardWidthPx,
  connectorStrokeOutsideBand,
  connectorsAreSelectHoverOnly,
  craftChromeLeaks,
  dualSurfaceRoles,
  handwritingHasSizePrimacy,
  missingVlV1Tokens,
  pageStripIsReadingChrome,
  pinChromeIsNotOnLeaves,
  pinDrivenByActiveTool,
  scriptUsedOutsideGlyphs,
  toolbarIsDocumentApp,
  trailIsCollapsedInspector,
  vlV11LayoutMissing,
  zoomFitBarIsCompact,
  VL_V1_TOKENS,
} from './lock.ts';

const { readFileSync } = await import('fs');
const { dirname, join } = await import('path');
const { fileURLToPath } = await import('url');

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles/desk.css'), 'utf8');

describe('VL v1.1 implementable cut', () => {
  it('keeps the closed VL v1 token set and retires craft-desk shell tropes', () => {
    expect([...VL_V1_TOKENS]).toEqual([
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
    ]);
    expect(missingVlV1Tokens(css)).toEqual([]);
    expect(craftChromeLeaks(css, noteSrc, printSrc)).toEqual([]);
    expect(brandMarkIsCraftScript(css)).toBe(false);
    expect(scriptUsedOutsideGlyphs(css)).toEqual([]);
  });

  it('keeps handwriting size primacy on flat 8–12px cards', () => {
    expect(cardWidthPx(css, 'note')).toBe(CARD_WIDTH_PX.note);
    expect(cardWidthPx(css, 'pdf')).toBe(CARD_WIDTH_PX.pdf);
    expect(cardWidthPx(css, 'ai')).toBe(CARD_WIDTH_PX.ai);
    expect(handwritingHasSizePrimacy(css)).toBe(true);
    expect(cardRadiusPx(css, 'note')).toBe(CARD_RADIUS_PX.note);
    expect(cardRadiusPx(css, 'pdf')).toBe(CARD_RADIUS_PX.pdf);
    expect(cardRadiusPx(css, 'ai')).toBe(CARD_RADIUS_PX.ai);
    expect(cardRadiusInBand(css)).toBe(true);
    expect(css).toMatch(/--radius:\s*10px/);
  });

  it('keeps Ask a flat Pull/Tuck surface and connectors select/hover only', () => {
    expect(askPanelIsFlatSheet(css)).toBe(true);
    expect(askRemainsMatrixOverlay(css)).toBe(true);
    expect(connectorStrokeOutsideBand(css)).toBe(false);
    expect(connectorsAreSelectHoverOnly(connectorSrc)).toBe(true);
    expect(css).not.toMatch(/stroke-dasharray/);
  });

  it('locks Valentina VL v1.1: dual surface, compact chrome, Ask sheet, handwriting primacy', () => {
    expect(handwritingHasSizePrimacy(css)).toBe(true);
    expect(toolbarIsDocumentApp(railSrc)).toBe(true);
    expect(pageStripIsReadingChrome(stripSrc)).toBe(true);
    expect(dualSurfaceRoles(css)).toBe(true);
    expect(zoomFitBarIsCompact(css, stripSrc)).toBe(true);
    expect(vlV11LayoutMissing(css, stripSrc, traySrc, shellSrc)).toEqual([]);
    expect(trailIsCollapsedInspector(css, shellSrc)).toBe(true);
    expect(askPanelIsFlatSheet(css)).toBe(true);
    expect(askRemainsMatrixOverlay(css)).toBe(true);
    expect(pinChromeIsNotOnLeaves(noteSrc)).toBe(true);
    expect(pinDrivenByActiveTool(traySrc)).toBe(true);
    expect(css).toMatch(/\.thumb-rail/);
    expect(css).toMatch(/\.zoom-fit-bar/);
    expect(css).toMatch(/\.segmented/);
    expect(traySrc).toMatch(/annotation-strip/);
    expect(css).not.toMatch(/brand-promise/);
  });
});
