import { plural, useT } from '../lib/i18n';
import { formatShort, relativeDays } from '../lib/dates';
import { useDemoHints } from '../lib/hints';
import { selectDue, useStore } from '../lib/store';

interface Props {
  onOpen: (id: string) => void;
  onToast: (msg: string) => void;
}

/** Short guided checklist shown after "Try with demo handles": rate → reveal a hint → jump the clock. */
export function DemoTour({ onOpen, onToast }: Props) {
  const { state, dispatch, today } = useStore();
  const demoHints = useDemoHints();
  const t = useT();
  const problems = Object.values(state.problems);
  const due = selectDue(state, today);
  const lastLog = state.reviewLog[state.reviewLog.length - 1];
  const last = lastLog && state.problems[lastLog.id];
  const hinted = problems.some((p) => p.hints.length > 0);
  const offset = state.settings.clockOffset;
  const hintTarget = due.find((p) => demoHints[p.id]) ?? problems.find((p) => demoHints[p.id]);

  const jump = () => {
    dispatch({ type: 'settings', patch: { clockOffset: offset + 3 } });
    onToast(t('Demo clock +3 days — problems you rated come back when they are due'));
  };
  const steps = [
    {
      done: !!last,
      title: t('Rate a problem'),
      body: last
        ? t('{title} moved to {date} ({rel}).', { title: last.title, date: formatShort(last.card.due), rel: relativeDays(last.card.due, today) })
        : t('Press Easy, Hard or Failed on any row. The small label under each button is the next interval.'),
    },
    {
      done: hinted,
      title: t('Reveal an AI hint'),
      body: t('Problems marked ✦ have pre-generated Hint 1 → Hint 2 → Approach.'),
      action: hintTarget && !hinted ? <button className="btn btn-sm" onClick={() => onOpen(hintTarget.id)}>{t('Open {key}', { key: hintTarget.key })}</button> : null,
    },
    {
      done: offset > 0,
      title: t('Jump ahead in time'),
      body: offset > 0 ? t('Demo clock is +{n} days: {d} {reviews} due now.', { n: offset, d: due.length, reviews: plural(due.length, 'review') }) : t('Move the demo clock forward to watch reviews come back.'),
      action: <button className="btn btn-sm" onClick={jump}>{t('+3 days')}</button>,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="card demo-tour" aria-label="Demo tour">
      <div className="demo-tour-head">
        <div>
          <b>{t('60-second demo tour')}</b> <span className="muted">· {doneCount}/3 · {t('real data for chokudai (AtCoder) and tourist (Codeforces)')}</span>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={() => dispatch({ type: 'settings', patch: { demoTour: false } })} aria-label="Close demo tour">
          {doneCount === 3 ? t('Done') : t('Hide')}
        </button>
      </div>
      <ol className="demo-steps">
        {steps.map((s, i) => (
          <li key={s.title} className={s.done ? 'done' : ''}>
            <span className="num">{s.done ? '✓' : i + 1}</span>
            <div>
              <b>{s.title}</b>
              <div className="muted">{s.body}</div>
            </div>
            {s.action}
          </li>
        ))}
      </ol>
    </section>
  );
}
