"use client";

import { Bell, CalendarDays, House, PanelLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const nav = [
  { href: "/", label: "Главная", icon: House },
  { href: "/schedule", label: "Смены", icon: CalendarDays },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid h-screen grid-cols-[230px_1fr]">
      <aside className="flex flex-col border-r border-line bg-app p-3">
        <div className="mb-6 flex items-center justify-between px-2 pt-1">
          <span className="text-lg font-semibold">CRM</span>
          <Bell className="size-4 text-muted" aria-hidden />
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href !== "/" && pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                  active ? "bg-white font-medium" : "text-ink/80 hover:bg-white/60"
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="mt-auto flex items-center gap-3 px-3 py-2 text-sm text-ink/80"
        >
          <PanelLeft className="size-4" aria-hidden />
          Свернуть меню
        </button>
      </aside>
      <main className="flex min-w-0 flex-col overflow-hidden p-6">{children}</main>
    </div>
  );
}
