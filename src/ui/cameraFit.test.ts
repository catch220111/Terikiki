import { describe, expect, it } from 'vitest';
import { clampZoom, fitPageCamera, fitWidthCamera, MAX_ZOOM, MIN_ZOOM, PDF_PAGE_FRAME } from './cameraFit.ts';

describe('camera fit', () => {
  it('fit width scales to the PDF page frame width', () => {
    const camera = fitWidthCamera(PDF_PAGE_FRAME.width + 48);
    expect(camera.zoom).toBe(1);
    expect(fitWidthCamera(10_000).zoom).toBe(MAX_ZOOM);
    expect(fitWidthCamera(0).zoom).toBeGreaterThanOrEqual(MIN_ZOOM);
  });

  it('fit page is not wider than fit width and fits height', () => {
    const wide = fitWidthCamera(900);
    const page = fitPageCamera(900, 200);
    expect(page.zoom).toBeLessThanOrEqual(wide.zoom);
    expect(page.zoom).toBe(clampZoom((200 - 48) / PDF_PAGE_FRAME.height));
  });
});
