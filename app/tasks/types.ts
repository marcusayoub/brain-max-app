export type Area = {
  id: string;
  name: string;
  color: string;
  neglect_threshold_days: number;
  is_default: boolean;
  position: number;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  goal_id: string | null;
  area_id: string;
  status: "open" | "done" | "let_go";
  scheduled_date: string;
  carry_over_count: number;
  created_at: string;
  completed_at: string | null;
};

export type Goal = { id: string; statement: string; area_id: string | null };

export function areaLastActivity(areaId: string, tasks: Task[]): Date | null {
  let latest: Date | null = null;
  for (const t of tasks) {
    if (t.area_id !== areaId) continue;
    const created = new Date(t.created_at);
    if (!latest || created > latest) latest = created;
    if (t.completed_at) {
      const completed = new Date(t.completed_at);
      if (!latest || completed > latest) latest = completed;
    }
  }
  return latest;
}

export function areaLastCompletion(areaId: string, tasks: Task[]): Date | null {
  let latest: Date | null = null;
  for (const t of tasks) {
    if (t.area_id !== areaId || !t.completed_at) continue;
    const completed = new Date(t.completed_at);
    if (!latest || completed > latest) latest = completed;
  }
  return latest;
}

export function daysBetween(from: Date, to: Date): number {
  const startOfFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const startOfTo = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((startOfTo - startOfFrom) / 86400000);
}
