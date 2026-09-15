export type ViewerTool = 'pan' | 'select' | 'pin-page' | 'pin-region';

export function pinModeForTool(tool: ViewerTool): 'page' | 'region' | null {
  switch (tool) {
    case 'pan':
    case 'select':
      return null;
    case 'pin-page':
      return 'page';
    case 'pin-region':
      return 'region';
    default: {
      const _never: never = tool;
      return _never;
    }
  }
}

export function pinToolHint(tool: ViewerTool, hasSelectedNote: boolean): string | null {
  switch (tool) {
    case 'pan':
    case 'select':
      return null;
    case 'pin-page':
      return hasSelectedNote
        ? 'Click a printed page to pin. Esc cancels.'
        : 'Select a handwritten note, then click a printed page.';
    case 'pin-region':
      return hasSelectedNote
        ? 'Click a page, then drag a rectangle. Esc cancels.'
        : 'Select a handwritten note, then click a page and drag a rectangle.';
    default: {
      const _never: never = tool;
      return _never;
    }
  }
}

export function toolTitle(tool: ViewerTool): string {
  switch (tool) {
    case 'pan':
      return 'Drag the matrix to pan';
    case 'select':
      return 'Select pages and notes for Ask';
    case 'pin-page':
      return 'Pin the selected note — click a page';
    case 'pin-region':
      return 'Pin the selected note — drag a region';
    default: {
      const _never: never = tool;
      return _never;
    }
  }
}
