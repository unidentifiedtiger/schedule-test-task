"use client";

import type { ScheduleView } from "@app/shared";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const views: { value: ScheduleView; label: string }[] = [
  { value: "month", label: "Месяц" },
  { value: "week", label: "Неделя" },
];

type Props = {
  search: string;
  onSearch: (value: string) => void;
  view: ScheduleView;
  onView: (view: ScheduleView) => void;
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

const iconBtn =
  "grid size-9 place-items-center rounded-xl bg-app text-ink hover:bg-line/60 focus-visible:outline-2 focus-visible:outline-primary";

export function ScheduleToolbar({
  search,
  onSearch,
  view,
  onView,
  label,
  onPrev,
  onNext,
  onToday,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3">
      <label className="flex h-10 w-full max-w-80 items-center gap-2 rounded-xl bg-app px-3 text-muted focus-within:ring-2 focus-within:ring-primary/40">
        <Search className="size-4 shrink-0" aria-hidden />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Поиск по ФИО"
          aria-label="Поиск по ФИО"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </label>

      <div role="group" aria-label="Режим отображения" className="flex rounded-xl bg-app p-1">
        {views.map((v) => (
          <button
            key={v.value}
            type="button"
            aria-pressed={view === v.value}
            onClick={() => onView(v.value)}
            className={`rounded-lg px-6 py-1.5 text-sm font-medium transition-colors ${
              view === v.value ? "bg-ink text-white" : "text-ink hover:bg-line/60"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button type="button" onClick={onPrev} aria-label="Назад" className={iconBtn}>
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-44 text-center text-sm font-medium" aria-live="polite">
          {label}
        </span>
        <button type="button" onClick={onNext} aria-label="Вперёд" className={iconBtn}>
          <ChevronRight className="size-4" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="h-9 rounded-xl bg-primary-soft px-4 text-sm font-medium text-primary hover:bg-primary-soft/70"
        >
          Сегодня
        </button>
      </div>
    </div>
  );
}
