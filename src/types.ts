export type Theme = 'dark' | 'light';

export interface Marker {
  id: string;
  team: 'us' | 'them';
  x: number;
  y: number;
}

export interface Arrow {
  id: string;
  kind: 'pass' | 'run';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  // Passes bow to one side of the drag; Shift while drawing flips the side.
  flip?: boolean;
}

export interface Board {
  name: string;
  markers: Marker[];
  ballHolderId: string | null;
  arrows: Arrow[];
}

export interface SavedEntry {
  id: string;
  name: string;
  savedAt: number;
  board: Board;
}

export interface BoardStorage {
  current: Board;
  saved: SavedEntry[];
}
