const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, days: number): string {
  const d = parseISODate(s);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseISODate(a).getTime() - parseISODate(b).getTime()) / 86_400_000);
}

export function todayISO(offsetDays = 0, now: Date = new Date()): string {
  return addDays(toISODate(now), offsetDays);
}

let dateLang: 'en' | 'ja' = 'en';
const locale = () => (dateLang === 'ja' ? 'ja-JP' : 'en-US');

/** Set by the app on every render so date labels follow the UI language. */
export function setDateLang(l: 'en' | 'ja'): void {
  dateLang = l;
}

export function formatDayOfMonth(s: string): string {
  return String(parseISODate(s).getDate());
}

export function formatShort(s: string): string {
  return parseISODate(s).toLocaleDateString(locale(), { month: 'short', day: 'numeric' });
}

export function formatWeekday(s: string): string {
  return parseISODate(s).toLocaleDateString(locale(), { weekday: 'short' });
}

export function relativeDays(due: string, today: string): string {
  const d = diffDays(due, today);
  if (dateLang === 'ja') return d === 0 ? '今日' : d === 1 ? '明日' : d === -1 ? '昨日' : d > 0 ? `${d}日後` : `${-d}日前`;
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  if (d === -1) return 'yesterday';
  return d > 0 ? `in ${d} days` : `${-d} days ago`;
}
