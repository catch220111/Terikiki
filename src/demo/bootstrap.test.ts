import { describe, expect, it } from 'vitest';
import viteConfig, { GITHUB_PAGES_BASE } from '../../vite.config.ts';
import { publicUrl, SAMPLE_NOTES, SAMPLE_PDF_URL } from './bootstrap.ts';

describe('sample asset URLs', () => {
  it('pins Vite base to the GitHub Pages project-site path', () => {
    expect(GITHUB_PAGES_BASE).toBe('/Terikiki/');
    expect(viteConfig.base).toBe(GITHUB_PAGES_BASE);
  });

  it('prefixes public files with Vite BASE_URL so Pages subpaths resolve', () => {
    const base = import.meta.env.BASE_URL;
    expect(base.endsWith('/')).toBe(true);
    expect(SAMPLE_PDF_URL).toBe(`${base}samples/lecture-coupled-notes.pdf`);
    expect(SAMPLE_NOTES.map((note) => note.url)).toEqual([
      `${base}samples/note-beating.svg`,
      `${base}samples/note-envelope.svg`,
    ]);
  });

  it('strips a leading slash so callers cannot escape the Vite base', () => {
    expect(publicUrl('/samples/lecture-coupled-notes.pdf')).toBe(SAMPLE_PDF_URL);
  });
});
