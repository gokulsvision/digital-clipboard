import type { Tool } from './Board';

const TOOLS: Array<{ id: Tool; label: string; key: string; symbol: string; hint?: string }> = [
  { id: 'move', label: 'Move', key: 'A', symbol: '✥' },
  { id: 'x', label: 'Us', key: 'Q', symbol: '✕' },
  { id: 'o', label: 'Them', key: 'W', symbol: '○' },
  { id: 'ball', label: 'Ball', key: 'E', symbol: '⚽' },
  { id: 'pass', label: 'Pass', key: 'D', symbol: '⇢', hint: '⇧ drag flips the curve' },
  { id: 'run', label: 'Run', key: 'R', symbol: '⟶' },
  { id: 'erase', label: 'Erase', key: 'F', symbol: '⌫', hint: 'hover to erase' },
];

interface Props {
  tool: Tool;
  onToolChange: (t: Tool) => void;
  onClear: () => void;
}

export default function Toolbar({ tool, onToolChange, onClear }: Props) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Board tools">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          className={`tool-btn${tool === t.id ? ' active' : ''}`}
          onClick={() => onToolChange(t.id)}
          aria-pressed={tool === t.id}
          title={t.hint ? `${t.label} (${t.key}) — ${t.hint}` : `${t.label} (${t.key})`}
        >
          <span className="tool-symbol" aria-hidden="true">{t.symbol}</span>
          <span className="tool-label">{t.label}</span>
          <span className="tool-key">{t.key}</span>
        </button>
      ))}
      <span className="toolbar-sep" />
      <button className="tool-btn clear" onClick={onClear}>
        <span className="tool-label">Clear board</span>
      </button>
    </div>
  );
}
