import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MindsetClient from "./mindset-client";

export default async function MindsetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <MindsetClient />;
}
