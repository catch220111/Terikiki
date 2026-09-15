import { describe, expect, it } from 'vitest';
import { isNoteImageFile, isPdfFile, partitionDroppedFiles, titleFromFilename } from './importImage.ts';

describe('note image import', () => {
  it('accepts photographed / scanned image types', () => {
    expect(isNoteImageFile(new File([], 'scan.jpg', { type: 'image/jpeg' }))).toBe(true);
    expect(isNoteImageFile(new File([], 'leaf.PNG', { type: '' }))).toBe(true);
    expect(isNoteImageFile(new File([], 'notes.pdf', { type: 'application/pdf' }))).toBe(false);
    expect(isPdfFile(new File([], 'lecture.pdf', { type: 'application/pdf' }))).toBe(true);
  });

  it('titles a leaf from the filename', () => {
    expect(titleFromFilename('why-beating.JPG')).toBe('why beating');
    expect(titleFromFilename('.hidden')).toBe('Untitled note');
  });

  it('splits a mixed drop onto notes vs the PDF spine', () => {
    const files = [
      new File([], 'p2-scan.png', { type: 'image/png' }),
      new File([], 'lecture.pdf', { type: 'application/pdf' }),
      new File([], 'readme.txt', { type: 'text/plain' }),
    ];
    const split = partitionDroppedFiles(files);
    expect(split.notes.map((f) => f.name)).toEqual(['p2-scan.png']);
    expect(split.pdfs.map((f) => f.name)).toEqual(['lecture.pdf']);
    expect(split.skipped.map((f) => f.name)).toEqual(['readme.txt']);
  });
});
