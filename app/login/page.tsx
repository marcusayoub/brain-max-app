"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    setErrorMessage(error?.message ?? null);
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <p className="max-w-sm text-center text-lg leading-relaxed text-foreground">
          Check your email — we sent a sign-in link to{" "}
          <span className="font-medium">{email}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-border bg-surface p-8 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_12px_32px_rgba(0,0,0,0.4)]"
      >
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-foreground">
          Sign in
        </h1>
        <Input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending..." : "Send magic link"}
        </Button>
        {status === "error" && (
          <p className="text-sm text-red-600">
            {errorMessage ?? "Something went wrong sending the link. Try again."}
          </p>
        )}
      </form>
    </div>
  );
}
