import { environment } from '../../environments/environment';

/** 'YYYY-MM-DD' for a Date, as seen in the business timezone (not the browser's). */
export function dateInZone(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: environment.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** The next `count` days starting today, ready for a date picker. */
export function nextDays(count: number): { value: string; day: string; num: string; month: string }[] {
  const out = [];
  const fmt = (opts: Intl.DateTimeFormatOptions, d: Date) => new Intl.DateTimeFormat('en-IN', { timeZone: environment.timezone, ...opts }).format(d);
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.now() + i * 86400000);
    out.push({ value: dateInZone(d), day: i === 0 ? 'Today' : fmt({ weekday: 'short' }, d), num: fmt({ day: 'numeric' }, d), month: fmt({ month: 'short' }, d) });
  }
  return out;
}
