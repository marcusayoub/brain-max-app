import { type InputHTMLAttributes, type SelectHTMLAttributes } from "react";

const fieldStyles =
  "rounded-lg border border-foreground/15 bg-background px-3.5 py-2.5 text-[15px] text-foreground " +
  "placeholder:text-muted transition-[box-shadow,border-color] duration-150 " +
  "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldStyles} ${className}`} {...props} />;
}

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${fieldStyles} ${className}`} {...props} />;
}
