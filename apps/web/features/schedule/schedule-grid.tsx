"use client";

import type { ScheduleView } from "@app/shared";
import { Plus } from "lucide-react";
import { Fragment, useMemo, useState, type DragEvent, type MouseEvent } from "react";
import { toISO, weekdayShort } from "@/lib/dates";
import { formatDay, shiftHours, shortRange } from "@/lib/format";
import { chipAccent, chipClass, chipText } from "./colors";
import { cellKey, type DragPayload, type Modifiers } from "./keys";
import type { Employee, Shift, Template } from "./use-schedule";

function Avatar({ employee }: { employee: Employee }) {
  const initials = employee.fullName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  return employee.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={employee.avatarUrl} alt="" className="size-8 shrink-0 rounded-lg object-cover" />
  ) : (
    <span
      aria-hidden
      className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-xs font-medium text-primary"
    >
      {initials}
    </span>
  );
}

type Props = {
  view: ScheduleView;
  days: Date[];
  employees: Employee[];
  shifts: Shift[];
  templates: Template[];
  selected: Set<string>;
  drag: DragPayload | null;
  isLoading: boolean;
  isError: boolean;
  onCellClick: (e: Modifiers, row: number, col: number) => void;
  onDayClick: (e: MouseEvent<HTMLButtonElement>, date: Date) => void;
  onShiftDragStart: (e: DragEvent<HTMLDivElement>, employeeId: number, date: string) => void;
  onDragEnd: () => void;
  onDropCell: (e: DragEvent<HTMLDivElement>, row: number, col: number) => void;
};

export function ScheduleGrid({
  view,
  days,
  employees,
  shifts,
  templates,
  selected,
  drag,
  isLoading,
  isError,
  onCellClick,
  onDayClick,
  onShiftDragStart,
  onDragEnd,
  onDropCell,
}: Props) {
  const [overKey, setOverKey] = useState<string | null>(null);

  const byKey = useMemo(
    () => new Map(shifts.map((s) => [cellKey(s.employeeId, s.date), s])),
    [shifts],
  );
  const colorOf = useMemo(() => new Map(templates.map((t) => [t.id, t.color])), [templates]);
  const coverage = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of shifts) map.set(s.date, (map.get(s.date) ?? 0) + 1);
    return map;
  }, [shifts]);

  const todayISO = toISO(new Date());
  // Month view is compact: narrow columns, hours only inside the chip.
  const compact = view === "month";
  const colMin = compact ? 52 : 120;
  const dragSourceKey = drag?.type === "shift" ? cellKey(drag.employeeId, drag.date) : null;

  return (
    <div className="min-h-0 flex-1 overflow-auto px-3 pb-3 select-none">
      <div
        className="grid w-max min-w-full text-sm"
        style={{ gridTemplateColumns: `190px repeat(${days.length}, minmax(${colMin}px, 1fr))` }}
      >
        <div className="sticky top-0 left-0 z-30 border-b border-line bg-white px-4 py-3 text-muted">
          Сотрудник
        </div>
        {days.map((d) => {
          const iso = toISO(d);
          return (
            <div key={iso} className="sticky top-0 z-20 border-b border-line bg-white">
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={`Быстрое назначение на ${formatDay(d)}`}
                onClick={(e) => onDayClick(e, d)}
                className={`w-full rounded-lg text-center hover:bg-app focus-visible:outline-2 focus-visible:outline-primary ${
                  compact ? "py-2 leading-tight" : "py-3"
                } ${iso === todayISO ? "font-semibold text-primary" : "text-muted"}`}
              >
                {compact ? (
                  <>
                    <span className="block text-xs">{weekdayShort(d)}</span>
                    <span className="block text-sm">{d.getDate()}</span>
                  </>
                ) : (
                  <>
                    {weekdayShort(d)} {d.getDate()}
                  </>
                )}
              </button>
            </div>
          );
        })}

        {isError && (
          <p className="col-span-full p-8 text-center text-danger">
            Не удалось загрузить данные. Проверьте, что API запущен, и обновите страницу.
          </p>
        )}
        {!isError && isLoading && (
          <p className="col-span-full p-8 text-center text-muted">Загрузка…</p>
        )}
        {!isError && !isLoading && employees.length === 0 && (
          <p className="col-span-full p-8 text-center text-muted">Сотрудники не найдены</p>
        )}

        {employees.map((e, row) => {
          const bg = row % 2 ? "bg-stripe" : "bg-white";
          return (
            <Fragment key={e.id}>
              <div className={`sticky left-0 z-10 flex items-center gap-3 px-4 py-2 ${bg}`}>
                <Avatar employee={e} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.fullName}</p>
                  <p className="text-xs text-muted">
                    {e.position} · {e.hoursNorm} ч
                  </p>
                </div>
              </div>
              {days.map((d, col) => {
                const iso = toISO(d);
                const key = cellKey(e.id, iso);
                const shift = byKey.get(key);
                const isSelected = selected.has(key);
                const isOver = overKey === key;
                const color =
                  shift?.templateId != null
                    ? (colorOf.get(shift.templateId) ?? "custom")
                    : "custom";
                return (
                  <div key={iso} className={`p-1 ${bg}`}>
                    {/* A div, not a button: buttons can't be dragged reliably in every browser. */}
                    <div
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      aria-label={`${e.fullName}, ${formatDay(d)}${
                        shift ? `, смена ${shift.startTime}–${shift.endTime}` : ", нет смены"
                      }`}
                      draggable={Boolean(shift)}
                      onClick={(ev) => onCellClick(ev, row, col)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          onCellClick(ev, row, col);
                        }
                      }}
                      onDragStart={shift ? (ev) => onShiftDragStart(ev, e.id, iso) : undefined}
                      onDragEnd={onDragEnd}
                      onDragOver={(ev) => {
                        if (!drag) return;
                        ev.preventDefault(); // allow dropping here
                        ev.dataTransfer.dropEffect =
                          drag.type === "template" || ev.altKey ? "copy" : "move";
                        if (overKey !== key) setOverKey(key);
                      }}
                      onDragLeave={(ev) => {
                        if (!ev.currentTarget.contains(ev.relatedTarget as Node | null))
                          setOverKey(null);
                      }}
                      onDrop={(ev) => {
                        setOverKey(null);
                        onDropCell(ev, row, col);
                      }}
                      className={`relative block h-12 w-full cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isOver
                          ? "bg-primary-soft ring-2 ring-primary"
                          : isSelected
                            ? "bg-primary-soft ring-1 ring-primary"
                            : ""
                      } ${key === dragSourceKey ? "opacity-40" : ""}`}
                    >
                      {shift ? (
                        compact ? (
                          <span
                            title={`${shift.startTime}–${shift.endTime}`}
                            className={`flex h-full items-center justify-center rounded-lg text-sm font-semibold ${chipClass[color] ?? chipClass.custom} ${chipAccent[color] ?? chipAccent.custom}`}
                          >
                            {shiftHours(shift.startTime, shift.endTime)} ч
                          </span>
                        ) : (
                          <span
                            className={`flex h-full flex-col items-center justify-center rounded-lg text-xs leading-tight font-medium ${chipClass[color] ?? chipClass.custom} ${chipText[color] ?? chipText.custom}`}
                          >
                            <span>{shortRange(shift.startTime, shift.endTime)}</span>
                            <span
                              className={`text-[10px] font-normal ${chipAccent[color] ?? chipAccent.custom}`}
                            >
                              {shiftHours(shift.startTime, shift.endTime)} ч
                            </span>
                          </span>
                        )
                      ) : isSelected || isOver ? (
                        <span className="absolute inset-0 grid place-items-center">
                          <span className="grid size-5 place-items-center rounded-full bg-primary text-white">
                            <Plus className="size-3" aria-hidden />
                          </span>
                        </span>
                      ) : (
                        <span className="absolute inset-0 rounded-lg border border-dashed border-line" />
                      )}
                    </div>
                  </div>
                );
              })}
            </Fragment>
          );
        })}

        <div className="sticky bottom-0 left-0 z-30 border-t border-line bg-white px-4 py-3 text-muted">
          Покрытие
        </div>
        {days.map((d) => {
          const iso = toISO(d);
          const count = coverage.get(iso) ?? 0;
          return (
            <div
              key={iso}
              className={`sticky bottom-0 z-20 py-3 text-center ${
                count === 0 ? "bg-danger-bg text-danger" : "bg-primary-soft text-primary"
              }`}
            >
              {count}
            </div>
          );
        })}
      </div>
    </div>
  );
}
