"use client";

import { useRef, useState, type ReactNode } from "react";

const THRESHOLD = 72;

/**
 * Swipe right to complete, swipe left to carry to tomorrow. Buttons are the
 * accessible/desktop fallback — see the caller — this is the primary
 * interaction, not an enhancement layered on top. See docs/PRODUCT.md.
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
  const startX = useRef(0);
  const active = useRef(false);

  function handlePointerDown(e: React.PointerEvent) {
    active.current = true;
    startX.current = e.clientX;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!active.current) return;
    setDragX(e.clientX - startX.current);
  }

  function handlePointerUp() {
    if (!active.current) return;
    active.current = false;
    setDragging(false);

    if (dragX > THRESHOLD) {
      onSwipeRight();
    } else if (dragX < -THRESHOLD) {
      onSwipeLeft();
    }
    setDragX(0);
  }

  const rightOpacity = Math.min(Math.max(dragX / THRESHOLD, 0), 1);
  const leftOpacity = Math.min(Math.max(-dragX / THRESHOLD, 0), 1);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <span
          className="text-sm font-medium text-accent transition-opacity"
          style={{ opacity: leftOpacity }}
        >
          Tomorrow
        </span>
        <span
          className="text-sm font-medium text-accent transition-opacity"
          style={{ opacity: rightOpacity }}
        >
          Done
        </span>
      </div>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative touch-pan-y bg-background"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 200ms var(--ease-spring)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
