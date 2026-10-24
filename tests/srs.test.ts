import { describe, expect, it } from 'vitest';
import { newCard, nextEase, previewIntervals, queueNew, retention, review } from '../src/lib/srs';

const T = '2026-10-24';

describe('review scheduling', () => {
  it('schedules a new problem by rating', () => {
    const c = newCard(T);
    expect(review(c, 'easy', T)).toMatchObject({ interval: 3, due: '2026-10-27', reps: 1 });
    expect(review(c, 'hard', T)).toMatchObject({ interval: 1, due: '2026-10-25', reps: 1 });
    expect(review(c, 'failed', T)).toMatchObject({ interval: 1, due: '2026-10-25', reps: 0, lapses: 1 });
  });

  it('grows intervals on repeated Easy (3 -> 7 -> 19)', () => {
    let c = newCard(T);
    const intervals: number[] = [];
    let day = T;
    for (let i = 0; i < 4; i++) {
      c = review(c, 'easy', day);
      intervals.push(c.interval);
      day = c.due;
    }
    expect(intervals.slice(0, 3)).toEqual([3, 7, 19]);
    expect(intervals[3]).toBeGreaterThan(19);
  });

  it('Failed resets progress and lowers ease, Hard lowers ease slightly', () => {
    let c = review(review(newCard(T), 'easy', T), 'easy', T);
    const failed = review(c, 'failed', T);
    expect(failed.reps).toBe(0);
    expect(failed.ease).toBeLessThan(c.ease);
    c = review(newCard(T), 'hard', T);
    expect(c.ease).toBeCloseTo(2.36);
    expect(nextEase(1.3, 'failed')).toBe(1.3);
    expect(nextEase(3.0, 'easy')).toBe(3.0);
  });

  it('previews intervals for the buttons', () => {
    expect(previewIntervals(newCard(T))).toEqual({ easy: 3, hard: 1, failed: 1 });
  });

  it('queues new problems at most N per day', () => {
    expect(queueNew({ [T]: 4 }, 4, 5, T)).toEqual([T, '2026-10-25', '2026-10-25', '2026-10-25']);
  });

  it('retention is 90% at the scheduled interval', () => {
    expect(retention(0, 7)).toBe(1);
    expect(retention(7, 7)).toBeCloseTo(0.9);
    expect(retention(14, 7)).toBeCloseTo(0.81);
  });
});
