import { useState } from 'react';
import { diffDays } from '../lib/dates';
import { formatInterval, previewIntervals } from '../lib/srs';
import type { Problem, Rating } from '../lib/types';
import { JudgeBadge } from './JudgeBadge';
import { StruggleStatus, VerdictChips } from './VerdictChips';

interface Props {
  problem: Problem;
  hasDemoHints?: boolean;
  today: string;
  onRate: (rating: Rating) => void;
  onOpen: () => void;
}

const LABEL: Record<Rating, string> = { easy: 'Easy', hard: 'Hard', failed: 'Failed' };

export function ReviewRow({ problem, hasDemoHints, today, onRate, onOpen }: Props) {
  const [leaving, setLeaving] = useState(false);
  const preview = previewIntervals(problem.card);
  const overdue = diffDays(today, problem.card.due);
  const rate = (r: Rating) => {
    setLeaving(true);
    setTimeout(() => onRate(r), 220);
  };
  return (
    <li className={`review-row${leaving ? ' leaving' : ''}`}>
      <div className="review-main" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && onOpen()} aria-label={`Details for ${problem.title}`}>
        <div className="review-title">
          <JudgeBadge judge={problem.judge} />
          <a href={problem.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} title="Open on the judge">
            {problem.title} ↗
          </a>
        </div>
        <div className="review-meta">
          <StruggleStatus struggle={problem.struggle} />
          <VerdictChips struggle={problem.struggle} />
          {problem.difficulty != null && <span className="mono">★ {problem.difficulty}</span>}
          {problem.history.length === 0 ? <span>new</span> : <span>review #{problem.history.length + 1}</span>}
          {overdue > 0 && <span className="overdue">overdue {overdue}d</span>}
          {hasDemoHints && <span className="tag tag-hint" title="Pre-generated AI demo hints">✦ hints</span>}
        </div>
        {problem.note && <div className="note-preview">{problem.note}</div>}
      </div>
      <div className="rate" role="group" aria-label="How did it go?">
        {(['easy', 'hard', 'failed'] as Rating[]).map((r) => (
          <button key={r} className={`btn ${r}`} onClick={() => rate(r)} disabled={leaving}>
            {LABEL[r]}
            <small>{formatInterval(preview[r])}</small>
          </button>
        ))}
      </div>
    </li>
  );
}
