import { describe, expect, it } from 'vitest';
import { pinModeForTool, pinToolHint, toolTitle, type ViewerTool } from './viewerTool.ts';

const TOOLS: readonly ViewerTool[] = ['pan', 'select', 'pin-page', 'pin-region'];

describe('viewer tools', () => {
  it('maps pin tools to page/region modes and pan/select to none', () => {
    expect(TOOLS.map(pinModeForTool)).toEqual([null, null, 'page', 'region']);
  });

  it('hints only while a pin tool is active', () => {
    expect(pinToolHint('pan', true)).toBeNull();
    expect(pinToolHint('select', false)).toBeNull();
    expect(pinToolHint('pin-page', false)).toMatch(/Select a handwritten note/);
    expect(pinToolHint('pin-page', true)).toMatch(/Click a printed page/);
    expect(pinToolHint('pin-region', true)).toMatch(/drag a rectangle/);
  });

  it('titles every tool', () => {
    expect(TOOLS.map(toolTitle)).toEqual([
      'Drag the matrix to pan',
      'Select pages and notes for Ask',
      'Pin the selected note — click a page',
      'Pin the selected note — drag a region',
    ]);
  });
});
