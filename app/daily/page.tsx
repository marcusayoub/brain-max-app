import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DailyClient from "./daily-client";

export default async function DailyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <DailyClient />;
}
