import { type ReactNode } from "react";
import { SignOutLink } from "./sign-out-link";
import { BottomNav } from "./bottom-nav";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto flex max-w-2xl justify-end px-6 pt-6">
        <SignOutLink />
      </div>
      {children}
      <BottomNav />
    </div>
  );
}
