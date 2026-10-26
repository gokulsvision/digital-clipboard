import { useEffect, useRef, useState } from 'react';
import type { Board, BoardStorage, Theme } from './types';
import { blankBoard, loadStorage, saveNamed, saveStorage } from './store';
import BoardView, { type Tool } from './components/Board';
import Toolbar from './components/Toolbar';
import SavedBoards from './components/SavedBoards';

const THEME_KEY = 'tactical-board-theme';

function loadTheme(): Theme {
  return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
}

export default function App() {
  const [storage, setStorage] = useState<BoardStorage>(loadStorage);
  const [tool, setTool] = useState<Tool>('move');
  const [panelOpen, setPanelOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const board = storage.current;
  const historyRef = useRef<Array<Board>>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Autosave the current board so a refresh never loses work.
  useEffect(() => {
    const t = window.setTimeout(() => saveStorage(storage), 400);
    return () => window.clearTimeout(t);
  }, [storage]);

  function updateBoard(updater: (b: Board) => Board) {
    setStorage((s) => ({ ...s, current: updater(s.current) }));
  }

  // One history entry per gesture (a placement, a drag, a draw...), pushed
  // when the gesture starts. Deduped so React's double-invoked updaters in
  // dev do not create two entries for one gesture.
  function pushHistory() {
    setStorage((s) => {
      const h = historyRef.current;
      const last = h[h.length - 1];
      if (!last || JSON.stringify(last) !== JSON.stringify(s.current)) {
        historyRef.current = [...h.slice(-99), s.current];
      }
      return s;
    });
  }

  function popHistory() {
    historyRef.current.pop();
  }

  function undo() {
    const prev = historyRef.current.pop();
    if (prev) setStorage((s) => ({ ...s, current: prev }));
  }

  // Undo shortcut (Cmd/Ctrl+Z).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function handleSave() {
    historyRef.current = [];
    setStorage((s) => saveNamed(s));
  }

  function openSaved(id: string) {
    historyRef.current = [];
    setStorage((s) => {
      const entry = s.saved.find((e) => e.id === id);
      return entry ? { ...s, current: JSON.parse(JSON.stringify(entry.board)) } : s;
    });
    setPanelOpen(false);
    setTool('move');
  }

  function deleteSaved(id: string) {
    setStorage((s) => ({ ...s, saved: s.saved.filter((e) => e.id !== id) }));
  }

  function newBoard() {
    const isDirty = board.markers.length > 0 || board.arrows.length > 0;
    if (isDirty && !window.confirm('Start a new board? The current board stays in Saved boards if you saved it.')) return;
    historyRef.current = [];
    setStorage((s) => ({ ...s, current: blankBoard() }));
    setPanelOpen(false);
    setTool('move');
  }

  function clearBoard() {
    if (!window.confirm('Clear the whole board?')) return;
    pushHistory();
    updateBoard((b) => ({ ...b, markers: [], arrows: [], ballHolderId: null }));
    setTool('move');
  }

  return (
    <div className="app">
      <header className="topbar">
        <input
          className="board-name"
          value={board.name}
          onChange={(e) => updateBoard((b) => ({ ...b, name: e.target.value }))}
          aria-label="Board name"
          placeholder="Board name"
        />
        <div className="top-actions">
          <button
            className="btn"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            title="Switch theme"
          >
            {theme === 'dark' ? '☀︎ Light' : '☾ Dark'}
          </button>
          <button className="btn" onClick={handleSave}>Save</button>
          <button className="btn" onClick={() => setPanelOpen(true)}>Saved boards</button>
        </div>
      </header>

      <main className="board-area">
        <BoardView
          board={board}
          tool={tool}
          theme={theme}
          onToolChange={setTool}
          onChange={updateBoard}
          onPushHistory={pushHistory}
          onPopHistory={popHistory}
        />
        <Toolbar tool={tool} onToolChange={setTool} onClear={clearBoard} />
        <p className="us-them">
          <span className="legend-x">✕</span> us
          <span className="legend-o">○</span> them
          <span className="legend-ball">⚽</span> ball holder
          <span className="legend-undo">⌘Z</span> undo
          <span className="legend-undo">⇧</span> flips pass curve
          <span className="legend-undo">◍</span> drag arrow body to move · ends to reshape · middle to bend
        </p>
      </main>

      {panelOpen && (
        <SavedBoards
          saved={storage.saved}
          onOpen={openSaved}
          onDelete={deleteSaved}
          onNew={newBoard}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </div>
  );
}
