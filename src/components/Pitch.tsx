import type { Theme } from '../types';

// Clean, flat coach-board pitch: no gradients or stripes, just markings.
const RATIO = 1.7;

export default function Pitch({ theme }: { theme: Theme }) {
  const H = 100 / RATIO;
  const fill = theme === 'dark' ? '#0e0f11' : '#eef0f2';
  const line = theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)';
  const goalFill = theme === 'dark' ? '#1f2937' : '#c7ccd1';
  const gw = 16;
  const bw = 32;
  const bd = 13;
  return (
    <g>
      <rect width={100} height={H} fill={fill} />
      <g fill="none" stroke={line} strokeWidth={0.5}>
        <rect x={1.2} y={1.2} width={97.6} height={H - 2.4} />
        <line x1={50} y1={1.2} x2={50} y2={H - 1.2} />
        <circle cx={50} cy={H / 2} r={9} />
        <rect x={1.2} y={H / 2 - bw / 2} width={bd} height={bw} />
        <rect x={98.8 - bd} y={H / 2 - bw / 2} width={bd} height={bw} />
      </g>
      <circle cx={50} cy={H / 2} r={0.85} fill={line} />
      <rect x={0.4} y={H / 2 - gw / 2} width={1.6} height={gw} fill={goalFill} stroke={line} strokeWidth={0.4} />
      <rect x={98} y={H / 2 - gw / 2} width={1.6} height={gw} fill={goalFill} stroke={line} strokeWidth={0.4} />
    </g>
  );
}
