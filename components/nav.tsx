"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/home", label: "Home" },
  { href: "/goals", label: "Goals" },
  { href: "/mindset", label: "Mindset" },
  { href: "/progress", label: "Progress" },
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
    <div className="mx-auto flex max-w-2xl flex-col gap-3 px-6 pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:pt-12">
      <Link
        href="/home"
        className="text-lg font-semibold tracking-[-0.02em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        Brain-Max
      </Link>
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
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
