import type { Dispatch, ReactNode } from 'react';
import { LAYER_TOGGLE_SPEC, layerKey, type LayerVisibility } from '../types/domain.ts';
import type { DeskAction } from '../engine/deskState.ts';

interface Props {
  layers: LayerVisibility;
  dispatch: Dispatch<DeskAction>;
}

export function LayerToggles({ layers, dispatch }: Props) {
  return (
    <div className="layer-toggles" role="group" aria-label="Layer toggles">
      {LAYER_TOGGLE_SPEC.map((toggle) => {
        const key = layerKey(toggle.origin, toggle.type);
        const on = layers[key] !== false;
        return (
          <label key={key} className={`layer-toggle ${on ? 'on' : 'off'}`}>
            <input
              type="checkbox"
              checked={on}
              onChange={() => dispatch({ type: 'toggle-layer', key })}
            />
            {toggle.label}
          </label>
        );
      })}
    </div>
  );
}

export function FileBtn({
  label,
  accept,
  onFile,
  onFiles,
  multiple,
  testId,
  quiet,
}: {
  label: string;
  accept: string;
  onFile?: (file: File) => void;
  onFiles?: (files: readonly File[]) => void;
  multiple?: boolean;
  testId?: string;
  quiet?: boolean;
}) {
  return (
    <label className={`file-btn${quiet ? ' quiet' : ''}`} data-testid={testId}>
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        data-testid={testId ? `${testId}-input` : undefined}
        onChange={(e) => {
          const files = e.target.files ? [...e.target.files] : [];
          e.target.value = '';
          if (files.length === 0) return;
          if (onFiles) onFiles(files);
          else if (onFile && files[0]) onFile(files[0]);
        }}
      />
    </label>
  );
}

export function InkBtn({
  children,
  onClick,
  active,
  testId,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  testId?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      className={`ink-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      data-testid={testId}
      title={title}
    >
      {children}
    </button>
  );
}
