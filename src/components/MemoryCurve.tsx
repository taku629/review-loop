import { addDays, diffDays, formatShort } from '../lib/dates';
import { retention } from '../lib/srs';
import type { Problem } from '../lib/types';

const W = 470;
const H = 150;
const PAD = { l: 34, r: 10, t: 12, b: 24 };

/** Estimated recall since the problem was added: each review resets memory to 100%, then it decays along that interval's curve. */
export function MemoryCurve({ problem, today }: { problem: Problem; today: string }) {
  const start = problem.history[0]?.date ?? problem.addedAt;
  const end = addDays(problem.card.due > today ? problem.card.due : today, 2);
  const span = Math.max(4, diffDays(end, start));
  const x = (d: string) => PAD.l + (diffDays(d, start) / span) * (W - PAD.l - PAD.r);
  const y = (r: number) => PAD.t + (1 - r) * (H - PAD.t - PAD.b);

  const pts: string[] = [];
  let anchor = start;
  let interval = 1;
  const reviews = new Map(problem.history.map((h) => [h.date, h.interval]));
  for (let i = 0; i <= span; i++) {
    const d = addDays(start, i);
    if (reviews.has(d)) {
      pts.push(`${x(d)},${y(retention(diffDays(d, anchor), interval))}`);
      anchor = d;
      interval = Math.max(1, reviews.get(d)!);
    }
    pts.push(`${x(d)},${y(retention(diffDays(d, anchor), interval))}`);
  }
  const todayX = x(today);
  return (
    <svg className="curve" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Estimated memory retention over time">
      <defs>
        <linearGradient id="curveFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7c6cff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#7c6cff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[1, 0.9, 0.5].map((r) => (
        <g key={r}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(r)} y2={y(r)} stroke="#24304f" strokeDasharray={r === 0.9 ? '4 4' : undefined} />
          <text x={4} y={y(r) + 4} fill="#5d6785" fontSize="10">{Math.round(r * 100)}%</text>
        </g>
      ))}
      <polygon points={`${PAD.l},${y(0)} ${pts.join(' ')} ${x(end)},${y(0)}`} fill="url(#curveFill)" />
      <polyline points={pts.join(' ')} fill="none" stroke="#7c6cff" strokeWidth="2" />
      {problem.history.map((h, i) => (
        <circle key={i} cx={x(h.date)} cy={y(1)} r="4" fill={h.rating === 'easy' ? '#3fb950' : h.rating === 'hard' ? '#d29922' : '#f85149'} />
      ))}
      {todayX >= PAD.l && todayX <= W - PAD.r && (
        <g>
          <line x1={todayX} x2={todayX} y1={PAD.t} y2={H - PAD.b} stroke="#4fd1c5" />
          <text x={todayX + 3} y={H - 8} fill="#4fd1c5" fontSize="10">today</text>
        </g>
      )}
      <line x1={x(problem.card.due)} x2={x(problem.card.due)} y1={PAD.t} y2={H - PAD.b} stroke="#e6e9f2" strokeDasharray="2 3" opacity="0.6" />
      <text x={Math.min(x(problem.card.due) + 3, W - 70)} y={y(0.5) - 6} fill="#8b95b0" fontSize="10">next {formatShort(problem.card.due)}</text>
    </svg>
  );
}
