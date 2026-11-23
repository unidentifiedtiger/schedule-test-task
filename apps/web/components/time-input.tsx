"use client";

import { useState } from "react";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isValidTime = (v: string) => TIME_RE.test(v);

// "0930" -> "09:30"; a lone digit 3-9 becomes an hour ("9" -> "09")
const format = (raw: string) => {
  let digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 1 && Number(digits) > 2) digits = `0${digits}`;
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function TimeInput({ value, onChange, className = "" }: Props) {
  const [touched, setTouched] = useState(false);
  const invalid = touched && !isValidTime(value);

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="ЧЧ:ММ"
      value={value}
      aria-invalid={invalid}
      onChange={(e) => onChange(format(e.target.value))}
      onFocus={(e) => {
        // Select everything so typing replaces the old time (deferred so the click doesn't undo it).
        const el = e.currentTarget;
        setTimeout(() => el.select(), 0);
      }}
      onBlur={() => setTouched(true)}
      className={`h-10 w-full rounded-lg bg-app px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary/40 aria-invalid:ring-2 aria-invalid:ring-danger/50 ${className}`}
    />
  );
}
