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
}: {
  label: string;
  accept: string;
  onFile: (file: File) => void;
}) {
  return (
    <label className="file-btn">
      {label}
      <input
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onFile(file);
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
