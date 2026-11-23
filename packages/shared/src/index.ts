import { z } from "zod";

export const isoDate = z.iso.date();
export const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:MM");

export const dateRangeQuery = z
  .object({ from: isoDate, to: isoDate })
  .refine((v) => v.from <= v.to, { message: "`from` must not be after `to`" });

export const employeesQuery = z.object({
  search: z.string().trim().max(100).optional(),
});

export const scheduleViews = ["week", "month"] as const;
export type ScheduleView = (typeof scheduleViews)[number];

export const templateColors = ["blue", "purple", "teal"] as const;
export type TemplateColor = (typeof templateColors)[number];

/** One calendar cell = one employee on one date. */
export const cellSchema = z.object({
  employeeId: z.number().int().positive(),
  date: isoDate,
});
export const cellsSchema = z.array(cellSchema).min(1).max(1000);

/** Assign either a template or a custom time range to many cells at once. */
export const assignBody = z.object({
  cells: cellsSchema,
  shift: z.union([
    z.object({ templateId: z.number().int().positive() }),
    z
      .object({ startTime: timeString, endTime: timeString })
      .refine((v) => v.startTime !== v.endTime, { message: "Start and end must differ" }),
  ]),
});
export type AssignBody = z.infer<typeof assignBody>;

export const clearBody = z.object({ cells: cellsSchema });
export type ClearBody = z.infer<typeof clearBody>;

/** Drag-and-drop: move (or copy) the shift in one cell to another cell. */
export const moveBody = z.object({
  from: cellSchema,
  to: cellSchema,
  copy: z.boolean().optional(),
});
export type MoveBody = z.infer<typeof moveBody>;
