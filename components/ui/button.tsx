import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

const base =
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium " +
  "transition-[transform,box-shadow,opacity] duration-150 ease-[var(--ease-spring)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-foreground text-background shadow-[0_1px_2px_rgba(22,24,29,0.08),0_4px_10px_rgba(22,24,29,0.10)] " +
    "hover:shadow-[0_1px_2px_rgba(22,24,29,0.10),0_6px_16px_rgba(22,24,29,0.16)] hover:-translate-y-px",
  secondary:
    "border border-foreground/15 text-foreground hover:bg-foreground/5 hover:-translate-y-px",
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
