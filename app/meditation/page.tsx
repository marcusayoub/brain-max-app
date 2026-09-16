import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MeditationClient from "./meditation-client";

export default async function MeditationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <MeditationClient />;
}
