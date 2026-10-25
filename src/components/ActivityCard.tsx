import { useMemo } from 'react';
import { computeActivity } from '../lib/activity';
import { formatShort, formatWeekday } from '../lib/dates';
import { useT } from '../lib/i18n';
import { useStore } from '../lib/store';

export function ActivityCard() {
  const { state, today } = useStore();
  const t = useT();
  const a = useMemo(() => computeActivity(state, today), [state, today]);
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / a.max) * 4)));

  return (
    <section className="card stack activity-card" style={{ marginTop: 16 }}>
      <h2 style={{ margin: 0 }}>{t('Consistency')}</h2>
      <div className="kv kv-3">
        <div>{t('Current streak')}<b className="streak-num">{t('{n} days', { n: a.current })}</b></div>
        <div>{t('Longest streak')}<b>{t('{n} days', { n: a.longest })}</b></div>
        <div>{t('Active days')}<b>{a.activeDays}</b></div>
      </div>
      <p className="hint-text" style={{ margin: 0 }}>
        {a.reviewedToday
          ? t('Reviewed today — streak is safe.')
          : a.current > 0
            ? t('Review one problem today to keep your {n}-day streak.', { n: a.current })
            : t('Review one problem today to start a streak.')}
      </p>
      <div className="heatmap" role="img" aria-label={t('Daily reviews over the last 20 weeks')}>
        {a.weeks.map((col, w) => (
          <div key={w} className="hm-col">
            {col.map((c, i) => (
              <span key={i} className={c ? `hm hm-${level(c.n)}${c.date === today ? ' hm-today' : ''}` : 'hm hm-out'} title={c ? t('{date}: {n} reviews', { date: formatShort(c.date), n: c.n }) : undefined} />
            ))}
          </div>
        ))}
      </div>
      <div className="row hint-text hm-legend">
        {t('Less')}
        {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`hm hm-${l}`} />)}
        {t('More')} · {t('Last 20 weeks')}
      </div>
      <h3 className="sub-h">{t('Next 7 days')}</h3>
      <div className="forecast forecast-mini" aria-label={t('Next 7 days')}>
        {a.forecast.map((f, i) => (
          <div key={f.date} className="forecast-day">
            {i === 0 ? t('Today') : formatWeekday(f.date)}
            <b>{f.n}</b>
          </div>
        ))}
      </div>
    </section>
  );
}
