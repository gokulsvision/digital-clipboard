import { useEffect, useId, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { Arrow, Board as BoardData, Marker, Theme } from '../types';
import { uid } from '../store';
import Pitch from './Pitch';

export type Tool = 'move' | 'x' | 'o' | 'ball' | 'pass' | 'run' | 'erase';

const RATIO = 1.7;

const PALETTE: Record<Theme, { us: string; them: string; pass: string; run: string }> = {
  dark: { us: '#58cafa', them: '#fb8794', pass: '#ffd074', run: 'rgba(255,255,255,0.92)' },
  light: { us: '#0a84ff', them: '#e02d3c', pass: '#e08600', run: '#3a3a3c' },
};

interface Props {
  board: BoardData;
  tool: Tool;
  theme: Theme;
  onToolChange: (t: Tool) => void;
  onChange: (updater: (b: BoardData) => BoardData) => void;
  onPushHistory: () => void;
  onPopHistory: () => void;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export default function BoardView({ board, tool, theme, onToolChange, onChange, onPushHistory, onPopHistory }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<
    | { type: 'marker'; id: string }
    | { type: 'arrow-body'; id: string; startX: number; startY: number; orig: Arrow }
    | { type: 'arrow-end'; id: string; end: 'start' | 'end' }
    | null
  >(null);
  const drawRef = useRef<{ kind: 'pass' | 'run'; x1: number; y1: number; flip: boolean; current: Arrow | null } | null>(null);
  // Last cursor position over the pitch, so hotkeys place at the mouse.
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Arrow | null>(null);

  const headId = useId();
  const H = 100 / RATIO;
  const colors = PALETTE[theme];

  function toNorm(clientX: number, clientY: number): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x: 50, y: H / 2 };
    const rect = svg.getBoundingClientRect();
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 3, 97),
      y: clamp(((clientY - rect.top) / rect.height) * H, 3, H - 3),
    };
  }

  function capture(e: RPointerEvent<SVGSVGElement>) {
    try {
      svgRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // Pointer may already be gone (e.g. synthetic or cancelled events).
    }
  }

  // Track the cursor over the pitch for cursor-anchored hotkeys.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;
      mousePosRef.current = inside ? toNorm(e.clientX, e.clientY) : null;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  });

  function placeMarker(team: 'us' | 'them', at?: { x: number; y: number }) {
    // Clicks and taps pass their exact position; hotkeys use the cursor.
    const pos = at ?? mousePosRef.current ?? { x: 50, y: H / 2 };
    const marker: Marker = { id: uid(), team, x: pos.x, y: pos.y };
    onPushHistory();
    onChange((b) => ({ ...b, markers: [...b.markers, marker] }));
    setSelectedId(marker.id);
  }

  function markerAt(e: RPointerEvent<SVGSVGElement>): Marker | null {
    const el = (e.target as Element).closest('g.marker');
    const id = el?.getAttribute('data-mid') ?? null;
    return id ? board.markers.find((m) => m.id === id) ?? null : null;
  }

  function onPitchDown(e: RPointerEvent<SVGSVGElement>) {
    const at = toNorm(e.clientX, e.clientY);
    if (tool === 'x' || tool === 'o') {
      placeMarker(tool === 'x' ? 'us' : 'them', at);
      return;
    }
    const marker = markerAt(e);
    if (tool === 'ball') {
      if (marker) {
        onPushHistory();
        onChange((b) => ({ ...b, ballHolderId: b.ballHolderId === marker.id ? null : marker.id }));
      }
      return;
    }
    if (tool === 'erase') {
      if (marker) {
        onPushHistory();
        onChange((b) => ({
          ...b,
          markers: b.markers.filter((m) => m.id !== marker.id),
          ballHolderId: b.ballHolderId === marker.id ? null : b.ballHolderId,
        }));
        setSelectedId(null);
        return;
      }
      const arrowEl = (e.target as Element).closest('[data-arrow-id]');
      const id = arrowEl?.getAttribute('data-arrow-id') ?? null;
      if (id) {
        onPushHistory();
        onChange((b) => ({ ...b, arrows: b.arrows.filter((a) => a.id !== id) }));
        setSelectedId(null);
      }
      return;
    }
    if (tool === 'pass' || tool === 'run') {
      onPushHistory();
      drawRef.current = { kind: tool, x1: at.x, y1: at.y, flip: e.shiftKey, current: null };
      setPreview({ id: 'preview', kind: tool, x1: at.x, y1: at.y, x2: at.x, y2: at.y, flip: e.shiftKey });
      capture(e);
      e.preventDefault();
      return;
    }
    // Move tool: drag a marker, drag/reshape an arrow, or clear the selection.
    if (marker) {
      setSelectedId(marker.id);
      onPushHistory(); // a drag may follow
      dragRef.current = { type: 'marker', id: marker.id };
      capture(e);
      e.preventDefault();
      return;
    }
    const arrowEl = (e.target as Element).closest('[data-arrow-id]');
    if (arrowEl) {
      const id = arrowEl.getAttribute('data-arrow-id');
      const arrow = board.arrows.find((a) => a.id === id);
      if (arrow) {
        setSelectedId(arrow.id);
        onPushHistory();
        const nearEnd = Math.hypot(at.x - arrow.x2, at.y - arrow.y2) < 2.8;
        const nearStart = Math.hypot(at.x - arrow.x1, at.y - arrow.y1) < 2.8;
        if (nearEnd) dragRef.current = { type: 'arrow-end', id: arrow.id, end: 'end' };
        else if (nearStart) dragRef.current = { type: 'arrow-end', id: arrow.id, end: 'start' };
        else dragRef.current = { type: 'arrow-body', id: arrow.id, startX: at.x, startY: at.y, orig: { ...arrow } };
        capture(e);
        e.preventDefault();
        return;
      }
      setSelectedId(id);
      return;
    }
    setSelectedId(null);
  }

  function onPitchMove(e: RPointerEvent<SVGSVGElement>) {
    if (tool === 'erase') {
      // Hover-to-erase: sweep the cursor over markers or arrows to delete them.
      const marker = markerAt(e);
      if (marker) {
        onPushHistory();
        onChange((b) => ({
          ...b,
          markers: b.markers.filter((m) => m.id !== marker.id),
          ballHolderId: b.ballHolderId === marker.id ? null : b.ballHolderId,
        }));
        return;
      }
      const arrowEl = (e.target as Element).closest('[data-arrow-id]');
      const id = arrowEl?.getAttribute('data-arrow-id') ?? null;
      if (id) {
        onPushHistory();
        onChange((b) => ({ ...b, arrows: b.arrows.filter((a) => a.id !== id) }));
      }
      return;
    }
    if (drawRef.current) {
      const d = drawRef.current;
      const at = toNorm(e.clientX, e.clientY);
      // Keep the latest geometry in the ref so pointerup always sees fresh
      // values even if React has not flushed the preview state yet.
      const arrow: Arrow = { id: 'preview', kind: d.kind, x1: d.x1, y1: d.y1, x2: at.x, y2: at.y, flip: d.flip };
      d.current = arrow;
      setPreview(arrow);
      return;
    }
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.type === 'marker') {
      const { x, y } = toNorm(e.clientX, e.clientY);
      onChange((b) => ({ ...b, markers: b.markers.map((m) => (m.id === drag.id ? { ...m, x, y } : m)) }));
      return;
    }
    const at = toNorm(e.clientX, e.clientY);
    if (drag.type === 'arrow-body') {
      // Translate the whole arrow: shifts it and re-angles it on the pitch.
      const dx = at.x - drag.startX;
      const dy = at.y - drag.startY;
      onChange((b) => ({
        ...b,
        arrows: b.arrows.map((a) =>
          a.id === drag.id
            ? { ...a, x1: drag.orig.x1 + dx, y1: drag.orig.y1 + dy, x2: drag.orig.x2 + dx, y2: drag.orig.y2 + dy }
            : a,
        ),
      }));
      return;
    }
    // arrow-end: move just one end to reshape / extend the arrow.
    onChange((b) => ({
      ...b,
      arrows: b.arrows.map((a) =>
        a.id === drag.id ? (drag.end === 'end' ? { ...a, x2: at.x, y2: at.y } : { ...a, x1: at.x, y1: at.y }) : a,
      ),
    }));
  }

  function onPitchUp() {
    const d = drawRef.current;
    if (d) {
      if (d.current) {
        const { kind, x1, y1, x2, y2, flip } = d.current;
        if (Math.hypot(x2 - x1, y2 - y1) > 3) {
          onChange((b) => ({ ...b, arrows: [...b.arrows, { id: uid(), kind, x1, y1, x2, y2, flip }] }));
        } else {
          // No arrow drawn; drop the history entry pushed at draw start.
          onPopHistory();
        }
      } else {
        onPopHistory();
      }
      drawRef.current = null;
      setPreview(null);
    }
    dragRef.current = null;
  }

  function deleteSelected() {
    if (!selectedId) return;
    const isMarker = board.markers.some((m) => m.id === selectedId);
    onPushHistory();
    onChange((b) =>
      isMarker
        ? { ...b, markers: b.markers.filter((m) => m.id !== selectedId), ballHolderId: b.ballHolderId === selectedId ? null : b.ballHolderId }
        : { ...b, arrows: b.arrows.filter((a) => a.id !== selectedId) },
    );
    setSelectedId(null);
  }

  function giveBallToHovered() {
    const target = hoveredId ?? selectedId;
    if (!target || !board.markers.some((m) => m.id === target)) return;
    onPushHistory();
    onChange((b) => ({ ...b, ballHolderId: b.ballHolderId === target ? null : target }));
  }

  // Keyboard shortcuts. X/O place at the cursor right away and stay active
  // so several markers can be placed in a row.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const k = e.key.toLowerCase();
      if (k === 'x') {
        onToolChange('x');
        if (mousePosRef.current) placeMarker('us');
      } else if (k === 'o') {
        onToolChange('o');
        if (mousePosRef.current) placeMarker('them');
      } else if (k === 'b') {
        onToolChange('ball');
        giveBallToHovered();
      } else if (k === 'v') onToolChange('move');
      else if (k === 'p') onToolChange('pass');
      else if (k === 'r') onToolChange('run');
      else if (k === 'e') onToolChange('erase');
      else if (k === 'backspace' || k === 'delete') deleteSelected();
      else if (k === 'escape') setSelectedId(null);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Passes are drawn as a gentle arc; runs stay straight. Shift flips the bow.
  function arrowPath(a: Arrow): string {
    if (a.kind === 'run') return `M ${a.x1} ${a.y1} L ${a.x2} ${a.y2}`;
    const dx = a.x2 - a.x1;
    const dy = a.y2 - a.y1;
    const len = Math.hypot(dx, dy);
    if (len < 0.01) return `M ${a.x1} ${a.y1} L ${a.x2} ${a.y2}`;
    const bow = len * 0.18 * (a.flip ? -1 : 1);
    const cx = (a.x1 + a.x2) / 2 - (dy / len) * bow;
    const cy = (a.y1 + a.y2) / 2 + (dx / len) * bow;
    return `M ${a.x1} ${a.y1} Q ${cx} ${cy} ${a.x2} ${a.y2}`;
  }

  function renderArrow(a: Arrow, isPreview: boolean) {
    const isSel = !isPreview && a.id === selectedId;
    const d = arrowPath(a);
    const handleColor = a.kind === 'pass' ? colors.pass : colors.run;
    return (
      <g key={a.id} data-arrow-id={isPreview ? undefined : a.id} style={{ cursor: 'pointer' }}>
        <path
          d={d}
          fill="none"
          stroke={isSel ? (theme === 'dark' ? '#fff' : '#000') : a.kind === 'pass' ? colors.pass : colors.run}
          strokeWidth={isSel ? 1.1 : 0.85}
          strokeDasharray={a.kind === 'pass' ? '2.4 1.9' : undefined}
          strokeLinecap="round"
          markerEnd={`url(#${headId}-${a.kind})`}
          opacity={isPreview ? 0.7 : 1}
        />
        {!isPreview && <path d={d} fill="none" stroke="transparent" strokeWidth={2.6} strokeLinecap="round" />}
        {isSel && (
          <g style={{ pointerEvents: 'none' }}>
            <circle cx={a.x1} cy={a.y1} r={1.5} fill="#fff" stroke={handleColor} strokeWidth={0.5} />
            {/* the head handle is where you grab to extend or re-angle */}
            <circle cx={a.x2} cy={a.y2} r={1.8} fill="#fff" stroke={handleColor} strokeWidth={0.6} />
            <circle cx={a.x2} cy={a.y2} r={0.6} fill={handleColor} />
          </g>
        )}
      </g>
    );
  }

  return (
    <div className="board-card">
      <svg
        ref={svgRef}
        className={`pitch-svg${tool === 'pass' || tool === 'run' ? ' drawing' : ''}`}
        viewBox={`0 0 100 ${H}`}
        onPointerDown={onPitchDown}
        onPointerMove={onPitchMove}
        onPointerUp={onPitchUp}
        onPointerCancel={onPitchUp}
        role="img"
        aria-label={`Tactics board: ${board.name}`}
      >
        <defs>
          <marker id={`${headId}-pass`} markerWidth="6" markerHeight="6" refX="4.6" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill={colors.pass} />
          </marker>
          <marker id={`${headId}-run`} markerWidth="6" markerHeight="6" refX="4.6" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill={colors.run} />
          </marker>
        </defs>
        <Pitch theme={theme} />
        {board.arrows.map((a) => renderArrow(a, false))}
        {preview && renderArrow(preview, true)}
        {board.markers.map((m) => {
          const color = m.team === 'us' ? colors.us : colors.them;
          const hasBall = board.ballHolderId === m.id;
          const isSel = m.id === selectedId;
          return (
            <g
              key={m.id}
              className="marker"
              data-mid={m.id}
              onPointerEnter={() => setHoveredId(m.id)}
              onPointerLeave={() => setHoveredId((h) => (h === m.id ? null : h))}
              style={{ cursor: tool === 'move' ? 'grab' : 'pointer', touchAction: 'none' }}
            >
              {isSel && <circle cx={m.x} cy={m.y} r={5.4} fill="none" stroke="#ff9f0a" strokeWidth={0.7} />}
              <circle cx={m.x} cy={m.y} r={4.4} fill="transparent" />
              {m.team === 'us' ? (
                <g stroke={color} strokeWidth={1.25} strokeLinecap="round">
                  <line x1={m.x - 2.3} y1={m.y - 2.3} x2={m.x + 2.3} y2={m.y + 2.3} />
                  <line x1={m.x - 2.3} y1={m.y + 2.3} x2={m.x + 2.3} y2={m.y - 2.3} />
                </g>
              ) : (
                <circle cx={m.x} cy={m.y} r={2.5} fill="none" stroke={color} strokeWidth={1.25} />
              )}
              {hasBall && (
                <g>
                  <circle cx={m.x + 3.8} cy={m.y - 3.8} r={1.9} fill="#f8fff8" stroke="#22312c" strokeWidth={0.35} />
                  <circle cx={m.x + 3.8} cy={m.y - 3.8} r={0.7} fill="#22312c" />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
