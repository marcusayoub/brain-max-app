"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

const tabs: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/daily",
    label: "Daily",
    icon: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
      </>
    ),
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: (
      <>
        <circle cx="5" cy="6" r="1.3" />
        <circle cx="5" cy="12" r="1.3" />
        <circle cx="5" cy="18" r="1.3" />
        <path d="M10 6h10M10 12h10M10 18h10" />
      </>
    ),
  },
  {
    href: "/goals",
    label: "Goals",
    icon: (
      <>
        <path d="M3 20L9 8l4 6 3-4 5 10z" />
        <circle cx="17" cy="6" r="1.4" />
      </>
    ),
  },
  {
    href: "/affirm",
    label: "Affirm",
    icon: (
      <>
        <path d="M12 3l1.6 4.6L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.4z" />
        <path d="M19 15l0.8 2.2L22 18l-2.2 0.8L19 21l-0.8-2.2L16 18l2.2-0.8z" />
      </>
    ),
  },
  {
    href: "/quotes",
    label: "Quotes",
    icon: (
      <>
        <path d="M7 8c-1.7 0-3 1.3-3 3v3h4v-4H6c0-.6.4-1 1-1zM17 8c-1.7 0-3 1.3-3 3v3h4v-4h-2c0-.6.4-1 1-1z" />
      </>
    ),
  },
  {
    href: "/write",
    label: "Write",
    icon: (
      <>
        <path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" />
        <path d="M14 7l3 3" />
      </>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-2xl items-stretch justify-between px-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 focus-visible:outline-none"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 transition-colors duration-150 ${
                  active ? "text-foreground" : "text-muted"
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {tab.icon}
              </svg>
              <span
                className={`text-[11px] transition-colors duration-150 ${
                  active ? "font-medium text-foreground" : "text-muted"
                }`}
              >
                {tab.label}
              </span>
              <span
                className={`h-1 w-1 rounded-full transition-opacity duration-150 ${
                  active ? "bg-accent opacity-100" : "opacity-0"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
