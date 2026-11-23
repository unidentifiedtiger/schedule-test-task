import type { DragEvent } from "react";
import { shiftHours } from "@/lib/format";
import { edgeClass } from "./colors";
import type { Template } from "./use-schedule";

type Props = {
  template: Template;
  hotkey?: number;
  /** Looks and acts disabled for clicks; the card can still be dragged. */
  disabled?: boolean;
  onClick: () => void;
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
};

export function TemplateCard({
  template,
  hotkey,
  disabled,
  onClick,
  onDragStart,
  onDragEnd,
}: Props) {
  const draggable = Boolean(onDragStart);
  return (
    // The wrapper is what gets dragged: buttons can't be dragged reliably in every browser.
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={draggable ? "cursor-grab active:cursor-grabbing" : undefined}
    >
      <button
        type="button"
        aria-disabled={disabled ? true : undefined}
        onClick={disabled ? undefined : onClick}
        className={`relative w-full rounded-lg border-l-4 bg-app px-3 py-2 text-left transition-colors hover:bg-line/50 focus-visible:outline-2 focus-visible:outline-primary aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-app ${edgeClass[template.color] ?? edgeClass.custom}`}
      >
        <span className="block text-sm font-semibold">{template.name}</span>
        <span className="block text-xs text-ink/70">
          {template.startTime} - {template.endTime} ·{" "}
          {shiftHours(template.startTime, template.endTime)} ч
        </span>
        {hotkey !== undefined && (
          <kbd className="absolute top-2 right-2 grid size-5 place-items-center rounded bg-white text-xs">
            {hotkey}
          </kbd>
        )}
      </button>
    </div>
  );
}
