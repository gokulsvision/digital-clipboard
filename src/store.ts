import type { Board, BoardStorage } from './types';

const V4_KEY = 'tactical-board-v4';
const V3_KEY = 'tactical-board-v3';

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function blankBoard(name = 'Untitled board'): Board {
  return { name, markers: [], ballHolderId: null, arrows: [] };
}

function migrateV3(): BoardStorage | null {
  try {
    const raw = localStorage.getItem(V3_KEY);
    if (!raw) return null;
    const v3 = JSON.parse(raw);
    const page = v3 && Array.isArray(v3.pages) ? v3.pages[0] : null;
    if (!page || !Array.isArray(page.markers)) return null;
    // Dots become X's and O's at the same spots; the old attached passes and
    // run ghosts do not carry over because they belong to the old interaction.
    return {
      current: {
        name: typeof page.title === 'string' && page.title ? page.title : 'My board',
        markers: page.markers.map((m: { id: string; team: 'home' | 'away'; x: number; y: number }) => ({
          id: m.id,
          team: m.team === 'away' ? 'them' : 'us',
          x: m.x,
          y: m.y,
        })),
        ballHolderId: page.ballHolderId ?? null,
        arrows: [],
      },
      saved: [],
    };
  } catch {
    return null;
  }
}

export function loadStorage(): BoardStorage {
  try {
    const raw = localStorage.getItem(V4_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BoardStorage;
      if (parsed && parsed.current && Array.isArray(parsed.current.markers) && Array.isArray(parsed.saved)) {
        return parsed;
      }
    }
  } catch {
    // Corrupt storage falls through to migration or a fresh board.
  }
  return migrateV3() ?? { current: blankBoard(), saved: [] };
}

export function saveStorage(storage: BoardStorage): void {
  try {
    localStorage.setItem(V4_KEY, JSON.stringify(storage));
  } catch {
    // Storage may be unavailable (private mode); the app still works in memory.
  }
}

// Upsert the current board into the saved list by name.
export function saveNamed(storage: BoardStorage): BoardStorage {
  const name = storage.current.name.trim() || 'Untitled board';
  const board: Board = { ...storage.current, name };
  const existing = storage.saved.find((e) => e.name === name);
  const entry = { id: existing?.id ?? uid(), name, savedAt: Date.now(), board };
  const saved = existing
    ? storage.saved.map((e) => (e.id === existing.id ? entry : e))
    : [...storage.saved, entry];
  return { ...storage, current: board, saved };
}
