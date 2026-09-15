import type { AiTurn, Anchor, CommandMark, CommandMarkStatus } from '../types/domain.ts';

/**
 * Stage 4 lock: detect → show for confirmation → student confirms or dismisses.
 * Detection never confirms. Confirm never silent-fires Ask, anchors, or study cards.
 */
export function detectedOnly(marks: readonly CommandMark[]): CommandMark[] {
  return marks.filter((mark) => mark.status === 'detected');
}

export function confirmedMarks(marks: readonly CommandMark[]): CommandMark[] {
  return marks.filter((mark) => mark.status === 'confirmed');
}

export function detectorSilentConfirmed(marks: readonly CommandMark[]): string[] {
  return marks.filter((mark) => mark.status !== 'detected').map((mark) => mark.id);
}

export function canTransitionMark(status: CommandMarkStatus, next: CommandMarkStatus): boolean {
  return status === 'detected' && (next === 'confirmed' || next === 'dismissed');
}

export function silentFireOnConfirm(
  before: {
    anchors: readonly Anchor[];
    aiTurns: readonly AiTurn[];
    askOpen: boolean;
    aiCardCount: number;
  },
  after: {
    anchors: readonly Anchor[];
    aiTurns: readonly AiTurn[];
    askOpen: boolean;
    aiCardCount: number;
  },
): string[] {
  const leaked: string[] = [];
  if (after.anchors.length !== before.anchors.length) leaked.push('anchor');
  if (after.aiTurns.length !== before.aiTurns.length) leaked.push('ai-turn');
  if (after.askOpen !== before.askOpen) leaked.push('ask');
  if (after.aiCardCount !== before.aiCardCount) leaked.push('study-or-ai-card');
  return leaked;
}
