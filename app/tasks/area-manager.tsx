"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { type Area } from "./types";

const MAX_AREAS = 6;

const SWATCHES = [
  "#7b93a8",
  "#b98a8a",
  "#8aab8f",
  "#c2a06b",
  "#a08cc0",
  "#8fa8a3",
  "#a8967b",
];

export function AreaManager({
  userId,
  areas,
  onBack,
  onChanged,
  onError,
}: {
  userId: string;
  areas: Area[];
  onBack: () => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const supabase = createClient();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(SWATCHES[0]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(SWATCHES[0]);
  const [editThreshold, setEditThreshold] = useState(7);

  const [deleteTarget, setDeleteTarget] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const defaultArea = areas.find((a) => a.is_default) ?? null;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || areas.length >= MAX_AREAS) return;
    setBusy(true);
    const { error } = await supabase.from("areas").insert({
      user_id: userId,
      name: newName.trim(),
      color: newColor,
      position: areas.length,
    });
    setBusy(false);
    if (error) {
      onError(error.message);
      return;
    }
    setNewName("");
    setAdding(false);
    onChanged();
  }

  function startEdit(area: Area) {
    setEditingId(area.id);
    setEditName(area.name);
    setEditColor(area.color);
    setEditThreshold(area.neglect_threshold_days);
  }

  async function handleEditSave(area: Area) {
    if (!editName.trim()) return;
    setBusy(true);
    const { error } = await supabase
      .from("areas")
      .update({
        name: editName.trim(),
        color: editColor,
        neglect_threshold_days: editThreshold,
      })
      .eq("id", area.id);
    setBusy(false);
    if (error) {
      onError(error.message);
      return;
    }
    setEditingId(null);
    onChanged();
  }

  async function confirmDelete() {
    if (!deleteTarget || !defaultArea) return;
    setBusy(true);

    const [tasksRes, goalsRes] = await Promise.all([
      supabase.from("tasks").update({ area_id: defaultArea.id }).eq("area_id", deleteTarget.id),
      supabase.from("goals").update({ area_id: defaultArea.id }).eq("area_id", deleteTarget.id),
    ]);

    if (tasksRes.error || goalsRes.error) {
      setBusy(false);
      onError((tasksRes.error ?? goalsRes.error)!.message);
      setDeleteTarget(null);
      return;
    }

    const { error } = await supabase.from("areas").delete().eq("id", deleteTarget.id);
    setBusy(false);
    setDeleteTarget(null);
    if (error) {
      onError(error.message);
      return;
    }
    onChanged();
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        ← Tasks
      </button>

      <h1 className="font-serif text-2xl italic text-foreground">Areas</h1>

      <ul className="mt-6 flex flex-col gap-2">
        {areas.map((area) => (
          <li key={area.id} className="rounded-2xl bg-surface p-4">
            {editingId === area.id ? (
              <div className="flex flex-col gap-3">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                <div className="flex gap-2">
                  {SWATCHES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      aria-label={c}
                      className={`h-6 w-6 rounded-full transition-transform ${
                        editColor === c ? "scale-110 ring-2 ring-foreground/40" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm text-muted">
                  Flag after
                  <input
                    type="number"
                    min={1}
                    value={editThreshold}
                    onChange={(e) => setEditThreshold(Number(e.target.value))}
                    className="w-16 rounded-lg border border-border bg-surface-2 px-2 py-1 text-foreground focus-visible:outline-none focus-visible:border-accent"
                  />
                  days quiet
                </label>
                <div className="flex gap-4 text-sm">
                  <button
                    onClick={() => handleEditSave(area)}
                    disabled={busy}
                    className="font-medium text-accent transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: area.color }}
                  />
                  <div>
                    <p className="text-foreground">
                      {area.name}
                      {area.is_default && (
                        <span className="ml-2 text-xs text-muted">Default</span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      Flags after {area.neglect_threshold_days} days quiet
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-4 text-sm text-muted">
                  <button
                    onClick={() => startEdit(area)}
                    className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    Edit
                  </button>
                  {!area.is_default && (
                    <button
                      onClick={() => setDeleteTarget(area)}
                      className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-3 rounded-2xl bg-surface p-4">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New area"
            autoFocus
          />
          <div className="flex gap-2">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                aria-label={c}
                className={`h-6 w-6 rounded-full transition-transform ${
                  newColor === c ? "scale-110 ring-2 ring-foreground/40" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-4 text-sm">
            <Button type="submit" disabled={busy || !newName.trim()} className="self-start">
              Add
            </Button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : areas.length < MAX_AREAS ? (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 text-sm text-accent transition-colors hover:text-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          + Add area
        </button>
      ) : (
        <p className="mt-4 text-sm text-muted">Six areas is the cap — remove one to add another.</p>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.name}?`}
        description={`Its tasks and goals move to ${defaultArea?.name ?? "the default area"}.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
