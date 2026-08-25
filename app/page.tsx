import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white dark:bg-black">
      <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-white">
        Autopilot
      </h1>
      <Link
        href="/login"
        className="text-sm text-zinc-600 underline dark:text-zinc-400"
      >
        Sign in
      </Link>
    </div>
  );
}
