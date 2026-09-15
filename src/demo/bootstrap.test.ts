import { describe, expect, it } from 'vitest';
import { SAMPLE_NOTES, SAMPLE_PDF_URL } from './bootstrap.ts';

describe('sample asset URLs', () => {
  it('resolves under Vite BASE_URL so GitHub Pages /Terikiki/ works', () => {
    const base = import.meta.env.BASE_URL;
    expect(SAMPLE_PDF_URL).toBe(`${base}samples/lecture-coupled-notes.pdf`);
    expect(SAMPLE_NOTES.map((note) => note.url)).toEqual([
      `${base}samples/note-beating.svg`,
      `${base}samples/note-envelope.svg`,
    ]);
  });
});
