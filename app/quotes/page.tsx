import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuotesClient from "./quotes-client";

export default async function QuotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <QuotesClient />;
}
