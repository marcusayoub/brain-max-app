import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 dark:bg-black">
      <p className="text-lg text-black dark:text-white">
        Signed in as {user.email}
      </p>
      <Link href="/goals" className="text-sm text-zinc-600 underline dark:text-zinc-400">
        Go to Goals
      </Link>
      <SignOutButton />
    </div>
  );
}
