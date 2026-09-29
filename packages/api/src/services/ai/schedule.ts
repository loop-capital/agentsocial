/**
 * Posting-time slots and timezone math.
 *
 * Slots are general engagement defaults per platform — NOT learned from the
 * brand's own analytics yet. API responses label them `basis: "default"`.
 */

export interface Slot { dow: number[]; hour: number; minute: number } // dow: 0=Sun … 6=Sat, local time

const WEEKDAYS = [1, 2, 3, 4, 5];
const ALL = [0, 1, 2, 3, 4, 5, 6];

export const DEFAULT_SLOTS: Record<string, Slot[]> = {
  instagram: [{ dow: [2, 3, 4], hour: 11, minute: 0 }, { dow: ALL, hour: 19, minute: 0 }],
  facebook: [{ dow: WEEKDAYS, hour: 9, minute: 0 }, { dow: ALL, hour: 13, minute: 0 }],
  linkedin: [{ dow: [2, 3, 4], hour: 8, minute: 30 }, { dow: WEEKDAYS, hour: 12, minute: 0 }],
  twitter: [{ dow: WEEKDAYS, hour: 9, minute: 0 }, { dow: ALL, hour: 12, minute: 0 }, { dow: ALL, hour: 17, minute: 0 }],
  tiktok: [{ dow: ALL, hour: 18, minute: 0 }, { dow: ALL, hour: 20, minute: 30 }],
  gbp: [{ dow: WEEKDAYS, hour: 10, minute: 0 }],
  youtube: [{ dow: [4, 5, 6], hour: 15, minute: 0 }],
  pinterest: [{ dow: ALL, hour: 20, minute: 0 }],
};

/** Convert a wall-clock time in an IANA timezone to a UTC Date. */
export function zonedTimeToUtc(y: number, mo: number, d: number, h: number, mi: number, tz: string): Date {
  const want = Date.UTC(y, mo - 1, d, h, mi);
  let guess = want;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(new Date(guess));
    const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
    const shown = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    guess += want - shown;
  }
  return new Date(guess);
}

/** Local calendar parts of `date` in `tz`. */
export function localParts(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "numeric", day: "numeric", weekday: "short",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { y: Number(get("year")), m: Number(get("month")), d: Number(get("day")), dow };
}

/**
 * Pick `count` distinct future slots for a platform, spread across the next
 * `days` days in the brand's timezone. `taken` (ISO strings) are avoided.
 */
export function pickSlots(
  platform: string,
  count: number,
  opts: { tz: string; days: number; now?: Date; taken?: Set<string> },
): Date[] {
  const { tz, days } = opts;
  const now = opts.now ?? new Date();
  const taken = opts.taken ?? new Set<string>();
  const slots = DEFAULT_SLOTS[platform] ?? DEFAULT_SLOTS.instagram;

  // Candidate list: every valid slot on every day, in time order.
  const candidates: Date[] = [];
  for (let offset = 0; offset < days; offset++) {
    const base = localParts(new Date(now.getTime() + offset * 86_400_000), tz);
    for (const s of slots) {
      if (!s.dow.includes(base.dow)) continue;
      const when = zonedTimeToUtc(base.y, base.m, base.d, s.hour, s.minute, tz);
      // Need a comfortable lead time so the job isn't already due.
      if (when.getTime() > now.getTime() + 30 * 60_000) candidates.push(when);
    }
  }
  candidates.sort((a, b) => a.getTime() - b.getTime());
  const free = candidates.filter((c) => !taken.has(c.toISOString()));
  if (free.length <= count) return free;

  // Spread evenly across the window instead of front-loading.
  const picked: Date[] = [];
  for (let i = 0; i < count; i++) picked.push(free[Math.floor((i * free.length) / count)]);
  return picked;
}
