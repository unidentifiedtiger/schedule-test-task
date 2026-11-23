import type { ScheduleView } from "@app/shared";

/** Local-time YYYY-MM-DD (toISOString would shift the day in some timezones). */
export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Weeks start on Monday. */
export const startOfWeek = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));

export function getRange(view: ScheduleView, anchor: Date) {
  if (view === "week") {
    const from = startOfWeek(anchor);
    return { from, to: addDays(from, 6) };
  }
  return {
    from: new Date(anchor.getFullYear(), anchor.getMonth(), 1),
    to: new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0),
  };
}

export function getDays(view: ScheduleView, anchor: Date): Date[] {
  const { from, to } = getRange(view, anchor);
  const days: Date[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return days;
}

export function shiftAnchor(view: ScheduleView, anchor: Date, dir: 1 | -1) {
  return view === "week"
    ? addDays(anchor, 7 * dir)
    : new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
}

const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const MONTHS = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];
const MONTHS_SHORT = [
  "янв.",
  "февр.",
  "мар.",
  "апр.",
  "мая",
  "июн.",
  "июл.",
  "авг.",
  "сент.",
  "окт.",
  "нояб.",
  "дек.",
];

export function periodLabel(view: ScheduleView, anchor: Date) {
  const { from, to } = getRange(view, anchor);
  if (view === "month") {
    const month = MONTHS[from.getMonth()];
    return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${from.getFullYear()}`;
  }
  const fmt = (d: Date) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  return `${fmt(from)} – ${fmt(to)} ${to.getFullYear()}`;
}

export const weekdayShort = (d: Date) => WEEKDAYS[d.getDay()];
