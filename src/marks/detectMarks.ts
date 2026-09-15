import type { CommandMark, CommandMarkKind, NoteCard } from '../types/domain.ts';
import { COMMAND_MARK_GLYPH } from '../types/domain.ts';
import { createId } from '../engine/ids.ts';

const DETECTORS: readonly { kind: CommandMarkKind; pattern: RegExp; rationale: string }[] = [
  { kind: 'question', pattern: /(^|\s)\?(\s|$)|question|\bwhy\b/, rationale: 'Question mark / “why” in the ink.' },
  { kind: 'star', pattern: /(^|\s)\*(\s|$)|star|important/, rationale: 'Star / important mark.' },
  { kind: 'box', pattern: /\bbox\b|boxed/, rationale: 'Boxed region mark.' },
  { kind: 'circle', pattern: /\bcircle\b|circled/, rationale: 'Circled attention mark.' },
  { kind: 'arrow', pattern: /\barrow\b|→/, rationale: 'Arrow / flow mark.' },
  { kind: 'recall', pattern: /(^|\s)r(\s|$)|recall|review/, rationale: 'R (recall/review) mark.' },
  { kind: 'explain', pattern: /\bexplain\b/, rationale: 'EXPLAIN command.' },
];

/** Stub detector. Results are proposals until the student confirms. */
export function detectMarks(note: NoteCard): CommandMark[] {
  const blob = `${note.title} ${note.caption} ${note.filename} ${note.inkHints.join(' ')}`.toLowerCase();
  const found: CommandMark[] = [];
  for (const detector of DETECTORS) {
    if (!detector.pattern.test(blob)) continue;
    found.push({
      id: createId('mark'),
      noteId: note.id,
      kind: detector.kind,
      glyph: COMMAND_MARK_GLYPH[detector.kind],
      status: 'detected',
      rationale: detector.rationale,
    });
  }
  return found;
}
