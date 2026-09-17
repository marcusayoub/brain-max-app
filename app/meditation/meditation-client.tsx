"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { todayLocal, localDateKey } from "@/lib/date";

type WhoopStatus = { connected: boolean; connectedAt: string | null };

type MeditationType = "silent" | "breath" | "body_scan" | "open_awareness";

type Session = {
  id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  meditation_type: MeditationType;
  created_at: string;
};

type View = "overview" | "setup" | "session";

const TYPES: { value: MeditationType; label: string }[] = [
  { value: "silent", label: "Silent" },
  { value: "breath", label: "Breath" },
  { value: "body_scan", label: "Body Scan" },
  { value: "open_awareness", label: "Open Awareness" },
];

const DURATIONS_MIN = [5, 10, 15, 20];

function daysAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((startOfNow - startOfD) / 86400000);
}

function formatMinutes(totalMin: number) {
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const chipBase =
  "rounded-full px-4 py-2 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export default function MeditationClient() {
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("overview");
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"error" | "success">("error");

  const [whoopStatus, setWhoopStatus] = useState<WhoopStatus | null>(null);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const [durationMin, setDurationMin] = useState(10);
  const [customMinutes, setCustomMinutes] = useState("");
  const [selectedType, setSelectedType] = useState<MeditationType>("silent");

  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [targetSeconds, setTargetSeconds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from("meditation_sessions")
        .select("id, started_at, ended_at, duration_seconds, meditation_type, created_at")
        .order("started_at", { ascending: false });

      if (error) {
        setToastVariant("error");
        setToast(error.message);
      }
      setSessions((data as Session[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadWhoopStatus() {
      const res = await fetch("/api/whoop/status");
      if (res.ok) {
        setWhoopStatus((await res.json()) as WhoopStatus);
      }
    }
    loadWhoopStatus();
  }, []);

  useEffect(() => {
    function handleWhoopRedirect() {
      const whoop = new URLSearchParams(window.location.search).get("whoop");
      if (!whoop) return;

      if (whoop === "connected") {
        setToastVariant("success");
        setToast("WHOOP connected");
      } else if (whoop === "not_configured") {
        setToastVariant("error");
        setToast("WHOOP isn't configured yet.");
      } else if (whoop === "error") {
        setToastVariant("error");
        setToast("Couldn't connect WHOOP. Please try again.");
      }
      router.replace("/meditation");
    }
    handleWhoopRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    const res = await fetch("/api/whoop/disconnect", { method: "POST" });
    setDisconnecting(false);
    setDisconnectOpen(false);
    if (!res.ok) {
      setToastVariant("error");
      setToast("Couldn't disconnect WHOOP. Please try again.");
      return;
    }
    setWhoopStatus({ connected: false, connectedAt: null });
    setToastVariant("success");
    setToast("WHOOP disconnected");
  }

  useEffect(() => {
    if (view !== "session") return;
    const t = setInterval(() => {
      setRemaining((r) => Math.max(r - 1, 0));
    }, 1000);
    return () => clearInterval(t);
  }, [view]);

  useEffect(() => {
    if (view === "session" && remaining === 0 && sessionStart) {
      handleComplete(targetSeconds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  function openSetup() {
    setView("setup");
  }

  function backToOverview() {
    setView("overview");
  }

  function startSession() {
    const chosenMinutes = customMinutes.trim() ? Number(customMinutes) : durationMin;
    if (!chosenMinutes || chosenMinutes <= 0) return;
    setTargetSeconds(Math.round(chosenMinutes * 60));
    setRemaining(Math.round(chosenMinutes * 60));
    setSessionStart(new Date());
    setView("session");
  }

  async function handleComplete(durationSeconds: number) {
    if (!userId || !sessionStart || saving) return;
    setSaving(true);
    const endedAt = new Date();

    const { data, error } = await supabase
      .from("meditation_sessions")
      .insert({
        user_id: userId,
        started_at: sessionStart.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        meditation_type: selectedType,
      })
      .select("id, started_at, ended_at, duration_seconds, meditation_type, created_at")
      .single();

    setSaving(false);
    if (error) {
      setToastVariant("error");
      setToast(error.message);
      return;
    }
    setSessions((prev) => [data as Session, ...prev]);
    setSessionStart(null);
    setRemaining(0);
    setView("overview");
    setToastVariant("success");
    setToast("Session recorded");
  }

  function endEarly() {
    if (!sessionStart) return;
    const elapsed = Math.max(
      Math.round((Date.now() - sessionStart.getTime()) / 1000),
      1,
    );
    handleComplete(elapsed);
  }

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-6 pt-8">
          <p className="text-muted">Loading...</p>
        </div>
      </PageShell>
    );
  }

  const todaySessions = sessions.filter((s) => daysAgo(s.started_at) === 0);
  const weekSessions = sessions.filter((s) => daysAgo(s.started_at) <= 6);
  const monthSessions = sessions.filter((s) => daysAgo(s.started_at) <= 29);
  const totalSeconds = sessions.reduce((sum, s) => sum + s.duration_seconds, 0);

  const todayMinutes = Math.round(
    todaySessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 60,
  );
  const weekMinutes = Math.round(
    weekSessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 60,
  );

  const consistencyDays = Array.from({ length: 14 }, (_, i) => {
    const dateStr = todayLocal(-(13 - i));
    const hasSession = sessions.some((s) => localDateKey(new Date(s.started_at)) === dateStr);
    return { dateStr, hasSession };
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 pt-2">
        {view === "overview" && (
          <>
            <p className="mb-1 text-sm font-medium uppercase tracking-[0.08em] text-muted">
              Meditation
            </p>
            <h1 className="font-serif text-3xl italic text-foreground">
              A few still minutes, whenever you need them.
            </h1>

            <div className="mt-8 rounded-3xl bg-surface p-5">
              <p className="text-sm text-muted">
                {todaySessions.length > 0
                  ? `${todayMinutes} min · ${todaySessions.length} session${todaySessions.length > 1 ? "s" : ""} today`
                  : "Nothing yet today."}
              </p>
              <Button onClick={openSetup} className="mt-4">
                Start Meditation
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-surface p-4">
                <p className="text-2xl font-bold text-foreground">{weekSessions.length}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.06em] text-muted">
                  Sessions this week
                </p>
              </div>
              <div className="rounded-2xl bg-surface p-4">
                <p className="text-2xl font-bold text-foreground">{weekMinutes}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.06em] text-muted">
                  Minutes this week
                </p>
              </div>
              <div className="rounded-2xl bg-surface p-4">
                <p className="text-2xl font-bold text-foreground">{monthSessions.length}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.06em] text-muted">
                  Sessions this month
                </p>
              </div>
              <div className="rounded-2xl bg-surface p-4">
                <p className="text-2xl font-bold text-foreground">
                  {formatMinutes(Math.round(totalSeconds / 60))}
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.06em] text-muted">
                  Total time
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-xs uppercase tracking-[0.06em] text-muted">
                Last 14 days
              </p>
              <div className="flex gap-1.5">
                {consistencyDays.map((day) => (
                  <span
                    key={day.dateStr}
                    className={`h-2.5 w-2.5 rounded-full ${
                      day.hasSession ? "bg-accent" : "border border-foreground/15"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-surface p-4">
              <p className="text-sm text-foreground">WHOOP</p>
              {whoopStatus?.connected ? (
                <>
                  <p className="mt-1 text-xs text-muted">Connected</p>
                  <button
                    onClick={() => setDisconnectOpen(true)}
                    className="mt-3 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-1 text-xs text-muted">
                    Connect WHOOP to see how meditation relates to your recovery.
                  </p>
                  <a
                    href="/api/whoop/connect"
                    className="mt-3 inline-block text-sm text-accent transition-colors hover:text-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    Connect WHOOP
                  </a>
                </>
              )}
            </div>
          </>
        )}

        {view === "setup" && (
          <div>
            <button
              onClick={backToOverview}
              className="mb-6 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              ← Meditation
            </button>

            <h1 className="font-serif text-2xl italic text-foreground">
              Choose a duration
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {DURATIONS_MIN.map((min) => (
                <button
                  key={min}
                  onClick={() => {
                    setDurationMin(min);
                    setCustomMinutes("");
                  }}
                  className={`${chipBase} ${
                    !customMinutes.trim() && durationMin === min
                      ? "bg-accent text-black"
                      : "bg-surface text-foreground hover:bg-surface-2"
                  }`}
                >
                  {min} min
                </button>
              ))}
              <input
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Custom"
                inputMode="numeric"
                className="w-24 rounded-full border border-transparent bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted transition-[box-shadow,border-color] duration-150 focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
              />
            </div>

            <h2 className="mt-8 font-serif text-2xl italic text-foreground">
              Choose a style
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`${chipBase} ${
                    selectedType === type.value
                      ? "bg-accent text-black"
                      : "bg-surface text-foreground hover:bg-surface-2"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <Button onClick={startSession} className="mt-8">
              Begin
            </Button>
          </div>
        )}

        {view === "session" && (
          <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 text-center">
            <p className="text-sm uppercase tracking-[0.08em] text-muted">
              {TYPES.find((t) => t.value === selectedType)?.label}
            </p>
            <p className="font-serif text-7xl italic text-foreground">
              {formatClock(remaining)}
            </p>
            <Button variant="secondary" onClick={endEarly} disabled={saving}>
              End session
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={disconnectOpen}
        title="Disconnect WHOOP?"
        description="Your app will stop syncing recovery, sleep, and strain data. You can reconnect any time."
        confirmLabel={disconnecting ? "Disconnecting..." : "Disconnect"}
        onConfirm={handleDisconnect}
        onCancel={() => setDisconnectOpen(false)}
      />
      <Toast message={toast} onDismiss={() => setToast(null)} variant={toastVariant} />
    </PageShell>
  );
}
