"use client";

import type { AssignBody, ClearBody, MoveBody } from "@app/shared";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import { api } from "@/lib/api";

export type Employee = InferResponseType<typeof api.employees.$get, 200>[number];
export type Shift = InferResponseType<typeof api.shifts.$get, 200>[number];
export type Template = InferResponseType<typeof api.templates.$get, 200>[number];

export function useEmployees(search: string) {
  return useQuery({
    queryKey: ["employees", search],
    queryFn: async () => {
      const res = await api.employees.$get({ query: search ? { search } : {} });
      if (!res.ok) throw new Error("Failed to load employees");
      return res.json();
    },
    placeholderData: keepPreviousData,
  });
}

export function useShifts(from: string, to: string) {
  return useQuery({
    queryKey: ["shifts", from, to],
    queryFn: async () => {
      const res = await api.shifts.$get({ query: { from, to } });
      if (!res.ok) throw new Error("Failed to load shifts");
      return res.json();
    },
    placeholderData: keepPreviousData,
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await api.templates.$get();
      if (!res.ok) throw new Error("Failed to load templates");
      return res.json();
    },
  });
}

const keyOf = (s: { employeeId: number; date: string }) => `${s.employeeId}:${s.date}`;

/** Update every cached shifts range so the calendar changes without waiting for a refetch. */
function patchShifts(qc: QueryClient, fn: (old: Shift[], from: string, to: string) => Shift[]) {
  for (const [queryKey, old] of qc.getQueriesData<Shift[]>({ queryKey: ["shifts"] })) {
    if (!old) continue;
    const [, from, to] = queryKey as [string, string, string];
    qc.setQueryData(queryKey, fn(old, from, to));
  }
}

export function useAssignShifts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AssignBody) => {
      const res = await api.shifts.$put({ json: body });
      if (!res.ok) throw new Error("Failed to assign shifts");
      return res.json();
    },
    onSuccess: (rows) => {
      const keys = new Set(rows.map(keyOf));
      patchShifts(qc, (old, from, to) => [
        ...old.filter((s) => !keys.has(keyOf(s))),
        ...rows.filter((s) => s.date >= from && s.date <= to),
      ]);
      qc.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}

export function useClearShifts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: ClearBody) => {
      const res = await api.shifts.clear.$post({ json: body });
      if (!res.ok) throw new Error("Failed to clear shifts");
      return res.json();
    },
    onSuccess: (_, body) => {
      const keys = new Set(body.cells.map(keyOf));
      patchShifts(qc, (old) => old.filter((s) => !keys.has(keyOf(s))));
      qc.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}

export function useMoveShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: MoveBody) => {
      const res = await api.shifts.move.$post({ json: body });
      if (!res.ok) throw new Error("Failed to move shift");
      return res.json();
    },
    onSuccess: (row, { from, copy }) => {
      patchShifts(qc, (old, rangeFrom, rangeTo) => {
        const next = old.filter(
          (s) => keyOf(s) !== keyOf(row) && (copy || keyOf(s) !== keyOf(from)),
        );
        return row.date >= rangeFrom && row.date <= rangeTo ? [...next, row] : next;
      });
      qc.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}
