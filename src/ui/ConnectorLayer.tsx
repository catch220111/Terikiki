import { useLayoutEffect, useState } from 'react';
import type { DeskState } from '../engine/deskState.ts';
import { cardById } from '../engine/selectors.ts';

interface Props {
  state: DeskState;
  surface: HTMLDivElement | null;
}

interface Line {
  id: string;
  d: string;
}

function localRect(el: Element, surface: HTMLElement, zoom: number) {
  const a = el.getBoundingClientRect();
  const b = surface.getBoundingClientRect();
  return {
    x: (a.left - b.left) / zoom,
    y: (a.top - b.top) / zoom,
    w: a.width / zoom,
    h: a.height / zoom,
  };
}

export function ConnectorLayer({ state, surface }: Props) {
  const [lines, setLines] = useState<Line[]>([]);

  useLayoutEffect(() => {
    if (!surface) {
      setLines([]);
      return;
    }
    const active = new Set<string>(state.selection.cardIds);
    if (state.hoverCardId) active.add(state.hoverCardId);
    if (active.size === 0) {
      setLines([]);
      return;
    }

    const next: Line[] = [];
    for (const anchor of state.anchors) {
      const hanging = cardById(state, anchor.cardId);
      const page = state.pages.find((p) => p.pageIndex === anchor.target.pageIndex);
      if (!hanging || !page) continue;
      if (!active.has(hanging.id) && !active.has(page.id)) continue;

      const fromEl = surface.querySelector(`[data-card="${hanging.id}"]`);
      const toEl =
        anchor.target.kind === 'region'
          ? surface.querySelector(`[data-region="${anchor.id}"]`) ??
            surface.querySelector(`[data-card="${page.id}"]`)
          : surface.querySelector(`[data-card="${page.id}"]`);
      if (!fromEl || !toEl) continue;

      const from = localRect(fromEl, surface, state.camera.zoom);
      const to = localRect(toEl, surface, state.camera.zoom);
      const x1 = from.x;
      const y1 = from.y + from.h / 2;
      const x2 = to.x + to.w;
      const y2 = to.y + to.h / 2;
      const mid = (x1 + x2) / 2;
      next.push({
        id: anchor.id,
        d: `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`,
      });
    }
    setLines(next);
  }, [state.anchors, state.camera.zoom, state.hoverCardId, state.pages, state.selection.cardIds, surface]);

  if (lines.length === 0) return null;
  return (
    <svg className="connectors" aria-hidden="true">
      {lines.map((line) => (
        <path key={line.id} d={line.d} />
      ))}
    </svg>
  );
}
