import type { MatchSuggestion, NoteCard, PdfPageCard } from '../types/domain.ts';
import { createId } from '../engine/ids.ts';
import { assertPendingOnly, type MatchingService } from './service.ts';

const PAGE_HINT = /(?:page|p)[\s:_-]*(\d+)/i;

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+]+/g)
    .filter((t) => t.length > 2);
}

function overlapScore(noteText: string, page: PdfPageCard): number {
  const noteTokens = new Set(tokens(noteText));
  const pageTokens = tokens(`${page.title} ${page.excerpt}`);
  if (noteTokens.size === 0 || pageTokens.length === 0) return 0;
  let hits = 0;
  for (const token of pageTokens) {
    if (noteTokens.has(token)) hits += 1;
  }
  return hits / Math.max(4, noteTokens.size);
}

/**
 * Heuristic matcher. Returns pending suggestions only — never writes anchors.
 */
export function suggestMatches(note: NoteCard, pages: readonly PdfPageCard[]): readonly MatchSuggestion[] {
  if (pages.length === 0) return [];

  const blob = `${note.title} ${note.caption} ${note.filename} ${note.inkHints.join(' ')}`;
  const pageHint = blob.match(PAGE_HINT);
  const hintedIndex = pageHint ? Number(pageHint[1]) - 1 : undefined;

  const ranked = pages
    .map((page) => {
      const overlap = overlapScore(blob, page);
      const hintBoost = hintedIndex === page.pageIndex ? 0.45 : 0;
      return { page, score: Math.min(0.96, overlap + hintBoost) };
    })
    .sort((a, b) => b.score - a.score);

  const top = ranked[0];
  if (!top || top.score < 0.08) {
    const fallback = pages[0];
    if (!fallback) return [];
    return assertPendingOnly([
      {
        id: createId('match'),
        noteId: note.id,
        target: { kind: 'page', documentId: fallback.documentId, pageIndex: fallback.pageIndex },
        confidence: 0.22,
        rationale: 'Weak stub guess — first page. Confirm, reject, or correct.',
        status: 'pending',
      },
    ]);
  }

  const suggestions: MatchSuggestion[] = [
    {
      id: createId('match'),
      noteId: note.id,
      target: { kind: 'page', documentId: top.page.documentId, pageIndex: top.page.pageIndex },
      confidence: Number(top.score.toFixed(2)),
      rationale: `Stub matcher: “${top.page.title}” shares wording with this note.`,
      status: 'pending',
    },
  ];

  const boxed = /box|region|envelope|derivation/i.test(blob);
  if (boxed) {
    suggestions.push({
      id: createId('match'),
      noteId: note.id,
      target: {
        kind: 'region',
        documentId: top.page.documentId,
        pageIndex: top.page.pageIndex,
        rect: { x: 0.1, y: 0.32, w: 0.8, h: 0.36 },
      },
      confidence: Number(Math.min(0.9, top.score + 0.08).toFixed(2)),
      rationale: 'Stub matcher: note looks like it boxes a region on that page.',
      status: 'pending',
    });
  }

  return assertPendingOnly(suggestions);
}

/** Honest stub: wording overlap + page hints. Not a vision model. */
export class StubMatchingService implements MatchingService {
  suggestForNote(note: NoteCard, pages: readonly PdfPageCard[]): readonly MatchSuggestion[] {
    return suggestMatches(note, pages);
  }
}
