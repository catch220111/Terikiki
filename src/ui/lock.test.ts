import { describe, expect, it } from 'vitest';
import printSrc from '../export/printSheet.ts?raw';
import noteSrc from './NoteCard.tsx?raw';
import {
  askPanelIsFlatSheet,
  brandMarkIsCraftScript,
  CARD_WIDTH_PX,
  cardWidthPx,
  connectorStrokeOutsideBand,
  craftChromeLeaks,
  handwritingHasSizePrimacy,
  missingVlV1Tokens,
  scriptUsedOutsideGlyphs,
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

  it('keeps handwriting size primacy on flat cards', () => {
    expect(cardWidthPx(css, 'note')).toBe(CARD_WIDTH_PX.note);
    expect(cardWidthPx(css, 'pdf')).toBe(CARD_WIDTH_PX.pdf);
    expect(cardWidthPx(css, 'ai')).toBe(CARD_WIDTH_PX.ai);
    expect(handwritingHasSizePrimacy(css)).toBe(true);
    expect(css).toMatch(/--radius:\s*10px/);
  });

  it('keeps Ask a flat Pull/Tuck surface and connectors in the opacity band', () => {
    expect(askPanelIsFlatSheet(css)).toBe(true);
    expect(connectorStrokeOutsideBand(css)).toBe(false);
  });
});
