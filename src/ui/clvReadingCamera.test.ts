import { describe, expect, it } from 'vitest';
import viewportSrc from './MatrixViewport.tsx?raw';
import {
  PAGE_STACK_GAP_PX,
  PDF_PAGE_FRAME,
  READING_GUTTER_PX,
  readingColumnCamera,
} from './cameraFit.ts';
import {
  PAGE_GLIDE_MS,
  cameraFramingPage,
  easeOutCubic,
  lerpCamera,
  pageGlideInBand,
} from './cameraGlide.ts';

/** CLV lane lock: reading-column default camera + filmstrip→glide. James owns fade/reduced-motion. */

describe('CLV reading-column camera', () => {
  it('frames the PDF column centered, not a scattered card canvas', () => {
    const viewWidth = 960;
    const viewHeight = 640;
    const camera = readingColumnCamera(viewWidth, viewHeight);
    expect(camera.x).toBeCloseTo(viewWidth * (1 - camera.zoom) / 2);
    expect(camera.zoom).toBeGreaterThan(1);
    expect(camera).not.toEqual({ x: 0, y: 0, zoom: 1 });
    expect(camera.y).toBeCloseTo(READING_GUTTER_PX * (1 - camera.zoom));
  });

  it('offsets later pages down the continuous column', () => {
    const first = readingColumnCamera(800, 560, 0);
    const second = readingColumnCamera(800, 560, 1);
    expect(second.y).toBeLessThan(first.y);
    expect(first.y - second.y).toBeCloseTo((PDF_PAGE_FRAME.height + PAGE_STACK_GAP_PX) * first.zoom);
  });
});

describe('CLV filmstrip glide', () => {
  it('keeps glide duration in the 180–280ms ease-out band with no overshoot', () => {
    expect(pageGlideInBand(PAGE_GLIDE_MS)).toBe(true);
    expect(PAGE_GLIDE_MS).toBeGreaterThanOrEqual(180);
    expect(PAGE_GLIDE_MS).toBeLessThanOrEqual(280);
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
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
    expect(lerpCamera(from, to, 0)).toEqual(from);
    const mid = lerpCamera(from, to, 0.5);
    expect(mid.x).toBeGreaterThan(Math.min(from.x, to.x));
    expect(mid.x).toBeLessThan(Math.max(from.x, to.x));
    expect(mid.y).toBeGreaterThan(Math.min(from.y, to.y));
    expect(mid.y).toBeLessThan(Math.max(from.y, to.y));
    expect(lerpCamera(from, to, 1)).toEqual(to);
    expect(lerpCamera(from, to, 2)).toEqual(to);
  });

  it('first-frames the reading column, then glides on filmstrip focus', () => {
    expect(viewportSrc).toContain('readingColumnCamera(view.width, view.height)');
    expect(viewportSrc).toContain('framedDoc');
    expect(viewportSrc).toContain('PAGE_GLIDE_MS');
    expect(viewportSrc).toContain('lerpCamera');
    expect(viewportSrc).toContain('cameraFramingPage');
    expect(viewportSrc).toContain('requestAnimationFrame');
    expect(viewportSrc).toContain("type: 'set-camera'");
  });
});
