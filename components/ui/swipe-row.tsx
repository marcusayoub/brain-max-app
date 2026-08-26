"use client";

import { useRef, useState, type ReactNode } from "react";

const THRESHOLD = 72;
const RESISTANCE = 0.35; // how much drag "gives" once past the commit point
const COMMIT_DISTANCE = 120;
const COMMIT_MS = 240;

const LATER_COLOR = "129, 140, 248"; // indigo — "this is going later"

function applyResistance(raw: number) {
  const abs = Math.abs(raw);
  if (abs <= THRESHOLD) return raw;
  const sign = raw < 0 ? -1 : 1;
  return sign * (THRESHOLD + (abs - THRESHOLD) * RESISTANCE);
}

/**
 * Swipe right to complete, swipe left to carry to tomorrow. Buttons are the
 * accessible/desktop fallback — see the caller — this is the primary
 * interaction, not an enhancement layered on top. See docs/PRODUCT.md.
 *
 * The glow/icon on each side reveals in real time as you drag, so the color
 * itself teaches the gesture before you release. Committing past the
 * threshold plays a quick spring-settle exit; releasing short of it snaps
 * back with the same spring.
 */
export function SwipeRow({
  onSwipeRight,
  onSwipeLeft,
  children,
}: {
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  children: ReactNode;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [committing, setCommitting] = useState<"left" | "right" | null>(null);
  const startX = useRef(0);
  const active = useRef(false);

  function handlePointerDown(e: React.PointerEvent) {
    if (committing) return;
    active.current = true;
    startX.current = e.clientX;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!active.current) return;
    setDragX(applyResistance(e.clientX - startX.current));
  }

  function handlePointerUp() {
    if (!active.current) return;
    active.current = false;
    setDragging(false);

    if (dragX > THRESHOLD) {
      commit("right");
    } else if (dragX < -THRESHOLD) {
      commit("left");
    } else {
      setDragX(0);
    }
  }

  function commit(direction: "left" | "right") {
    setCommitting(direction);
    setDragX(direction === "right" ? COMMIT_DISTANCE : -COMMIT_DISTANCE);
    setTimeout(() => {
      if (direction === "right") onSwipeRight();
      else onSwipeLeft();
    }, COMMIT_MS);
  }

  const rightProgress = Math.min(Math.max(dragX / THRESHOLD, 0), 1);
  const leftProgress = Math.min(Math.max(-dragX / THRESHOLD, 0), 1);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div
        className="absolute inset-0 transition-opacity"
        style={{
          opacity: leftProgress,
          background: `radial-gradient(circle at left, rgba(${LATER_COLOR}, 0.35), transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0 transition-opacity"
        style={{
          opacity: rightProgress,
          background:
            "radial-gradient(circle at right, rgba(36, 240, 211, 0.35), transparent 70%)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <div
          className="flex items-center gap-1.5"
          style={{
            opacity: leftProgress,
            transform: `scale(${0.5 + leftProgress * 0.5})`,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            style={{ color: `rgb(${LATER_COLOR})` }}
            fill="currentColor"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <span
            className="text-sm font-medium"
            style={{ color: `rgb(${LATER_COLOR})` }}
          >
            Tomorrow
          </span>
        </div>
        <div
          className="flex items-center gap-1.5"
          style={{
            opacity: rightProgress,
            transform: `scale(${0.5 + rightProgress * 0.5})`,
          }}
        >
          <span className="text-sm font-medium text-accent">Done</span>
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-accent"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative touch-pan-y bg-background"
        style={{
          transform: `translateX(${dragX}px)`,
          opacity: committing ? 0 : 1,
          transition: dragging
            ? "none"
            : `transform ${committing ? COMMIT_MS : 260}ms var(--ease-spring), opacity ${COMMIT_MS}ms ease-out`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
