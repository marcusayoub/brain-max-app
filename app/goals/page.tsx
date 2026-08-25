import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GoalsClient from "./goals-client";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <GoalsClient />;
}
