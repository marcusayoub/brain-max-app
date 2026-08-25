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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6">
      <p className="text-lg text-foreground">Signed in as {user.email}</p>
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/home"
          className="text-sm text-muted underline decoration-muted/40 underline-offset-4 transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          Go to Daily Brain
        </Link>
        <Link
          href="/goals"
          className="text-sm text-muted underline decoration-muted/40 underline-offset-4 transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          Go to Goals
        </Link>
      </div>
      <SignOutButton />
    </div>
  );
}
