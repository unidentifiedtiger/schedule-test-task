/** Identifies one calendar cell: an employee on a date (YYYY-MM-DD). */
export const cellKey = (employeeId: number, iso: string) => `${employeeId}:${iso}`;

export function parseCellKey(key: string) {
  const [id, date] = key.split(":");
  return { employeeId: Number(id), date };
}

/** What a click carries that matters for selection (works for mouse and keyboard events). */
export type Modifiers = { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean };

/** What is being dragged: a template from the panel, or an existing shift from a cell. */
export type DragPayload =
  { type: "template"; templateId: number } | { type: "shift"; employeeId: number; date: string };
