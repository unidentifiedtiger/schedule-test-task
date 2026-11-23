"use client";

import type { ScheduleView } from "@app/shared";
import { ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { Popover } from "@/components/popover";
import { getDays, periodLabel, shiftAnchor, toISO } from "@/lib/dates";
import { formatDay, plural } from "@/lib/format";
import { cellKey, parseCellKey, type DragPayload, type Modifiers } from "./keys";
import { ScheduleGrid } from "./schedule-grid";
import { ScheduleToolbar } from "./schedule-toolbar";
import { SelectionBar } from "./selection-bar";
import { TemplateCard } from "./template-card";
import { TemplatesPanel } from "./templates-panel";
import {
  useAssignShifts,
  useClearShifts,
  useEmployees,
  useMoveShift,
  useShifts,
  useTemplates,
  type Template,
} from "./use-schedule";

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

type PopoverState =
  { kind: "day"; date: Date; rect: DOMRect } | { kind: "apply"; rect: DOMRect } | null;

function TemplateMenu({
  title,
  templates,
  onPick,
  footer,
}: {
  title: string;
  templates: Template[];
  onPick: (t: Template) => void;
  footer?: ReactNode;
}) {
  return (
    <>
      <p className="px-2 pt-1 pb-2 text-xs text-muted">{title}</p>
      <div className="flex flex-col gap-1">
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} onClick={() => onPick(t)} />
        ))}
      </div>
      {footer}
    </>
  );
}

export function SchedulePage() {
  const [view, setView] = useState<ScheduleView>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search.trim());

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastCell, setLastCell] = useState<{ row: number; col: number } | null>(null);
  const [popover, setPopover] = useState<PopoverState>(null);

  // Drag-and-drop: the ref is the source of truth for the drop; the state only drives visuals.
  const dragRef = useRef<DragPayload | null>(null);
  const [drag, setDrag] = useState<DragPayload | null>(null);

  const days = useMemo(() => getDays(view, anchor), [view, anchor]);
  const employees = useEmployees(debouncedSearch);
  const shifts = useShifts(toISO(days[0]), toISO(days[days.length - 1]));
  const templatesQuery = useTemplates();
  const assign = useAssignShifts();
  const clear = useClearShifts();
  const move = useMoveShift();

  const emps = useMemo(() => employees.data ?? [], [employees.data]);
  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);
  const selectedCells = useMemo(() => [...selected].map(parseCellKey), [selected]);
  const busy = assign.isPending || clear.isPending || move.isPending;

  function handleCellClick(ev: Modifiers, row: number, col: number) {
    const key = cellKey(emps[row].id, toISO(days[col]));
    if (ev.shiftKey && lastCell) {
      const next = new Set<string>();
      for (let r = Math.min(lastCell.row, row); r <= Math.max(lastCell.row, row); r++) {
        for (let c = Math.min(lastCell.col, col); c <= Math.max(lastCell.col, col); c++) {
          next.add(cellKey(emps[r].id, toISO(days[c])));
        }
      }
      setSelected(next);
      return;
    }
    if (ev.metaKey || ev.ctrlKey) {
      const next = new Set(selected);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      setSelected(next);
    } else {
      setSelected(selected.size === 1 && selected.has(key) ? new Set() : new Set([key]));
    }
    setLastCell({ row, col });
  }

  function applyTemplateToSelection(t: Template) {
    if (selectedCells.length === 0) return;
    assign.mutate({ cells: selectedCells, shift: { templateId: t.id } });
    setPopover(null);
  }

  function applyCustomToSelection(startTime: string, endTime: string) {
    if (selectedCells.length === 0) return;
    assign.mutate({ cells: selectedCells, shift: { startTime, endTime } });
  }

  function clearSelection() {
    if (selectedCells.length === 0) return;
    clear.mutate({ cells: selectedCells });
  }

  // Quick assign: one template for every employee currently listed, on one date.
  const dayCells = (date: Date) => emps.map((e) => ({ employeeId: e.id, date: toISO(date) }));

  function applyTemplateToDay(date: Date, t: Template) {
    if (emps.length === 0) return;
    assign.mutate({ cells: dayCells(date), shift: { templateId: t.id } });
    setPopover(null);
  }

  function clearDay(date: Date) {
    if (emps.length === 0) return;
    clear.mutate({ cells: dayCells(date) });
    setPopover(null);
  }

  function beginDrag(ev: DragEvent, payload: DragPayload) {
    ev.dataTransfer.effectAllowed = payload.type === "template" ? "copy" : "copyMove";
    ev.dataTransfer.setData("text/plain", "schedule-drag"); // Firefox won't start a drag without data
    dragRef.current = payload;
    // Changing the DOM inside dragstart can cancel the drag in Chrome, so update visuals a tick later.
    setTimeout(() => setDrag(payload), 0);
  }

  function endDrag() {
    dragRef.current = null;
    setDrag(null);
  }

  function handleDrop(ev: DragEvent, row: number, col: number) {
    ev.preventDefault();
    const payload = dragRef.current;
    endDrag();
    if (!payload || busy) return;

    const target = { employeeId: emps[row].id, date: toISO(days[col]) };
    if (payload.type === "template") {
      // Dropping on a selected cell applies the template to the whole selection.
      const cells = selected.has(cellKey(target.employeeId, target.date))
        ? selectedCells
        : [target];
      assign.mutate({ cells, shift: { templateId: payload.templateId } });
    } else {
      if (payload.employeeId === target.employeeId && payload.date === target.date) return;
      move.mutate({
        from: { employeeId: payload.employeeId, date: payload.date },
        to: target,
        copy: ev.altKey,
      });
    }
  }

  // Keyboard: 1–9 apply a template, Delete clears, Esc deselects.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (popover || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      if (e.key === "Escape") {
        setSelected(new Set());
      } else if (selectedCells.length > 0 && !busy) {
        if (e.key === "Delete" || e.key === "Backspace") {
          clearSelection();
        } else {
          const t = templates[Number(e.key) - 1];
          if (t) applyTemplateToSelection(t);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const mutationFailed = assign.isError || clear.isError || move.isError;

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-3 text-sm">
        <button
          type="button"
          aria-label="Назад"
          className="grid size-10 place-items-center rounded-full bg-white"
        >
          <ChevronLeft className="size-4" />
        </button>
        Графики смен
      </div>

      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-3xl font-medium">График</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className="h-10 rounded-xl bg-primary-soft px-4 text-sm font-medium text-primary"
          >
            Опубликовать
          </button>
          <button
            type="button"
            className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-white"
          >
            Сохранить
          </button>
        </div>
      </div>

      {mutationFailed && (
        <p role="alert" className="mb-3 rounded-lg bg-danger-bg px-4 py-2 text-sm text-danger">
          Не удалось сохранить изменения. Попробуйте ещё раз.
        </p>
      )}

      <div className="flex min-h-0 flex-1 gap-4">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl bg-white">
          {selectedCells.length > 0 ? (
            <SelectionBar
              cells={selectedCells.length}
              employees={new Set(selectedCells.map((c) => c.employeeId)).size}
              days={new Set(selectedCells.map((c) => c.date)).size}
              disabled={busy}
              onApply={(rect) => setPopover({ kind: "apply", rect })}
              onClear={clearSelection}
              onDeselect={() => setSelected(new Set())}
            />
          ) : (
            <ScheduleToolbar
              search={search}
              onSearch={setSearch}
              view={view}
              onView={setView}
              label={periodLabel(view, anchor)}
              onPrev={() => setAnchor((a) => shiftAnchor(view, a, -1))}
              onNext={() => setAnchor((a) => shiftAnchor(view, a, 1))}
              onToday={() => setAnchor(new Date())}
            />
          )}
          <ScheduleGrid
            view={view}
            days={days}
            employees={emps}
            shifts={shifts.data ?? []}
            templates={templates}
            selected={selected}
            drag={drag}
            isLoading={employees.isLoading || shifts.isLoading}
            isError={employees.isError || shifts.isError}
            onCellClick={handleCellClick}
            onDayClick={(e, date) =>
              setPopover({ kind: "day", date, rect: e.currentTarget.getBoundingClientRect() })
            }
            onShiftDragStart={(ev, employeeId, date) =>
              beginDrag(ev, { type: "shift", employeeId, date })
            }
            onDragEnd={endDrag}
            onDropCell={handleDrop}
          />
        </section>

        <TemplatesPanel
          templates={templates}
          canApply={selectedCells.length > 0 && !busy}
          onApplyTemplate={applyTemplateToSelection}
          onApplyCustom={applyCustomToSelection}
          onTemplateDragStart={(ev, t) => beginDrag(ev, { type: "template", templateId: t.id })}
          onDragEnd={endDrag}
        />
      </div>

      {popover?.kind === "day" && (
        <Popover
          anchor={popover.rect}
          label={`Быстрое назначение на ${formatDay(popover.date)}`}
          onClose={() => setPopover(null)}
        >
          <TemplateMenu
            title={`${formatDay(popover.date)}: ${plural(emps.length, ["сотрудник", "сотрудника", "сотрудников"])} в списке`}
            templates={templates}
            onPick={(t) => applyTemplateToDay(popover.date, t)}
            footer={
              <button
                type="button"
                onClick={() => clearDay(popover.date)}
                className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger-bg"
              >
                Очистить день
              </button>
            }
          />
        </Popover>
      )}

      {popover?.kind === "apply" && (
        <Popover anchor={popover.rect} label="Применить шаблон" onClose={() => setPopover(null)}>
          <TemplateMenu
            title={`Для выделенных: ${plural(selectedCells.length, ["ячейка", "ячейки", "ячеек"])}`}
            templates={templates}
            onPick={applyTemplateToSelection}
          />
        </Popover>
      )}
    </AppShell>
  );
}
