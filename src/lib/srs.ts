import { addDays } from './dates';
import type { Card, Rating } from './types';

export const MIN_EASE = 1.3;
export const MAX_EASE = 3.0;
const QUALITY: Record<Rating, number> = { easy: 5, hard: 3, failed: 1 };

export function newCard(due: string): Card {
  return { ease: 2.5, interval: 0, reps: 0, lapses: 0, due };
}

/** SM-2 ease-factor update, clamped to [MIN_EASE, MAX_EASE]. */
export function nextEase(ease: number, rating: Rating): number {
  const q = QUALITY[rating];
  const e = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return Math.round(Math.min(MAX_EASE, Math.max(MIN_EASE, e)) * 100) / 100;
}

export function nextInterval(card: Card, rating: Rating): number {
  if (rating === 'failed') return 1;
  if (rating === 'hard') {
    if (card.reps === 0) return 1;
    if (card.reps === 1) return 3;
    return Math.max(card.interval + 1, Math.round(card.interval * 1.2));
  }
  if (card.reps === 0) return 3;
  if (card.reps === 1) return 7;
  return Math.max(card.interval + 1, Math.round(card.interval * card.ease));
}

export function review(card: Card, rating: Rating, today: string): Card {
  const interval = nextInterval(card, rating);
  return {
    ease: nextEase(card.ease, rating),
    interval,
    reps: rating === 'failed' ? 0 : card.reps + 1,
    lapses: rating === 'failed' ? card.lapses + 1 : card.lapses,
    due: addDays(today, interval),
  };
}

export function previewIntervals(card: Card): Record<Rating, number> {
  return {
    easy: nextInterval(card, 'easy'),
    hard: nextInterval(card, 'hard'),
    failed: nextInterval(card, 'failed'),
  };
}

/**
 * Due dates for `count` new problems, filling at most `perDay` new problems per day
 * starting today. `newPerDate` counts new (never reviewed) problems already queued per date.
 */
export function queueNew(newPerDate: Record<string, number>, count: number, perDay: number, today: string): string[] {
  const used = { ...newPerDate };
  const out: string[] = [];
  let day = today;
  const cap = Math.max(1, perDay);
  while (out.length < count) {
    if ((used[day] ?? 0) < cap) {
      used[day] = (used[day] ?? 0) + 1;
      out.push(day);
    } else {
      day = addDays(day, 1);
    }
  }
  return out;
}

/** Estimated recall probability t days after a review, tuned to hit 90% at the scheduled interval. */
export function retention(daysSinceReview: number, interval: number): number {
  const s = Math.max(interval, 0.5);
  return Math.exp((Math.log(0.9) * daysSinceReview) / s);
}

export function formatInterval(days: number): string {
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
