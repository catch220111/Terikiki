import { describe, expect, it } from 'vitest';
import printSrc from '../export/printSheet.ts?raw';
import noteSrc from './NoteCard.tsx?raw';

const { readFileSync } = await import('fs');
const { dirname, join } = await import('path');
const { fileURLToPath } = await import('url');

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles/desk.css'), 'utf8');

describe('chrome', () => {
  it('drops craft-desk shell tropes', () => {
    expect(css).not.toMatch(/Palatino|walnut|--vermillion|#c23b22|#c4a35a|#1b1410|note-tape|#f4ead4/);
    expect(css).toContain('--sans:');
    expect(css).toContain('.glyph');
    expect(noteSrc).not.toContain('note-tape');
    expect(printSrc).not.toMatch(/Palatino|#f4ead4/);
  });

  it('keeps handwriting cards larger than PDF and AI tiles', () => {
    expect(css).toMatch(/\.paper-card\.note\s*\{[^}]*width:\s*312px/s);
    expect(css).toMatch(/\.paper-card\.pdf\s*\{[^}]*width:\s*204px/s);
    expect(css).toMatch(/\.paper-card\.ai\s*\{[^}]*width:\s*168px/s);
  });
});
