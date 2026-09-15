import { describe, expect, it } from 'vitest';
import { EmptySelectionError } from './client.ts';
import { MockAiClient } from './mockClient.ts';

describe('MockAiClient', () => {
  it('refuses to run without an explicit selection', async () => {
    const client = new MockAiClient();
    await expect(client.complete({ prompt: 'hi', selection: [] })).rejects.toBeInstanceOf(EmptySelectionError);
  });

  it('cites only selected cards', async () => {
    const client = new MockAiClient();
    const result = await client.complete({
      prompt: 'What is beating?',
      selection: [
        {
          id: 'page_2',
          kind: 'pdf-page',
          title: 'Energy sloshing',
          origin: 'system',
          type: 'pdf',
          excerpt: 'envelope period 2pi / |w+ - w-|',
        },
        {
          id: 'note_1',
          kind: 'note',
          title: 'Why beating?',
          origin: 'student',
          type: 'handwriting',
          excerpt: 'why does beating appear',
        },
      ],
    });
    expect(result.citations.map((c) => c.cardId)).toEqual(['page_2', 'note_1']);
    expect(result.answer).toContain('Why beating?');
    expect(result.answer).toContain('Energy sloshing');
    expect(result.answer).not.toContain('unselected');
  });
});
