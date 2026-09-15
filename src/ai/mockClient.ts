import { EmptySelectionError, type AiClient, type AiRequest, type AiResponse } from './client.ts';
import { citationsFromSnapshots, snapshotLabel } from './context.ts';

function kindVoice(kind: AiRequest['selection'][number]['kind']): string {
  switch (kind) {
    case 'note':
      return 'handwriting';
    case 'pdf-page':
      return 'printed page';
    case 'ai':
      return 'earlier AI card';
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

function pinLine(card: AiRequest['selection'][number]): string {
  if (card.pins.length === 0) return '';
  const labels = card.pins.map((pin) => pin.label).join(', ');
  return ` [pinned to ${labels}]`;
}

/**
 * Deterministic on-device tutor. No API keys.
 * Cites only cards (and their region pins) present in the explicit selection.
 */
export class MockAiClient implements AiClient {
  async complete(request: AiRequest): Promise<AiResponse> {
    if (request.selection.length === 0) throw new EmptySelectionError();

    const citations = citationsFromSnapshots(request.selection);

    const gathered = request.selection
      .map((card) => {
        const excerpt = card.excerpt ? ` — “${truncate(card.excerpt, 90)}”` : '';
        return `• ${snapshotLabel(card)} (${kindVoice(card.kind)})${excerpt}${pinLine(card)}`;
      })
      .join('\n');

    const prompt = request.prompt.trim() || 'What should I notice in this selection?';

    const answer = [
      `You gathered ${request.selection.length} card${request.selection.length === 1 ? '' : 's'}. I will not look outside that set.`,
      ``,
      `Question: ${prompt}`,
      ``,
      `What the paper is doing:`,
      gathered,
      ``,
      `Read the handwriting first. The printed page is evidence, not the thought.`,
      `If a note is still unanchored, pin it before trusting a citation as location.`,
    ].join('\n');

    return { answer, citations };
  }
}

function truncate(text: string, max: number): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.length <= max ? compact : `${compact.slice(0, max - 1)}…`;
}
