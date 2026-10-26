import type { SavedEntry } from '../types';

interface Props {
  saved: SavedEntry[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}

export default function SavedBoards({ saved, onOpen, onDelete, onNew, onClose }: Props) {
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <section className="saved-panel" aria-label="Saved boards">
        <div className="saved-head">
          <h2>Saved boards</h2>
          <button className="btn small" onClick={onClose}>Done</button>
        </div>
        {saved.length === 0 && <p className="hint">Nothing saved yet. Press Save to keep the current board here.</p>}
        {saved.map((e) => (
          <div className="saved-row" key={e.id}>
            <div className="saved-meta">
              <strong>{e.name}</strong>
              <span>{new Date(e.savedAt).toLocaleString()}</span>
            </div>
            <div className="saved-actions">
              <button className="btn small primary" onClick={() => onOpen(e.id)}>Open</button>
              <button className="btn small danger" onClick={() => onDelete(e.id)}>Delete</button>
            </div>
          </div>
        ))}
        <button className="btn" onClick={onNew}>＋ New board</button>
      </section>
    </>
  );
}
