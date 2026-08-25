"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/home", label: "Daily Brain" },
  { href: "/goals", label: "Goals" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-2xl items-center justify-between px-6 pt-10 sm:pt-12">
      <Link
        href="/home"
        className="font-display text-lg italic font-medium tracking-[-0.01em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        Autopilot
      </Link>
      <nav className="flex items-center gap-5 text-sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded ${
              pathname === link.href
                ? "text-foreground font-medium"
                : "text-muted hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        ))}
        <button
          onClick={handleSignOut}
          className="text-muted transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          Sign out
        </button>
      </nav>
    </div>
  );
}
