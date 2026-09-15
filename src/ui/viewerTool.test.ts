import { describe, expect, it } from 'vitest';
import { pinModeForTool, pinToolHint, type ViewerTool } from './viewerTool.ts';

const TOOLS: readonly ViewerTool[] = ['select', 'pin-page', 'pin-region'];

describe('viewer tools', () => {
  it('maps pin tools to page/region modes and select to none', () => {
    expect(TOOLS.map(pinModeForTool)).toEqual([null, 'page', 'region']);
  });

  it('hints only while a pin tool is active', () => {
    expect(pinToolHint('select', false)).toBeNull();
    expect(pinToolHint('pin-page', false)).toMatch(/Select a handwritten note/);
    expect(pinToolHint('pin-page', true)).toMatch(/Click a printed page/);
    expect(pinToolHint('pin-region', true)).toMatch(/drag a rectangle/);
  });
});
