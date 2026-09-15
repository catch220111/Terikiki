import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createFilmstripIdle,
  FILMSTRIP_FADE_MS,
  FILMSTRIP_IDLE_MS,
  filmstripClassName,
  filmstripFadeIsSubtle,
  filmstripHighlightAnimates,
  filmstripIdleInBand,
  filmstripRevealedAfter,
  filmstripStaysVisible,
  instantPageJump,
  subscribePrefersReducedMotion,
} from './filmstripChrome.ts';

describe('CLV filmstrip idle fade + reduced-motion', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps idle fade in the 1.2–2s window and fade duration subtle', () => {
    expect(filmstripIdleInBand(FILMSTRIP_IDLE_MS)).toBe(true);
    expect(filmstripIdleInBand(1200)).toBe(true);
    expect(filmstripIdleInBand(2000)).toBe(true);
    expect(filmstripIdleInBand(1199)).toBe(false);
    expect(filmstripIdleInBand(2001)).toBe(false);
    expect(filmstripFadeIsSubtle(FILMSTRIP_FADE_MS)).toBe(true);
  });

  it('hides after idle and returns on pointer bump', () => {
    vi.useFakeTimers();
    const seen: boolean[] = [];
    const idle = createFilmstripIdle({
      reducedMotion: () => false,
      onChange: (revealed) => seen.push(revealed),
    });
    expect(idle.revealed).toBe(true);
    idle.bump();
    vi.advanceTimersByTime(FILMSTRIP_IDLE_MS - 1);
    expect(idle.revealed).toBe(true);
    vi.advanceTimersByTime(1);
    expect(idle.revealed).toBe(false);
    expect(seen).toContain(false);
    idle.bump();
    expect(idle.revealed).toBe(true);
    idle.dispose();
  });

  it('pointer-move after idle-elapsed reveals again', () => {
    expect(filmstripRevealedAfter(false, 'idle-elapsed')).toBe(false);
    expect(filmstripRevealedAfter(false, 'pointer-move')).toBe(true);
    expect(filmstripRevealedAfter(false, 'pages-ready')).toBe(true);
    expect(filmstripRevealedAfter(false, 'thumb-click')).toBe(true);
    expect(filmstripRevealedAfter(false, 'pointer-enter')).toBe(true);
    expect(filmstripRevealedAfter(false, 'pointer-leave')).toBe(true);
  });

  it('hold on the strip postpones idle until armIdle', () => {
    vi.useFakeTimers();
    const idle = createFilmstripIdle({ reducedMotion: () => false });
    idle.bump();
    idle.hold();
    vi.advanceTimersByTime(FILMSTRIP_IDLE_MS + 200);
    expect(idle.revealed).toBe(true);
    idle.armIdle();
    vi.advanceTimersByTime(FILMSTRIP_IDLE_MS);
    expect(idle.revealed).toBe(false);
    idle.dispose();
  });

  it('keeps the strip static and visible under reduced motion', () => {
    vi.useFakeTimers();
    const idle = createFilmstripIdle({ reducedMotion: () => true });
    expect(filmstripStaysVisible(true)).toBe(true);
    expect(idle.revealed).toBe(true);
    idle.bump();
    idle.armIdle();
    vi.advanceTimersByTime(10_000);
    expect(idle.revealed).toBe(true);
    expect(filmstripRevealedAfter(true, 'idle-elapsed')).toBe(true);
    expect(filmstripClassName(false, true)).toBe('page-filmstrip revealed static');
    idle.dispose();
  });

  it('forces instant page jump and no animated highlight when reduced', () => {
    expect(instantPageJump(true)).toBe(true);
    expect(instantPageJump(false)).toBe(false);
    expect(filmstripHighlightAnimates(true)).toBe(false);
    expect(filmstripHighlightAnimates(false)).toBe(true);
    expect(filmstripClassName(true, false)).toBe('page-filmstrip revealed');
    expect(filmstripClassName(false, false)).toBe('page-filmstrip');
  });

  it('subscribes to prefers-reduced-motion changes', () => {
    const listeners: Array<() => void> = [];
    const mq = {
      matches: false,
      addEventListener: (_type: string, handler: () => void) => {
        listeners.push(handler);
      },
      removeEventListener: () => {},
    };
    const previous = globalThis.matchMedia;
    globalThis.matchMedia = () => mq as unknown as MediaQueryList;
    const seen: boolean[] = [];
    const stop = subscribePrefersReducedMotion((matches) => seen.push(matches));
    mq.matches = true;
    listeners[0]?.();
    expect(seen).toEqual([false, true]);
    stop();
    globalThis.matchMedia = previous;
  });
});
