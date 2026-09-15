/**
 * CLV lane — filmstrip idle fade + prefers-reduced-motion (role reallocation).
 * Valentina thesis: the filmstrip is the only saturated navigator; the page
 * stage stays anonymous and quiet; handwriting is the only warm accent; no SaaS chrome.
 */
export const FILMSTRIP_IDLE_MS = 1600;
export const FILMSTRIP_FADE_MS = 150;

export type FilmstripChromeEvent =
  | 'pointer-move'
  | 'pointer-enter'
  | 'pointer-leave'
  | 'idle-elapsed'
  | 'pages-ready'
  | 'thumb-click';

export function filmstripIdleInBand(ms: number): boolean {
  return ms >= 1200 && ms <= 2000;
}

export function filmstripFadeIsSubtle(ms: number): boolean {
  return ms > 0 && ms <= 180;
}

/** Reduced motion: filmstrip-driven jumps are instant. Glide stays elsewhere. */
export function instantPageJump(reducedMotion: boolean): boolean {
  return reducedMotion;
}

export function filmstripHighlightAnimates(reducedMotion: boolean): boolean {
  return !reducedMotion;
}

export function filmstripStaysVisible(reducedMotion: boolean): boolean {
  return reducedMotion;
}

export function filmstripRevealedAfter(
  reducedMotion: boolean,
  event: FilmstripChromeEvent,
): boolean {
  if (reducedMotion) return true;
  switch (event) {
    case 'pointer-move':
    case 'pointer-enter':
    case 'pages-ready':
    case 'thumb-click':
    case 'pointer-leave':
      return true;
    case 'idle-elapsed':
      return false;
    default: {
      const _never: never = event;
      return _never;
    }
  }
}

export function filmstripClassName(revealed: boolean, reducedMotion: boolean): string {
  const shown = revealed || reducedMotion;
  return ['page-filmstrip', shown ? 'revealed' : '', reducedMotion ? 'static' : '']
    .filter(Boolean)
    .join(' ');
}

type TimerHandle = ReturnType<typeof setTimeout>;

export interface FilmstripIdle {
  readonly revealed: boolean;
  bump: () => void;
  hold: () => void;
  armIdle: () => void;
  dispose: () => void;
}

export function createFilmstripIdle(options: {
  reducedMotion: () => boolean;
  idleMs?: number;
  setTimeoutFn?: (fn: () => void, ms: number) => TimerHandle;
  clearTimeoutFn?: (id: TimerHandle) => void;
  onChange?: (revealed: boolean) => void;
}): FilmstripIdle {
  const idleMs = options.idleMs ?? FILMSTRIP_IDLE_MS;
  const setTimeoutFn = options.setTimeoutFn ?? setTimeout;
  const clearTimeoutFn = options.clearTimeoutFn ?? clearTimeout;
  let revealed = true;
  let timer: TimerHandle | undefined;

  function emit(next: boolean) {
    const shown = options.reducedMotion() ? true : next;
    if (revealed === shown) return;
    revealed = shown;
    options.onChange?.(revealed);
  }

  function clear() {
    if (timer === undefined) return;
    clearTimeoutFn(timer);
    timer = undefined;
  }

  function armIdle() {
    clear();
    if (options.reducedMotion()) {
      emit(true);
      return;
    }
    timer = setTimeoutFn(() => {
      timer = undefined;
      emit(false);
    }, idleMs);
  }

  function bump() {
    emit(true);
    armIdle();
  }

  function hold() {
    clear();
    emit(true);
  }

  return {
    get revealed() {
      return options.reducedMotion() || revealed;
    },
    bump,
    hold,
    armIdle,
    dispose: clear,
  };
}

export function subscribePrefersReducedMotion(onChange: (matches: boolean) => void): () => void {
  if (typeof matchMedia !== 'function') return () => {};
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const onMq = () => onChange(mq.matches);
  onMq();
  mq.addEventListener('change', onMq);
  return () => mq.removeEventListener('change', onMq);
}
