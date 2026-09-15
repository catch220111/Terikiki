import { describeTarget } from '../engine/anchors.ts';
import type { DeskState } from '../engine/deskState.ts';
import { selectedCards } from '../engine/selectors.ts';
import { citationKindVoice, type AiCitation, type CitationKind, type MatrixCard } from '../types/domain.ts';
import { snapshotsFromCards, type CardSnapshot, type PinSnapshot } from './client.ts';

export function excerptOfCard(card: MatrixCard): string {
  switch (card.kind) {
    case 'pdf-page':
      return card.excerpt;
    case 'note':
      return card.caption;
    case 'ai':
      return card.body;
    default: {
      const _never: never = card;
      return _never;
    }
  }
}

export function snapshotLabel(card: CardSnapshot): string {
  switch (card.kind) {
    case 'pdf-page':
      return `PDF p${(card.pageIndex ?? 0) + 1} · ${card.title}`;
    case 'note':
      return `Handwriting · ${card.title}`;
    case 'ai':
      return `AI · ${card.title}`;
    default: {
      const _never: never = card.kind;
      return _never;
    }
  }
}

export function pinEvidenceForCard(state: DeskState, cardId: string): PinSnapshot[] {
  return state.anchors
    .filter((anchor) => anchor.cardId === cardId)
    .map((anchor) => {
      const page = state.pages.find((p) => p.pageIndex === anchor.target.pageIndex);
      const pin: PinSnapshot = {
        anchorId: anchor.id,
        kind: anchor.target.kind,
        pageIndex: anchor.target.pageIndex,
        pageCardId: page?.id ?? cardId,
        label: describeTarget(anchor.target),
        rect: anchor.target.kind === 'region' ? anchor.target.rect : undefined,
      };
      return pin;
    });
}

export function snapshotsFromSelection(state: DeskState): CardSnapshot[] {
  return selectedCards(state).map((card) => {
    const [snapshot] = snapshotsFromCards([
      {
        ...card,
        excerpt: excerptOfCard(card),
        pageIndex: card.kind === 'pdf-page' ? card.pageIndex : undefined,
        pins: pinEvidenceForCard(state, card.id),
      },
    ]);
    return snapshot!;
  });
}

export function citationFromSnapshot(card: CardSnapshot, quote = card.excerpt.trim() || card.title): AiCitation {
  return {
    cardId: card.id,
    quote,
    kind: card.kind,
    label: snapshotLabel(card),
    pageIndex: card.pageIndex,
    revealCardId: card.id,
  };
}

export function regionCitationFromPin(card: CardSnapshot, pin: PinSnapshot): AiCitation {
  return {
    cardId: card.id,
    quote: pin.label,
    kind: 'region',
    label: `${pin.label} · ${card.title}`,
    pageIndex: pin.pageIndex,
    region: pin.rect,
    revealCardId: pin.pageCardId,
    anchorId: pin.anchorId,
  };
}

/** Citations the tutor is allowed to show: selected cards, plus region pins on those cards. */
export function citationsFromSnapshots(selection: readonly CardSnapshot[]): AiCitation[] {
  const citations: AiCitation[] = [];
  for (const card of selection) {
    citations.push(citationFromSnapshot(card));
    for (const pin of card.pins) {
      if (pin.kind === 'region') citations.push(regionCitationFromPin(card, pin));
    }
  }
  return citations;
}

function enrichCitation(selection: readonly CardSnapshot[], cite: AiCitation): AiCitation {
  const card = selection.find((item) => item.id === cite.cardId);
  if (!card) return cite;
  const pin = cite.anchorId
    ? card.pins.find((item) => item.anchorId === cite.anchorId)
    : cite.kind === 'region'
      ? card.pins.find((item) => item.kind === 'region')
      : undefined;
  return {
    cardId: cite.cardId,
    quote: cite.quote || card.excerpt.trim() || card.title,
    kind: cite.kind,
    label: cite.label || (cite.kind === 'region' && pin ? `${pin.label} · ${card.title}` : snapshotLabel(card)),
    pageIndex: cite.pageIndex ?? pin?.pageIndex ?? card.pageIndex,
    region: cite.region ?? pin?.rect,
    revealCardId: cite.revealCardId || pin?.pageCardId || card.id,
    anchorId: cite.anchorId ?? pin?.anchorId,
  };
}

/**
 * Drop citations that point outside the live selection.
 * If the client returns nothing usable, synthesize stamps from the snapshots.
 */
export function boundCitations(
  selection: readonly CardSnapshot[],
  citations: readonly AiCitation[],
): AiCitation[] {
  const ids = new Set(selection.map((card) => card.id));
  const bound = citations.filter((cite) => ids.has(cite.cardId)).map((cite) => enrichCitation(selection, cite));
  return bound.length > 0 ? bound : citationsFromSnapshots(selection);
}

export function lastTurnCitedIds(state: DeskState): readonly string[] {
  const last = state.aiTurns.at(-1);
  if (!state.askOpen || !last) return [];
  const ids = new Set<string>(last.selectionCardIds);
  for (const cite of last.citations) {
    ids.add(cite.cardId);
    ids.add(cite.revealCardId);
  }
  return [...ids];
}

export function isCardCited(state: DeskState, cardId: string): boolean {
  return lastTurnCitedIds(state).includes(cardId);
}

export function citeStampClass(kind: CitationKind): string {
  switch (kind) {
    case 'pdf-page':
      return 'cite cite-pdf';
    case 'note':
      return 'cite cite-note';
    case 'ai':
      return 'cite cite-ai';
    case 'region':
      return 'cite cite-region';
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

export function chipKindClass(kind: MatrixCard['kind']): string {
  switch (kind) {
    case 'pdf-page':
      return 'chip chip-pdf';
    case 'note':
      return 'chip chip-note';
    case 'ai':
      return 'chip chip-ai';
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

export function chipKindVoice(kind: MatrixCard['kind']): string {
  return citationKindVoice(kind);
}

export function gatheringEqualsSelection(
  selectionCardIds: readonly string[],
  liveCardIds: readonly string[],
): boolean {
  if (selectionCardIds.length !== liveCardIds.length) return false;
  return selectionCardIds.every((id, index) => id === liveCardIds[index]);
}
