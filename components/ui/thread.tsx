import { type ReactNode } from "react";

/**
 * The thread — signature connective element. A quiet vertical line running
 * through a goal's attached items, with a brief accent pulse on the node of
 * whatever was just completed. See docs/PRODUCT.md "Signature elements" #1.
 *
 * Not a meter — nothing accumulates. The pulse is a momentary confirmation
 * that this action fed that goal, then it settles back to inert.
 */
export function Thread({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-col gap-0.5 pl-5">
      <div className="absolute top-1.5 bottom-1.5 left-[7px] w-px bg-border" />
      {children}
    </div>
  );
}

export function ThreadNode({
  done,
  pulse,
  children,
}: {
  done: boolean;
  pulse: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative flex items-center gap-3 py-1.5">
      <span
        className={`absolute -left-5 h-[7px] w-[7px] shrink-0 rounded-full transition-colors duration-300 ${
          done ? "bg-accent" : "bg-border"
        } ${pulse ? "thread-pulse" : ""}`}
      />
      {children}
    </div>
  );
}
