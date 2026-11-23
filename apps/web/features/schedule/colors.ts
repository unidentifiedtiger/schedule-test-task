// Full class names so Tailwind can see them. Keyed by template colour; "custom" = no template.

/** Shift chip background in the calendar. A custom shift is solid blue. */
export const chipClass: Record<string, string> = {
  blue: "bg-shift-morning",
  purple: "bg-shift-day",
  teal: "bg-shift-evening",
  custom: "bg-primary",
};

/** Main text of a week-view chip (the time range). */
export const chipText: Record<string, string> = {
  blue: "text-ink",
  purple: "text-ink",
  teal: "text-ink",
  custom: "text-white",
};

/** Hours label ("8 ч"), tinted per template. */
export const chipAccent: Record<string, string> = {
  blue: "text-shift-morning-ink",
  purple: "text-shift-day-ink",
  teal: "text-shift-evening-ink",
  custom: "text-white",
};

/** Coloured left edge of a template card. */
export const edgeClass: Record<string, string> = {
  blue: "border-l-shift-morning-edge",
  purple: "border-l-shift-day-edge",
  teal: "border-l-shift-evening-edge",
  custom: "border-l-shift-custom-edge",
};
