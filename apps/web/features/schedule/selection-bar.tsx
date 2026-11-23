"use client";

import { LayoutGrid, Trash2, X } from "lucide-react";
import { plural } from "@/lib/format";

type Props = {
  cells: number;
  employees: number;
  days: number;
  disabled: boolean;
  onApply: (anchor: DOMRect) => void;
  onClear: () => void;
  onDeselect: () => void;
};

const btn =
  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50";

export function SelectionBar({
  cells,
  employees,
  days,
  disabled,
  onApply,
  onClear,
  onDeselect,
}: Props) {
  return (
    <div
      role="status"
      className="m-3 flex flex-wrap items-center gap-3 rounded-xl bg-ink px-4 py-2.5 text-sm text-white"
    >
      <span>Выделено:</span>
      <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs">
        {plural(cells, ["ячейка", "ячейки", "ячеек"])}
      </span>
      <span className="text-white/80">
        {plural(employees, ["сотрудник", "сотрудника", "сотрудников"])} ·{" "}
        {plural(days, ["день", "дня", "дней"])}
      </span>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => onApply(e.currentTarget.getBoundingClientRect())}
          className={btn}
        >
          <LayoutGrid className="size-4" aria-hidden />
          Применить шаблон
        </button>
        <button type="button" disabled={disabled} onClick={onClear} className={btn}>
          <Trash2 className="size-4" aria-hidden />
          Очистить
        </button>
        <button type="button" onClick={onDeselect} className={btn}>
          <X className="size-4" aria-hidden />
          Снять
        </button>
      </div>
    </div>
  );
}
