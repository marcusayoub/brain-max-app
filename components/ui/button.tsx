import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium " +
  "transition-[transform,box-shadow,opacity,background-color] duration-150 ease-[var(--ease-spring)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-black shadow-[0_1px_2px_rgba(36,240,211,0.25),0_4px_16px_rgba(36,240,211,0.3)] " +
    "hover:shadow-[0_1px_2px_rgba(36,240,211,0.3),0_6px_22px_rgba(36,240,211,0.4)] hover:-translate-y-px hover:brightness-110",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-surface-2 hover:-translate-y-px",
  ghost: "text-muted hover:text-foreground hover:bg-surface",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}
