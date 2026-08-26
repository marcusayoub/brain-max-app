"use client";

import { useEffect } from "react";

export function Toast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-30 flex justify-center px-6">
      <div
        role="alert"
        className="max-w-sm rounded-xl border border-red-500/30 bg-surface px-4 py-3 text-sm text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
      >
        {message}
      </div>
    </div>
  );
}
