import { describe, expect, it } from 'vitest';
import {
  cameraFramingPage,
  currentPageId,
  easeOutCubic,
  FILMSTRIP_IDLE_MS,
  filmstripIdleInBand,
  lerpCamera,
  PAGE_GLIDE_MS,
  pageGlideInBand,
} from './cameraGlide.ts';

describe('VL v1.2 page glide', () => {
  it('stays in the 180–280ms ease-out band with no overshoot', () => {
    expect(pageGlideInBand(PAGE_GLIDE_MS)).toBe(true);
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
    let prev = 0;
    for (let i = 0; i <= 20; i++) {
      const next = easeOutCubic(i / 20);
      expect(next).toBeGreaterThanOrEqual(prev);
      expect(next).toBeLessThanOrEqual(1);
      prev = next;
    }
  });

  it('lerps the camera without bouncing past the target', () => {
    const from = { x: 0, y: 0, zoom: 1 };
    const to = { x: 100, y: -40, zoom: 1.4 };
    const mid = lerpCamera(from, to, 0.5);
    expect(mid.x).toBeGreaterThan(from.x);
    expect(mid.x).toBeLessThan(to.x);
    expect(lerpCamera(from, to, 1)).toEqual(to);
  });

  it('frames a page by centering x and parking the top on the gutter', () => {
    const camera = cameraFramingPage(
      { left: 0, top: 0, width: 800 },
      { left: 200, top: 120, width: 200 },
      { x: 10, y: 10, zoom: 1.2 },
      24,
    );
    expect(camera.x).toBe(10 + (400 - 300));
    expect(camera.y).toBe(10 + (24 - 120));
    expect(camera.zoom).toBe(1.2);
  });

  it('picks the page whose top is nearest the reading gutter', () => {
    expect(
      currentPageId(
        [
          { id: 'p0', top: 40 },
          { id: 'p1', top: 360 },
          { id: 'p2', top: 700 },
        ],
        0,
        24,
      ),
    ).toBe('p0');
    expect(
      currentPageId(
        [
          { id: 'p0', top: 40 },
          { id: 'p1', top: 360 },
          { id: 'p2', top: 700 },
        ],
        340,
        24,
      ),
    ).toBe('p1');
  });

  it('keeps filmstrip idle in the 1.2–2s band', () => {
    expect(filmstripIdleInBand(FILMSTRIP_IDLE_MS)).toBe(true);
    expect(filmstripIdleInBand(1199)).toBe(false);
    expect(filmstripIdleInBand(2001)).toBe(false);
  });
});
