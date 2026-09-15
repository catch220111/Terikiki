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
}: {
  label: string;
  accept: string;
  onFile?: (file: File) => void;
  onFiles?: (files: readonly File[]) => void;
  multiple?: boolean;
  testId?: string;
}) {
  return (
    <label className="file-btn" data-testid={testId}>
      {label}
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        data-testid={testId ? `${testId}-input` : undefined}
        onChange={(e) => {
          const list = e.target.files;
          e.target.value = '';
          if (!list || list.length === 0) return;
          const files = [...list];
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
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button type="button" className={`ink-btn ${active ? 'active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}
