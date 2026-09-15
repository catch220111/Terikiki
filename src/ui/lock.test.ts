import { describe, expect, it } from 'vitest';
import printSrc from '../export/printSheet.ts?raw';
import noteSrc from './NoteCard.tsx?raw';
import connectorSrc from './ConnectorLayer.tsx?raw';
import railSrc from './TopRail.tsx?raw';
import stripSrc from './PageStrip.tsx?raw';
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
  handwritingHasSizePrimacy,
  missingVlV1Tokens,
  pageStripIsReadingChrome,
  scriptUsedOutsideGlyphs,
  toolbarIsDocumentApp,
} from './lock.ts';

const { readFileSync } = await import('fs');
const { dirname, join } = await import('path');
const { fileURLToPath } = await import('url');

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles/desk.css'), 'utf8');

describe('VL v1 chrome lock', () => {
  it('declares the named token set and retires craft-desk shell tropes', () => {
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

  it('stages a PDF-editor shell: denser toolbar, page strip, matrix still center', () => {
    expect(toolbarIsDocumentApp(railSrc)).toBe(true);
    expect(pageStripIsReadingChrome(stripSrc)).toBe(true);
    expect(css).toMatch(/\.doc-toolbar/);
    expect(css).toMatch(/\.page-strip/);
    expect(css).not.toMatch(/brand-promise/);
  });
});
