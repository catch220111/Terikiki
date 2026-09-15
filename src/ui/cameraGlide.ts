import type { Camera } from '../types/domain.ts';

/** CLV lane — thumb → page glide onto anonymous paper. VL v1.2: 180–280ms ease-out, no overshoot. */
export const PAGE_GLIDE_MS = 220;

export function pageGlideInBand(ms: number): boolean {
  return ms >= 180 && ms <= 280;
}

export function easeOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Ease-out lerp, clamped to the target — no overshoot past the page. */
export function lerpCamera(from: Camera, to: Camera, t: number): Camera {
  const e = easeOutCubic(t);
  return {
    x: from.x + (to.x - from.x) * e,
    y: from.y + (to.y - from.y) * e,
    zoom: from.zoom + (to.zoom - from.zoom) * e,
  };
}

export function currentPageId(
  pages: readonly { id: string; top: number }[],
  viewTop: number,
  gutter: number,
): string | null {
  let best: { id: string; dist: number } | null = null;
  for (const page of pages) {
    const dist = Math.abs(page.top - (viewTop + gutter));
    if (!best || dist < best.dist) best = { id: page.id, dist };
  }
  return best?.id ?? null;
}

export function cameraFramingPage(
  view: { left: number; top: number; width: number },
  page: { left: number; top: number; width: number },
  camera: Camera,
  gutter: number,
): Camera {
  return {
    x: camera.x + (view.left + view.width / 2 - (page.left + page.width / 2)),
    y: camera.y + (view.top + gutter - page.top),
    zoom: camera.zoom,
  };
}
