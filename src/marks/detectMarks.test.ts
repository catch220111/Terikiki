import { describe, expect, it } from 'vitest';
import { detectMarks } from './detectMarks.ts';
import { makeNote } from '../engine/selectors.ts';

describe('detectMarks', () => {
  it('proposes ?, box, and EXPLAIN without confirming them', () => {
    const note = makeNote({
      title: 'Box the envelope',
      caption: 'box the envelope — EXPLAIN',
      filename: 'note.svg',
      imageUrl: '',
      inkHints: ['?'],
    });
    const marks = detectMarks(note);
    expect(marks.every((m) => m.status === 'detected')).toBe(true);
    expect(marks.map((m) => m.kind).sort()).toEqual(['box', 'explain', 'question'].sort());
    expect(marks.some((m) => m.glyph === 'EXPLAIN')).toBe(true);
  });

  it('returns nothing when ink is unmarked', () => {
    const note = makeNote({
      title: 'Quiet copy',
      caption: 'just a transcription of the heading',
      filename: 'copy.png',
      imageUrl: '',
    });
    expect(detectMarks(note)).toEqual([]);
  });
});
