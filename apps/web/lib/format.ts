const MONTHS_GEN = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export const formatDay = (d: Date) => `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;

/** plural(5, ["ячейка", "ячейки", "ячеек"]) -> "5 ячеек" */
export function plural(n: number, [one, few, many]: [string, string, string]) {
  const m10 = n % 10;
  const m100 = n % 100;
  const word =
    m100 >= 11 && m100 <= 14 ? many : m10 === 1 ? one : m10 >= 2 && m10 <= 4 ? few : many;
  return `${n} ${word}`;
}

/** Shift length in hours; an end time before the start means the shift ends the next day. */
export function shiftHours(start: string, end: string) {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  let diff = toMin(end) - toMin(start);
  if (diff <= 0) diff += 24 * 60;
  return Math.round((diff / 60) * 10) / 10;
}
/** "08:00","18:00" -> "08 - 18"; keeps minutes when they aren't :00 */
export function shortRange(start: string, end: string) {
  const short = (t: string) => (t.endsWith(":00") ? t.slice(0, 2) : t);
  return `${short(start)} - ${short(end)}`;
}
