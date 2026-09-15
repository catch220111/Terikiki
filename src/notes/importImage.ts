import { makeNote } from '../engine/selectors.ts';
import type { NoteCard } from '../types/domain.ts';

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|heic|heif)$/i;

export function isNoteImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return IMAGE_EXT.test(file.name);
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

export function titleFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  return stem || 'Untitled note';
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read note image “${file.name}”`));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function noteFromImage(file: File, imageUrl: string): NoteCard {
  return makeNote({
    title: titleFromFilename(file.name),
    caption: file.name,
    filename: file.name,
    imageUrl,
  });
}

export function partitionDroppedFiles(files: readonly File[]): { notes: File[]; pdfs: File[]; skipped: File[] } {
  const notes: File[] = [];
  const pdfs: File[] = [];
  const skipped: File[] = [];
  for (const file of files) {
    if (isPdfFile(file)) pdfs.push(file);
    else if (isNoteImageFile(file)) notes.push(file);
    else skipped.push(file);
  }
  return { notes, pdfs, skipped };
}
