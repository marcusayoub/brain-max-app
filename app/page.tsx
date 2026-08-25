import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6">
      <h1 className="animate-[rise_0.5s_var(--ease-spring)] text-5xl font-semibold tracking-[-0.03em] text-foreground">
        Brain-Max
      </h1>
      <Link
        href="/login"
        className="animate-[rise_0.5s_var(--ease-spring)_0.05s_backwards] text-sm text-muted underline decoration-muted/40 underline-offset-4 transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        Sign in
      </Link>
      <style>{`
        @keyframes rise {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
