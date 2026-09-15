import { describe, expect, it } from 'vitest';
import viewportSrc from './MatrixViewport.tsx?raw';
import {
  CONNECTED_GLANCE_WIDTH_PX,
  HANG_GAP_PX,
  PAGE_STACK_GAP_PX,
  PDF_PAGE_FRAME,
  READING_GUTTER_PX,
  readingColumnCamera,
} from './cameraFit.ts';
import { CARD_WIDTH_PX } from './lock.ts';
import {
  PAGE_GLIDE_MS,
  cameraFramingPage,
  easeOutCubic,
  lerpCamera,
  pageGlideInBand,
} from './cameraGlide.ts';
import { filmstripIsOnlySaturatedNavigator } from './lock.ts';

const { readFileSync } = await import('fs');
const { dirname, join } = await import('path');
const { fileURLToPath } = await import('url');
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles/desk.css'), 'utf8');

/** CLV lane: connected PDF+ink glance + filmstrip glide + fade/reduced-motion owned in filmstripChrome. */

describe('CLV connected reading glance', () => {
  it('frames PDF + hanging ink width, not PDF-only', () => {
    expect(CONNECTED_GLANCE_WIDTH_PX).toBe(CARD_WIDTH_PX.pdf + HANG_GAP_PX + CARD_WIDTH_PX.note);
    const viewWidth = 960;
    const viewHeight = 640;
    const camera = readingColumnCamera(viewWidth, viewHeight);
    const pairCenterOffset = (HANG_GAP_PX + CARD_WIDTH_PX.note) / 2;
    expect(camera.x).toBeCloseTo(viewWidth * (1 - camera.zoom) / 2 - pairCenterOffset * camera.zoom);
    expect(camera.zoom).toBeGreaterThan(0);
    expect(camera.zoom).toBeLessThanOrEqual((viewWidth - READING_GUTTER_PX * 2) / PDF_PAGE_FRAME.width + 0.001);
  });

  it('offsets later pages down the continuous column', () => {
    const first = readingColumnCamera(800, 560, 0);
    const second = readingColumnCamera(800, 560, 1);
    expect(second.y).toBeLessThan(first.y);
    expect(first.y - second.y).toBeCloseTo((PDF_PAGE_FRAME.height + PAGE_STACK_GAP_PX) * first.zoom);
  });

  it('wires MatrixViewport to reframe when hanging ink appears', () => {
    expect(viewportSrc).toContain('readingColumnCamera');
    expect(viewportSrc).toContain('state.anchors');
    expect(viewportSrc).toContain('hangingPage');
  });
});

describe('CLV filmstrip glide', () => {
  it('keeps glide duration in the 180–280ms ease-out band with no overshoot', () => {
    expect(pageGlideInBand(PAGE_GLIDE_MS)).toBe(true);
    expect(PAGE_GLIDE_MS).toBeGreaterThanOrEqual(180);
    expect(PAGE_GLIDE_MS).toBeLessThanOrEqual(280);
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    let prev = -1;
    for (let i = 0; i <= 10; i++) {
      const next = easeOutCubic(i / 10);
      expect(next).toBeGreaterThanOrEqual(prev);
      expect(next).toBeLessThanOrEqual(1);
      prev = next;
    }
  });

  it('lerps toward the framed page without bouncing past the target', () => {
    const from = { x: 0, y: 0, zoom: 1 };
    const to = cameraFramingPage(
      { left: 0, top: 0, width: 800 },
      { left: 100, top: 200, width: 204 },
      from,
      READING_GUTTER_PX,
    );
    const mid = lerpCamera(from, to, 0.5);
    expect(mid.x).toBeGreaterThan(Math.min(from.x, to.x));
    expect(mid.x).toBeLessThan(Math.max(from.x, to.x));
    expect(lerpCamera(from, to, 1)).toEqual(to);
  });
});

describe('CLV Valentina thesis smoke', () => {
  it('keeps the filmstrip as the only saturated navigator in desk.css', () => {
    expect(filmstripIsOnlySaturatedNavigator(css)).toBe(true);
  });
});
