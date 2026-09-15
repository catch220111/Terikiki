import { describe, expect, it } from 'vitest';
import {
  clampZoom,
  CONNECTED_GLANCE_WIDTH_PX,
  fitPageCamera,
  fitWidthCamera,
  HANG_GAP_PX,
  MAX_ZOOM,
  MIN_ZOOM,
  PDF_PAGE_FRAME,
  readingColumnCamera,
  READING_GUTTER_PX,
} from './cameraFit.ts';
import { CARD_WIDTH_PX } from './lock.ts';

describe('camera fit', () => {
  it('fit width scales to the connected PDF+ink glance width', () => {
    const camera = fitWidthCamera(CONNECTED_GLANCE_WIDTH_PX + READING_GUTTER_PX * 2);
    expect(camera.zoom).toBe(1);
    expect(fitWidthCamera(10_000).zoom).toBe(MAX_ZOOM);
    expect(fitWidthCamera(0).zoom).toBeGreaterThanOrEqual(MIN_ZOOM);
  });

  it('fit page is not wider than fit width and fits height', () => {
    const wide = fitWidthCamera(900);
    const page = fitPageCamera(900, 200);
    expect(page.zoom).toBeLessThanOrEqual(wide.zoom);
    expect(page.zoom).toBe(
      clampZoom(
        Math.min(
          (900 - READING_GUTTER_PX * 2) / CONNECTED_GLANCE_WIDTH_PX,
          (200 - READING_GUTTER_PX * 2) / PDF_PAGE_FRAME.height,
        ),
      ),
    );
  });

  it('reading-column camera frames PDF + hanging ink, not a card canvas', () => {
    const viewWidth = 800;
    const camera = readingColumnCamera(viewWidth, 560);
    const pairCenterOffset = (HANG_GAP_PX + CARD_WIDTH_PX.note) / 2;
    expect(camera.zoom).toBe(
      clampZoom((viewWidth - READING_GUTTER_PX * 2) / CONNECTED_GLANCE_WIDTH_PX),
    );
    expect(camera.x).toBeCloseTo(viewWidth * (1 - camera.zoom) / 2 - pairCenterOffset * camera.zoom);
    expect(camera.zoom).toBeGreaterThan(0);
    const page1 = readingColumnCamera(viewWidth, 560, 1);
    expect(page1.y).toBeLessThan(camera.y);
  });
});
