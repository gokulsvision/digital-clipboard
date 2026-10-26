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
  // Optional bend anchor: the path passes through this point at its middle.
  // Dragging the middle handle sets it; absent means straight (runs) or
  // auto-bowed (passes).
  mx?: number;
  my?: number;
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
