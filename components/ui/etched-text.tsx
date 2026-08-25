import { type ReactNode } from "react";

/**
 * Signature treatment for a declared goal statement — engraved into the
 * surface rather than flat colored text. See docs/PRODUCT.md
 * "Signature elements" #2.
 */
export function EtchedText({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`font-semibold tracking-[-0.01em] text-foreground/90 ${className}`}
      style={{
        textShadow:
          "-1px -1px 1px rgba(255,255,255,0.07), 1px 1px 2px rgba(0,0,0,0.85)",
      }}
    >
      {children}
    </p>
  );
}
