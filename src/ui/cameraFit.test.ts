import { describe, expect, it } from 'vitest';
import {
  clampZoom,
  fitPageCamera,
  fitWidthCamera,
  MAX_ZOOM,
  MIN_ZOOM,
  PDF_PAGE_FRAME,
  readingColumnCamera,
  READING_GUTTER_PX,
} from './cameraFit.ts';

describe('camera fit', () => {
  it('fit width scales to the PDF page frame width', () => {
    const camera = fitWidthCamera(PDF_PAGE_FRAME.width + READING_GUTTER_PX * 2);
    expect(camera.zoom).toBe(1);
    expect(fitWidthCamera(10_000).zoom).toBe(MAX_ZOOM);
    expect(fitWidthCamera(0).zoom).toBeGreaterThanOrEqual(MIN_ZOOM);
  });

  it('fit page is not wider than fit width and fits height', () => {
    const wide = fitWidthCamera(900);
    const page = fitPageCamera(900, 200);
    expect(page.zoom).toBeLessThanOrEqual(wide.zoom);
    expect(page.zoom).toBe(clampZoom((200 - READING_GUTTER_PX * 2) / PDF_PAGE_FRAME.height));
  });

  it('reading-column camera frames the column, not a card canvas', () => {
    const viewWidth = 800;
    const camera = readingColumnCamera(viewWidth, 560);
    expect(camera.zoom).toBe(MAX_ZOOM);
    expect(camera.x).toBeCloseTo(viewWidth * (1 - camera.zoom) / 2);
    expect(camera.zoom).toBeGreaterThan(1);
    const page1 = readingColumnCamera(viewWidth, 560, 1);
    expect(page1.y).toBeLessThan(camera.y);
  });
});
