import type { Dispatch } from 'react';
import { chipKindClass, chipKindVoice } from '../ai/context.ts';
import type { DeskAction, DeskState } from '../engine/deskState.ts';
import { cardById, labelForCard } from '../engine/selectors.ts';
import { toolTitle, type ViewerTool } from './viewerTool.ts';

interface Props {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
  tool: ViewerTool;
  onChooseTool: (tool: ViewerTool) => void;
  onDetectMarks: () => void;
  onExport: () => void;
}

const TOOLS: readonly { id: ViewerTool; label: string; testId: string }[] = [
  { id: 'pan', label: 'Pan', testId: 'tool-pan' },
  { id: 'select', label: 'Select', testId: 'tool-select' },
  { id: 'pin-page', label: 'Pin page', testId: 'pin-to-page' },
  { id: 'pin-region', label: 'Pin region', testId: 'pin-to-region' },
];

export function SelectionTray({
  state,
  dispatch,
  tool,
  onChooseTool,
  onDetectMarks,
  onExport,
}: Props) {
  const empty = state.selection.cardIds.length === 0;
  return (
    <div
      className={`annotation-strip selection-tray ${empty ? 'empty' : ''}`}
      aria-label="Segmented annotation strip"
    >
      <div className="segmented" role="group" aria-label="Annotation tools">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tool === item.id ? 'on' : ''}
            data-testid={item.testId}
            aria-pressed={tool === item.id}
            title={toolTitle(item.id)}
            onClick={() => onChooseTool(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {empty ? (
        <span className="strip-hint">Click a page or note. Shift adds. Ask only sees this gathering.</span>
      ) : (
        <>
          <span className="chips-label">Ask sees</span>
          {state.selection.cardIds.map((id) => {
            const card = cardById(state, id);
            return (
              <button
                key={id}
                type="button"
                className={card ? chipKindClass(card.kind) : 'chip'}
                title={card ? `Drop ${chipKindVoice(card.kind)} from Ask` : 'Drop from Ask'}
                onClick={() => dispatch({ type: 'remove-from-selection', cardId: id })}
              >
                {card ? labelForCard(card) : id}
              </button>
            );
          })}
        </>
      )}
      <div className="strip-actions">
        <button type="button" className="ink-btn" data-testid="detect-marks" onClick={onDetectMarks}>
          Detect marks
        </button>
        <button type="button" className="ink-btn" data-testid="print-desk" onClick={onExport}>
          Print
        </button>
        <button
          type="button"
          className="ink-btn"
          data-testid="pull-ask"
          onClick={() => dispatch({ type: 'open-ask', open: !state.askOpen })}
        >
          {state.askOpen ? 'Tuck Ask' : 'Pull Ask'}
        </button>
      </div>
    </div>
  );
}
