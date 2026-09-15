import type { LayerVisibility } from '../types/matrix';
import { layerKey } from '../types/matrix';

const TOGGLES: { origin: 'system' | 'student' | 'ai'; type: 'pdf' | 'handwriting' | 'transcription' | 'questions' | 'student' | 'ai'; label: string }[] = [
  { origin: 'system', type: 'pdf', label: 'PDF' },
  { origin: 'student', type: 'handwriting', label: 'Handwriting' },
  { origin: 'student', type: 'transcription', label: 'Transcription' },
  { origin: 'student', type: 'questions', label: 'Questions' },
  { origin: 'ai', type: 'ai', label: 'AI' },
];

interface Props {
  layers: LayerVisibility;
  onChange: (next: LayerVisibility) => void;
}

export function LayerToggles({ layers, onChange }: Props) {
  return (
    <div className="layer-toggles" role="group" aria-label="Layer toggles">
      {TOGGLES.map((t) => {
        const key = layerKey(t.origin, t.type);
        const on = layers[key] !== false;
        return (
          <label key={key} className={`layer-toggle ${on ? 'on' : 'off'}`}>
            <input
              type="checkbox"
              checked={on}
              onChange={(e) => onChange({ ...layers, [key]: e.target.checked })}
            />
            {t.label}
          </label>
        );
      })}
    </div>
  );
}
