"use client";

import { Plus } from "lucide-react";
import { useState, type DragEvent } from "react";
import { TimeInput, isValidTime } from "@/components/time-input";
import { TemplateCard } from "./template-card";
import type { Template } from "./use-schedule";

type Props = {
  templates: Template[];
  canApply: boolean;
  onApplyTemplate: (template: Template) => void;
  onApplyCustom: (startTime: string, endTime: string) => void;
  onTemplateDragStart: (e: DragEvent<HTMLDivElement>, template: Template) => void;
  onDragEnd: () => void;
};

export function TemplatesPanel({
  templates,
  canApply,
  onApplyTemplate,
  onApplyCustom,
  onTemplateDragStart,
  onDragEnd,
}: Props) {
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const canSubmit = canApply && isValidTime(start) && isValidTime(end) && start !== end;

  return (
    <aside className="w-72 shrink-0 overflow-auto rounded-2xl bg-white p-4">
      <h2 className="mb-3 text-sm">Шаблоны смен</h2>
      <div className="flex flex-col gap-2">
        {templates.map((t, i) => (
          <TemplateCard
            key={t.id}
            template={t}
            hotkey={i < 9 ? i + 1 : undefined}
            disabled={!canApply}
            onClick={() => onApplyTemplate(t)}
            onDragStart={(e) => onTemplateDragStart(e, t)}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        Перетащите шаблон на ячейку. Смену можно перетащить в другую ячейку, Alt — копировать.
      </p>
      {!canApply && (
        <p className="mt-2 text-xs text-muted">
          Или выберите ячейки: Shift — диапазон, Ctrl/Cmd — добавить ячейку.
        </p>
      )}

      <h2 className="mt-6 mb-3 text-sm">Своя смена</h2>
      <div
        className="grid grid-cols-2 gap-2"
        onKeyDown={(e) => {
          if (e.key === "Enter" && canSubmit) onApplyCustom(start, end);
        }}
      >
        <label className="text-xs text-muted">
          Начало
          <TimeInput value={start} onChange={setStart} className="mt-1" />
        </label>
        <label className="text-xs text-muted">
          Конец
          <TimeInput value={end} onChange={setEnd} className="mt-1" />
        </label>
      </div>
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onApplyCustom(start, end)}
        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary-soft text-sm font-medium text-primary hover:bg-primary-soft/70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="size-4" aria-hidden />
        Поставить в выделенные
      </button>
    </aside>
  );
}
