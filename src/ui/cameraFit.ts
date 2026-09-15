import type { Camera } from '../types/domain.ts';
import { CARD_WIDTH_PX } from './lock.ts';

export const PDF_PAGE_FRAME = { width: CARD_WIDTH_PX.pdf, height: 292 } as const;
export const MIN_ZOOM = 0.35;
export const MAX_ZOOM = 2.6;
export const READING_GUTTER_PX = 24;
export const PAGE_STACK_GAP_PX = 18;
/** Gap between PDF cluster and hanging handwriting leaf (≈1.15rem). */
export const HANG_GAP_PX = 18;
/**
 * Connected study glance: printed page + hang gap + handwriting leaf.
 * Default camera must show ink↔PDF together — not a filmstrip-only PDF shell.
 */
export const CONNECTED_GLANCE_WIDTH_PX =
  CARD_WIDTH_PX.pdf + HANG_GAP_PX + CARD_WIDTH_PX.note;

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/**
 * CLV lane — default Chromium-reader camera frames PDF + hanging ink in one glance.
 * Valentina: anonymous quiet page stage; filmstrip is the only saturated navigator.
 */
export function readingColumnCamera(
  viewWidth: number,
  viewHeight: number,
  pageIndex = 0,
  mode: 'width' | 'page' = 'width',
): Camera {
  const width = Math.max(120, viewWidth);
  const height = Math.max(120, viewHeight);
  const gutter = READING_GUTTER_PX * 2;
  const contentWidth = CONNECTED_GLANCE_WIDTH_PX;
  const zoom = clampZoom(
    mode === 'page'
      ? Math.min((width - gutter) / contentWidth, (height - gutter) / PDF_PAGE_FRAME.height)
      : (width - gutter) / contentWidth,
  );
  // Hang extends right of the PDF cluster; shift left so the pair is centered.
  const pairCenterOffset = (HANG_GAP_PX + CARD_WIDTH_PX.note) / 2;
  return {
    x: viewWidth * (1 - zoom) / 2 - pairCenterOffset * zoom,
    y:
      READING_GUTTER_PX * (1 - zoom) -
      pageIndex * (PDF_PAGE_FRAME.height + PAGE_STACK_GAP_PX) * zoom,
    zoom,
  };
}

export function fitWidthCamera(viewWidth: number, pageIndex = 0): Camera {
  return readingColumnCamera(viewWidth, 800, pageIndex, 'width');
}

export function fitPageCamera(viewWidth: number, viewHeight: number, pageIndex = 0): Camera {
  return readingColumnCamera(viewWidth, viewHeight, pageIndex, 'page');
}

export function matrixViewportSize(): { width: number; height: number } {
  const el = document.querySelector('[data-testid="matrix-viewport"]');
  if (!(el instanceof HTMLElement)) return { width: 800, height: 560 };
  const box = el.getBoundingClientRect();
  return { width: box.width, height: box.height };
}
